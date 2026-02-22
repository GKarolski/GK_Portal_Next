<?php
/**
 * GK Portal SaaS - Stripe Webhook Fortress
 * Securely handles successful payments and upgrades account limits.
 */

require_once '../config.php';
require_once '../vendor/autoload.php';
require_once '../lib/Mailer.php';

use Stripe\Stripe;
use Stripe\Webhook;

header("Content-Type: application/json; charset=UTF-8");


// --- LOGGING ---
function logWebhook($msg) {
    error_log('[Stripe Webhook] ' . $msg);
}

logWebhook("Webhook received. Method: " . $_SERVER['REQUEST_METHOD']);

// Prevent timeout during provisioning
ignore_user_abort(true);
set_time_limit(300); // 5 minutes

$payload = @file_get_contents('php://input');
$sig_header = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';
$endpoint_secret = STRIPE_WEBHOOK_SECRET;

if (empty($endpoint_secret)) {
    logWebhook("ERROR: STRIPE_WEBHOOK_SECRET is empty.");
    http_response_code(500);
    exit();
}

try {
    $event = Webhook::constructEvent(
        $payload, $sig_header, $endpoint_secret
    );
    logWebhook("Event verified: " . $event->type . " [ID: " . $event->id . "]");
} catch(\UnexpectedValueException $e) {
    logWebhook("ERROR: Invalid payload. Body: " . substr($payload, 0, 100));
    http_response_code(400);
    exit();
} catch(\Stripe\Exception\SignatureVerificationException $e) {
    logWebhook("ERROR: Signature Verification Failed.");
    http_response_code(400);
    exit();
}

// Set API Key from Config
Stripe::setApiKey(STRIPE_SECRET_KEY);

// Handle the event
if ($event->type === 'checkout.session.completed') {
    $session = $event->data->object;
    handleCheckoutSession($session);
} 
elseif ($event->type === 'customer.subscription.created') {
    $sub = $event->data->object;
    handleSubscriptionCreated($sub);
}
elseif ($event->type === 'invoice.paid') {
    $invoice = $event->data->object;
    handleInvoicePaid($invoice);
}
elseif ($event->type === 'customer.subscription.updated') {
     // Optional: Handle status changes
}

http_response_code(200);
echo json_encode(['status' => 'success']);

function handleSubscriptionCreated($sub) {
    global $master_pdo;
    $metadata = $sub->metadata;
    $tenantId = $metadata['tenant_id'] ?? null;
    
    if ($tenantId) {
        logWebhook("Subscription Created for Tenant $tenantId. Linking DB...");
        $stmt = $master_pdo->prepare("UPDATE saas_tenants SET stripe_subscription_id = ?, stripe_customer_id = ? WHERE id = ?");
        $stmt->execute([$sub->id, $sub->customer, $tenantId]);
    } else {
        logWebhook("WARNING: Subscription Created but no tenant_id in metadata.");
    }
}

/**
 * Handle Invoice Paid (Elements/Custom Flow)
 */
function handleInvoicePaid($invoice) {
    global $master_pdo;

    if ($invoice->billing_reason !== 'subscription_create' && $invoice->billing_reason !== 'subscription_cycle') {
        logWebhook("Invoice reason ignored: " . $invoice->billing_reason);
        return;
    }

    $subscriptionId = $invoice->subscription;
    
    // Handle object vs string for subscription
    if (is_object($subscriptionId) && isset($subscriptionId->id)) {
        $subscriptionId = $subscriptionId->id;
    }

    $customerId = $invoice->customer;
    $tenantId = null;
    $planId = null;

    // STRATEGY 1: Try to get Metadata from Subscription (if ID exists)
    if (!empty($subscriptionId)) {
        try {
            $subscription = \Stripe\Subscription::retrieve($subscriptionId);
            $metadata = $subscription->metadata;
            $tenantId = $metadata['tenant_id'] ?? null;
            $planId   = $metadata['plan_id'] ?? null;
        } catch (Exception $e) {
            logWebhook("Error retrieving subscription: " . $e->getMessage());
        }
    }

    // STRATEGY 2: If Tenant ID missing, Lookup by Customer ID in DB
    // (Relies on handleSubscriptionCreated having run previously)
    if (!$tenantId && $customerId) {
        logWebhook("Tenant ID missing. Falling back to DB Lookup by Customer ID: $customerId");
        $stmt = $master_pdo->prepare("SELECT id, plan_tier FROM saas_tenants WHERE stripe_customer_id = ? LIMIT 1");
        $stmt->execute([$customerId]);
        $row = $stmt->fetch();
        if ($row) {
            $tenantId = $row['id'];
            $planId = $planId ?: $row['plan_tier']; // Use DB plan if metadata missing
            logWebhook("DB Lookup Success: Tenant $tenantId found.");
        } else {
            logWebhook("DB Lookup Failed. No tenant found for Customer $customerId");
        }
    }

    if (!$tenantId || !$planId) {
        logWebhook("CRITICAL ERROR: Could not identify Tenant/Plan for Invoice " . $invoice->id);
        return;
    }

    logWebhook("Invoice Paid -> Provisioning for Tenant: $tenantId, Plan: $planId");
    
    // Use fallback ID if subscriptionId was null
    $finalSubId = $subscriptionId ?: 'sub_unknown_' . time(); 
    
    provisionSignup($tenantId, $planId, $customerId, $finalSubId);
}



