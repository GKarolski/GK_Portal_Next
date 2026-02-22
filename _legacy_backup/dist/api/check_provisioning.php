<?php
/**
 * GK Portal SaaS - Provisioning Status Poller
 * Used by the frontend after payment to check if instance is ready.
 */
require_once 'config.php';
header("Content-Type: application/json; charset=UTF-8");

// Session already started by config.php

$signup = $_SESSION['signup_data'] ?? null;
$email = $signup['email'] ?? $_SESSION['owner_email'] ?? null;

if ($email) {
    $email = strtolower(trim($email));
}

if (!$email) {
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

try {
    if (!isset($master_pdo)) throw new Exception("Master DB Offline");

    // Check status in Master DB (email-only lookup)
    $stmt = $master_pdo->prepare("
        SELECT t.id, t.status, i.instance_id 
        FROM saas_tenants t
        LEFT JOIN saas_instances i ON t.id = i.tenant_id
        WHERE t.owner_email = ?
    ");
    $stmt->execute([$email]);
    $data = $stmt->fetch();



    if (!$data) {
        throw new Exception("Account not found");
    }

    $isReady = ($data['status'] === 'ACTIVE' && !empty($data['instance_id']));

    if ($isReady) {
        // Prepare session for first-time use
        $_SESSION['tenant_instance_id'] = $data['instance_id'];
        // We'll need user_id too, but we can't easily get it here without connecting to tenant DB
        // So we just return success and let the next check_auth call handle it.
    }

    echo json_encode([
        'status' => $data['status'],
        'ready' => $isReady
    ]);

} catch (Exception $e) {
    error_log('check_provisioning error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Błąd serwera.']);
}
?>
