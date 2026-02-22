<?php
// 1. SUPPRESS ALL OUTPUT EXCEPT JSON
error_reporting(0); 
ini_set('display_errors', 0);
ob_start();

// 2. LOAD DEPENDENCIES
require_once 'config.php';
require_once 'saas_provision.php';
require_once 'vendor/autoload.php';

if (session_status() === PHP_SESSION_NONE) session_start();
header("Content-Type: application/json; charset=UTF-8");

$input = json_decode(file_get_contents('php://input'), true);
$action = $input['action'] ?? null;

try {
    if (!isset($master_pdo)) {
        throw new Exception("Konfiguracja Master DB jest nieprawidłowa.");
    }

    if ($action === 'step1') {
        // --- STEP 1: VALIDATION & SESSION STORAGE ---
        $email = isset($input['email']) ? strtolower(trim($input['email'])) : null;
        $company = $input['company'] ?? null;
        $password = $input['password'] ?? null;

        if (!$email || !$company || !$password) {
            throw new Exception("Wszystkie pola są wymagane.");
        }

        // Check if email already exists and is ACTIVE
        $stmt = $master_pdo->prepare("SELECT id, status FROM saas_tenants WHERE owner_email = ?");
        $stmt->execute([$email]);
        $existing = $stmt->fetch();

        if ($existing && $existing['status'] === 'ACTIVE') {
            throw new Exception("Ten email jest już zarejestrowany. Przejdź do logowania.");
        }

        // Store in session for Step 2
        $_SESSION['signup_data'] = [
            'email' => $email,
            'company' => $company,
            'password_hash' => password_hash($password, PASSWORD_DEFAULT)
        ];

        ob_end_clean();
        echo json_encode(['success' => true]);
        exit;
    }

    if ($action === 'stripe') {
        // --- STEP 2: ACCOUNT CREATION (PENDING) & STRIPE REDIRECT ---
        $signup = $_SESSION['signup_data'] ?? null;
        $plan = strtoupper($input['plan'] ?? 'STARTER');

        if (!$signup) {
            throw new Exception("Brak danych rejestracji. Zacznij od początku.");
        }

        $email = $signup['email'];
        $company = $signup['company'];
        $password_hash = $signup['password_hash'];

        $redirectUrl = '';
        $tenant_id = null;

        // Check if tenant exists and is pending
        $stmt = $master_pdo->prepare("SELECT id, status FROM saas_tenants WHERE owner_email = ?");
        $stmt->execute([$email]);
        $existing = $stmt->fetch();

        if ($existing) {
            if ($existing['status'] === 'ACTIVE') {
                throw new Exception("Konto jest już aktywne. Zaloguj się.");
            }
            // UPDATE existing pending account
            $tenant_id = $existing['id'];
            $stmt = $master_pdo->prepare("UPDATE saas_tenants SET password_hash = ?, plan_tier = ?, status = 'PENDING_PAYMENT' WHERE id = ?");
            $stmt->execute([$password_hash, $plan, $tenant_id]);
        } else {
            // INSERT new pending account
            $stmt = $master_pdo->prepare("INSERT INTO saas_tenants (owner_email, password_hash, plan_tier, status) VALUES (?, ?, ?, 'PENDING_PAYMENT')");
            $stmt->execute([$email, $password_hash, $plan]);
            $tenant_id = $master_pdo->lastInsertId();
        }

        // ENFORCE PAYWALL: All plans are paid, no free tier.
        // Redirect ALL plans to Internal Checkout
        $_SESSION['tenant_id'] = $tenant_id;
        
        // Refresh signup details in session
        if (!isset($_SESSION['signup_data'])) {
            $_SESSION['signup_data'] = [
                'email' => $email,
                'company' => $company
            ];
        }
        
        $redirectUrl = '/checkout?plan=' . $plan;

        ob_end_clean();
        echo json_encode([
            'success' => true,
            'redirect' => $redirectUrl
        ]);
        exit;
    }

    throw new Exception("Nieprawidłowa akcja.");

} catch (Exception $e) {
    ob_end_clean();
    error_log('register_process error: ' . $e->getMessage());
    http_response_code(500);
    // User-facing validation errors are thrown as Exceptions with safe messages
    // But we still genericize to prevent any PDO/system message leak
    $safeMessages = [
        'Wszystkie pola są wymagane.',
        'Ten email jest już zarejestrowany. Przejdź do logowania.',
        'Konto jest już aktywne. Zaloguj się.',
        'Brak danych rejestracji. Zacznij od początku.',
        'Nieprawidłowa akcja.'
    ];
    $msg = in_array($e->getMessage(), $safeMessages) ? $e->getMessage() : 'Błąd serwera.';
    echo json_encode(['error' => $msg]);
}
?>
