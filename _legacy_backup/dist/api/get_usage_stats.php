<?php
/**
 * GK Portal SaaS - Get Usage Stats API
 * Returns current usage for Storage & AI Tokens vs Limits.
 */

require_once 'config.php';
require_once 'saas_limits.php';

header("Content-Type: application/json; charset=UTF-8");

// 1. Auth Check
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

// 2. Instance Check
$instanceId = $_SESSION['tenant_instance_id'] ?? null;
if (!$instanceId) {
    echo json_encode(['error' => 'No active instance']);
    exit;
}

try {
    // 3. Instantiate Limits (with Master DB connection)
    // Note: $master_pdo comes from config.php if configured correctly, 
    // but SaaS_Limits has a fallback connection logic if constructor param is null.
    $limits = new SaaS_Limits($master_pdo ?? null, $instanceId);
    
    $stats = $limits->getUsageStats();

    if ($stats) {
        echo json_encode(['success' => true, 'data' => $stats]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Could not load tenant data']);
    }

} catch (Exception $e) {
    error_log('get_usage_stats error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Błąd serwera.']);
}
?>
