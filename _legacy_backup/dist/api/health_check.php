<?php
/**
 * GK Portal SaaS - System Health Check
 * Monitoring endpoint for UptimeRobot or manual verification.
 */

header("Content-Type: application/json; charset=UTF-8");
require_once 'config.php';

$results = [
    'status' => 'OK',
    'timestamp' => date('Y-m-d H:i:s'),
    'checks' => []
];

// 1. Database Connection
try {
    $pdo->query("SELECT 1");
    $results['checks']['database'] = 'CONNECTED';
} catch (Exception $e) {
    $results['status'] = 'ERROR';
    $results['checks']['database'] = 'FAILED';
    error_log('health_check DB error: ' . $e->getMessage());
}

// 2. Stripe Configuration
$hasStripe = (defined('STRIPE_SECRET_KEY') && !empty(STRIPE_SECRET_KEY) && STRIPE_SECRET_KEY !== 'TODO');
$results['checks']['stripe_config'] = $hasStripe ? 'CONFIGURED' : 'PENDING';

// 3. Backup Directory (Relative to public/api)
$backupPath = __DIR__ . '/../../backups/';
if (file_exists($backupPath)) {
    $results['checks']['backup_folder'] = is_writable($backupPath) ? 'WRITABLE' : 'READ_ONLY';
} else {
    $results['checks']['backup_folder'] = 'MISSING';
}

// 4. Critical Files Security (Sanity check)
$criticalFiles = ['payment_test.php', 'debug_stripe_db.php', 'migrate.php'];
$insecureFiles = [];
foreach ($criticalFiles as $file) {
    if (file_exists(__DIR__ . '/../' . $file)) {
        $insecureFiles[] = $file;
    }
}
if (!empty($insecureFiles)) {
    $results['checks']['security_warning'] = 'Dev scripts still present: ' . implode(', ', $insecureFiles);
    // We don't fail the health check, just warn.
}

if ($results['status'] !== 'OK') {
    http_response_code(503);
}

echo json_encode($results, JSON_PRETTY_PRINT);
