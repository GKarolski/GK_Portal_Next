<?php
/**
 * GK Portal SaaS - Get Usage Stats
 * Returns current plan, storage usage, and token usage for the Billing UI.
 */

require_once '../config.php';

header("Content-Type: application/json; charset=UTF-8");

// 1. AUTH CHECK
if (!isset($_SESSION['tenant_id'])) {
    http_response_code(401);
    die(json_encode(['error' => 'Unauthorized']));
}

$tenantId = $_SESSION['tenant_id'];

try {
    // 2. FETCH DATA FROM MASTER DB
    if (!isset($master_pdo)) {
         throw new Exception("Master DB connection missing.");
    }

    $stmt = $master_pdo->prepare("
        SELECT 
            plan_tier, 
            storage_used_mb, 
            storage_limit_mb, 
            tokens_used_month, 
            token_limit_monthly 
        FROM saas_tenants 
        WHERE id = ?
    ");
    $stmt->execute([$tenantId]);
    $data = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$data) {
        http_response_code(404);
        die(json_encode(['error' => 'Tenant data not found']));
    }

    // 3. FORMAT RESPONSE
    echo json_encode([
        'plan_tier' => $data['plan_tier'] ?? 'STARTER',
        'storage_used_mb' => (float)$data['storage_used_mb'],
        'storage_limit_mb' => (int)$data['storage_limit_mb'],
        'tokens_used' => (int)$data['tokens_used_month'],
        'token_limit' => (int)$data['token_limit_monthly'],
        'stripe_status' => 'active' // Placeholder for future integration
    ]);

} catch (Exception $e) {
    error_log('settings/get_usage error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Błąd serwera.']);
}
