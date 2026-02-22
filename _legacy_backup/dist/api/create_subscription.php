<?php
// api/create_subscription.php
/**
 * GK Portal SaaS - Create Subscription (Post-Setup)
 * Called after Checkout.tsx successfully confirms SetupIntent.
 */

require_once 'config.php';
require_once 'vendor/autoload.php';

error_reporting(0);
ini_set('display_errors', 0);
ob_start();

header("Content-Type: application/json; charset=UTF-8");

if (session_status() === PHP_SESSION_NONE) session_start();

$input = json_decode(file_get_contents('php://input'), true);
$setupIntentId = $input['setup_intent_id'] ?? '';
$planId        = strtoupper($input['plan_id'] ?? '');

try {
    // 1. Verify basics
    if (!$setupIntentId || !$planId) {
        throw new Exception("Brak danych (SetupIntent lub Plan).");
    }

    $signupData = $_SESSION['signup_data'] ?? null;
    $tenantId   = $_SESSION['tenant_id'] ?? null;

    if (!$signupData || !$tenantId) {
        throw new Exception("Sesja wygasła. Zaloguj się ponownie.");
    }

    if (!defined('STRIPE_SECRET_KEY')) {
        throw new Exception("Błąd konfiguracji kluczy Stripe.");
    }
    \Stripe\Stripe::setApiKey(STRIPE_SECRET_KEY);

    // 2. Retrieve SetupIntent to get Payment Method
    $setupIntent = \Stripe\SetupIntent::retrieve($setupIntentId);
    $paymentMethodId = $setupIntent->payment_method;
    $customerId = $setupIntent->customer;

    if (!$paymentMethodId) {
        throw new Exception("SetupIntent nie ma przypisanej metody płatności.");
    }

    // 3. Resolve Price ID
    $priceMap = [
        'STANDARD' => PRICE_STANDARD,
        'AGENCY'   => PRICE_AGENCY
    ];
    $priceId = $priceMap[$planId] ?? null;
    if (!$priceId) throw new Exception("Nieznany plan: $planId");

    // 4. Attach Payment Method to Customer as Default
    \Stripe\Customer::update($customerId, [
        'invoice_settings' => ['default_payment_method' => $paymentMethodId]
    ]);

    // 5. Create Subscription (Now safe because default payment method exists)
    $subscription = \Stripe\Subscription::create([
        'customer' => $customerId,
        'items' => [['price' => $priceId]],
        'expand' => ['latest_invoice.payment_intent'],
        'metadata' => [
            'tenant_id' => $tenantId,
            'plan_id'   => $planId,
            'company'   => $signupData['company']
        ]
    ]);

    // 6. Check status
    if ($subscription->status === 'active' || $subscription->status === 'trialing') {
         // Success!
    } else {
        // Retrieve PI status if incomplete
         $invoice = $subscription->latest_invoice;
         if ($invoice->payment_intent && $invoice->payment_intent->status === 'requires_action') {
              throw new Exception("Wymagana dodatkowa autoryzacja 3DS. (Obsługa TODO)");
         }
    }

    ob_end_clean();
    echo json_encode([
        'subscriptionId' => $subscription->id,
        'status'         => $subscription->status
    ]);

} catch (Exception $e) {
    ob_end_clean();
    error_log('Subscription Error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Błąd subskrypcji. Spróbuj ponownie.']);
}