/**
 * Perform the actual database upgrade
 */
function upgradeTenant($tenantId, $planId, $customerId, $subscriptionId) {
    global $master_pdo;
    
    if (!isset(PLAN_LIMITS[$planId])) {
        error_log("Webhook Error: Invalid Plan ID in metadata: $planId");
        return;
    }

    $limits = PLAN_LIMITS[$planId];

    try {
        // 1. UPDATE Master DB saas_tenants
        $stmt = $master_pdo->prepare("
            UPDATE saas_tenants 
            SET 
                plan_tier = ?,
                storage_limit_mb = ?,
                token_limit_monthly = ?,
                stripe_customer_id = ?,
                stripe_subscription_id = ?
            WHERE id = ?
        ");
        
        $stmt->execute([
            $planId,
            $limits['storage'],
            $limits['tokens'],
            $customerId,
            $subscriptionId,
            $tenantId
        ]);

        if ($stmt->rowCount() > 0) {
            // 2. FETCH Owner Email for notification
            $stmtEmail = $master_pdo->prepare("SELECT owner_email FROM saas_tenants WHERE id = ?");
            $stmtEmail->execute([$tenantId]);
            $ownerEmail = $stmtEmail->fetchColumn();

            if ($ownerEmail) {
                // 3. SEND NOTIFICATION
                require_once '../lib/Mailer.php';
                Mailer::send($ownerEmail, "Plan Zaktualizowany! - GK Portal", "email_notification", [
                    "name" => "Właścicielu",
                    "plan" => $planId,
                    "storage" => $limits['storage'] . " MB",
                    "tokens" => number_format($limits['tokens'], 0, ',', ' ')
                ]);
            }
        } else {
            error_log("Webhook Error: No tenant found with ID $tenantId or no changes made.");
        }

    } catch (Exception $e) {
        error_log("Webhook DB Error: " . $e->getMessage());
    }
}

/**
 * Provision a new tenant after signup payment
 */
function provisionSignup($tenantId, $planId, $customerId, $subscriptionId) {
    global $master_pdo;
    require_once '../saas_provision.php';

    logWebhook("--- START provisionSignup for Tenant $tenantId, Plan $planId ---");

    // Fetch owner info from Master
    $stmt = $master_pdo->prepare("SELECT owner_email, password_hash FROM saas_tenants WHERE id = ?");
    $stmt->execute([$tenantId]);
    $tenantData = $stmt->fetch();

    if (!$tenantData) {
        logWebhook("ERROR: Tenant $tenantId not found in Master DB.");
        return;
    }

    $company = 'Moja Firma'; // Default if not in metadata, or fetch from DB if needed

    try {
        logWebhook("Fetching limits for plan: $planId");
        $limits = PLAN_LIMITS[$planId] ?? PLAN_LIMITS['STARTER'];
        
        // 1. Double check if instance already exists (to prevent duplicate DBs on Stripe retries)
        $stmtCheck = $master_pdo->prepare("SELECT instance_id FROM saas_instances WHERE tenant_id = ?");
        $stmtCheck->execute([$tenantId]);
        $existingInstance = $stmtCheck->fetchColumn();

        if ($existingInstance) {
            logWebhook("Instance $existingInstance already exists for tenant $tenantId. Skipping provisionNewInstance.");
            $res = ['instance_id' => $existingInstance]; 
        } else {
            logWebhook("Calling provisionNewInstance...");
            // Use pre-hashed password from Master DB to ensure consistency
            $res = provisionNewInstance($tenantData['owner_email'], $company, '', $planId, $tenantData['password_hash']);
            logWebhook("Provisioning result: " . json_encode($res));
        }

        // 2. Update Tenant with Stripe info, PLAN LIMITS, and ACTIVE status
        logWebhook("Updating Master DB (activation, limits, customer_id)...");
        $stmtUpdate = $master_pdo->prepare("
            UPDATE saas_tenants 
            SET stripe_customer_id = ?, 
                stripe_subscription_id = ?, 
                plan_tier = ?, 
                storage_limit_mb = ?, 
                token_limit_monthly = ?,
                status = 'ACTIVE'
            WHERE id = ?
        ");
        
        $success = $stmtUpdate->execute([
            $customerId,
            $subscriptionId,
            $planId,
            $limits['storage'],
            $limits['tokens'],
            $tenantId
        ]);

        if ($success) {
            logWebhook("Master DB status updated to ACTIVE for Tenant $tenantId. Limits: " . $limits['storage'] . " MB.");
        } else {
            logWebhook("CRITICAL ERROR: Master DB update FAILED for Tenant $tenantId.");
        }

        // Send Welcome Email
        logWebhook("Sending welcome email to " . $tenantData['owner_email']);
        require_once '../lib/Mailer.php';
        Mailer::send($tenantData['owner_email'], "Witaj w GK Portal - Twoje konto jest aktywne!", "email_activation", [
            "name" => $company,
            "link" => "https://testgkportal.cfolks.pl/app"
        ]);
        
        logWebhook("--- END provisionSignup SUCCESS ---");

    } catch (Exception $e) {
        logWebhook("CRITICAL ERROR in provisionSignup: " . $e->getMessage());
        error_log("Webhook Provisioning Error: " . $e->getMessage());
    }
}
