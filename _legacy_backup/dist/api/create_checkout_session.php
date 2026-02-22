<?php
/**
 * GK Portal SaaS - Create Stripe Checkout Session
 * Handles plan upgrades for existing logged-in owners.
 */

require_once 'config.php';
require_once 'vendor/autoload.php';

use Stripe\Stripe;
use Stripe\Checkout\Session;

header("Content-Type: application/json; charset=UTF-8");

// 1. SECURITY CHECK: Must be logged in as an Owner
if (!isset($_SESSION['user_id']) || !isset($_SESSION['tenant_id']) || !isset($_SESSION['is_owner']) || $_SESSION['is_owner'] !== true) {
    http_response_code(401);
    die(json_encode(['error' => 'Unauthorized. Only account owners can upgrade plans.']));
}

$tenantId = $_SESSION['tenant_id'];

// 2. INPUT VALIDATION
$method = $_SERVER['REQUEST_METHOD'];
if ($method !== 'POST') {
    http_response_code(405);
    die(json_encode(['error' => 'Method Not Allowed']));
}

$input = json_decode(file_get_contents('php://input'), true);
$planId = strtoupper($input['plan_id'] ?? '');

if (!array_key_exists($planId, PLAN_LIMITS)) {
    http_response_code(400);
    die(json_encode(['error' => 'Invalid Plan ID']));
}

// 3. STRIPE INITIALIZATION
if (!defined('STRIPE_SECRET_KEY') || empty(STRIPE_SECRET_KEY)) {
    http_response_code(500);
    die(json_encode(['error' => 'Stripe is not configured.']));
}

Stripe::setApiKey(STRIPE_SECRET_KEY);

try {
    // 4. MAP PLAN TO PRICE ID (Defined in config.php)
    $priceMap = [
        'STARTER'  => PRICE_STARTER,
        'STANDARD' => PRICE_STANDARD,
        'AGENCY'   => PRICE_AGENCY
    ];

    $priceId = $priceMap[$planId];

    // 5. CREATE CHECKOUT SESSION
    $baseUrl = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http") . "://$_SERVER[HTTP_HOST]";
    $instanceId = $_SESSION['tenant_instance_id'] ?? '';
    
    $checkoutSession = Session::create([
        'payment_method_types' => ['card'],
        'line_items' => [[
            'price' => $priceId,
            'quantity' => 1,
        ]],
        'mode' => 'subscription',
        'success_url' => $baseUrl . '/app/settings/billing?session_id={CHECKOUT_SESSION_ID}&status=success&instance=' . $instanceId,
        'cancel_url' => $baseUrl . '/app/settings/billing?status=cancelled&instance=' . $instanceId,
        'metadata' => [
            'tenant_id' => $tenantId,
            'plan_id'   => $planId,
            'action'    => 'upgrade'
        ],
        'customer_email' => $_SESSION['owner_email'] ?? null, 
    ]);

    echo json_encode(['url' => $checkoutSession->url]);

} catch (\Exception $e) {
    error_log('Stripe Checkout Error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Błąd płatności. Spróbuj ponownie.']);
}
