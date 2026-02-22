<?php
// public/api/create_payment_intent.php
/**
 * GK Portal SaaS - Create Payment Intent (Standard Subscription Flow)
 * Implements strict user-requested logic for 'incomplete' subscription.
 */

require_once 'config.php';
require_once 'vendor/autoload.php';

// Suppress output
error_reporting(0);
ini_set('display_errors', 0);
ob_start();

header("Content-Type: application/json; charset=UTF-8");

if (session_status() === PHP_SESSION_NONE) session_start();

$input = json_decode(file_get_contents('php://input'), true);
$planId = strtoupper($input['plan_id'] ?? '');

try {
    // 1. Verify Session & Config
    // ADAPTATION: Use tenant_id from session (v1.2.1 logic)
    $tenantID = $_SESSION['tenant_id'] ?? null;
    $signupData = $_SESSION['signup_data'] ?? null;

    if (!$tenantID) {
        throw new Exception("Brak identyfikatora tenanta w sesji. Zaloguj się ponownie.");
    }
    
    if (!defined('STRIPE_SECRET_KEY') || !STRIPE_SECRET_KEY) {
        throw new Exception("Błąd konfiguracji serwera: Brak kluczy Stripe.");
    }
    \Stripe\Stripe::setApiKey(STRIPE_SECRET_KEY);
    \Stripe\Stripe::setApiVersion('2023-10-16');

    // 2. Create/Retrieve Customer
    // Retrieve Tenant Data from DB to be sure
    // master_pdo is available from config.php loaded at line 8
    if (!isset($master_pdo)) throw new Exception("Błąd połączenia z bazą Master.");

    $stmt = $master_pdo->prepare("SELECT owner_email, stripe_customer_id FROM saas_tenants WHERE id = ?");
    $stmt->execute([$tenantID]);
    $tenant = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$tenant) throw new Exception('Nie znaleziono danych konta.');

    $email = $tenant['owner_email'];
    $stripeCustomerId = $tenant['stripe_customer_id'];
    $customer = null;

    if ($stripeCustomerId) {
        try {
            $customer = \Stripe\Customer::retrieve($stripeCustomerId);
        } catch (Exception $e) { /* Ignore if not found, create new */ }
    }

    if (!$customer) {
        $customer = \Stripe\Customer::create([
            'email' => $email,
            'metadata' => ['tenant_id' => $tenantID]
        ]);
        
        // Save new Customer ID
        $stmt = $master_pdo->prepare("UPDATE saas_tenants SET stripe_customer_id = ? WHERE id = ?");
        $stmt->execute([$customer->id, $tenantID]);
    }

    // 3. Resolve Price ID
    $priceMap = [
        'STANDARD' => PRICE_STANDARD,
        'AGENCY'   => PRICE_AGENCY
    ];
    $priceId = $priceMap[$planId] ?? null;
    if (!$priceId) throw new Exception("Nieznany plan: $planId");

    // 4. Create Subscription (STANDARD FLOW)
    // API Version 2023-10-16 set above handles default_incomplete better.
    $subscription = \Stripe\Subscription::create([
        'customer' => $customer->id,
        'items' => [['price' => $priceId]],
        'payment_behavior' => 'default_incomplete',
        'payment_settings' => [
            'save_default_payment_method' => 'on_subscription',
            // 'payment_method_types' => ['card'], // Removed to allow user selection in Elements
        ],
        // 'automatic_tax' => ['enabled' => true], // Removed to avoid Address requirement
        'expand' => ['latest_invoice.payment_intent'],
        'metadata' => [
            'tenant_id' => $tenantID, // CRITICAL: Used by Webhook to provision/update Tenant
            'plan_id'   => $planId
        ]
    ]);

    // 5. Extract Client Secret safely
    $invoice = $subscription->latest_invoice;
    $payment_intent = $invoice->payment_intent;

    // Safety fallback: If PI is ID string or null (rare race condition), try to fetch
    if (!$payment_intent && $invoice->id) {
         $invoice = \Stripe\Invoice::retrieve($invoice->id, ['expand' => ['payment_intent']]);
         $payment_intent = $invoice->payment_intent;
    }

    if (!$payment_intent) {
        throw new Exception("Stripe failed to generate a PaymentIntent for Invoice: " . $invoice->id);
    }

    // Handle case where PI is still just an ID string
    $clientSecret = null;
    if (is_string($payment_intent)) {
        $piObj = \Stripe\PaymentIntent::retrieve($payment_intent);
        $clientSecret = $piObj->client_secret;
    } else {
        $clientSecret = $payment_intent->client_secret;
    }

    ob_end_clean();
    echo json_encode([
        'subscriptionId' => $subscription->id,
        'clientSecret'   => $clientSecret,
        // Including these so the Frontend doesn't break
        'tenantId'       => $tenantID,
        'publishableKey' => STRIPE_PUBLISHABLE_KEY
    ]);

} catch (Exception $e) {
    ob_end_clean();
    error_log('Payment Intent Error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Błąd tworzenia płatności. Spróbuj ponownie.']);
}
