<?php
// GK Portal SaaS - Smart Config
// Obsługa Multi-Tenant (Database-per-Tenant)

// --- SESSION HARDENING ---
if (session_status() === PHP_SESSION_NONE) {
    // Security: Secure cookie parameters
    // Detect HTTPS (including proxies)
    $is_https = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') 
             || (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https');
    
    ini_set('session.cookie_httponly', 1);
    ini_set('session.cookie_secure', $is_https ? 1 : 0); 
    ini_set('session.cookie_samesite', 'Lax');
    ini_set('session.gc_maxlifetime', 86400); // 24 hours
    
    // Explicitly set cookie params to ensure consistency
    // FIX: Removed 'domain' to let browser handle it (fixes refresh logout issue)
    session_set_cookie_params([
        'lifetime' => 86400,
        'path' => '/',
        'secure' => $is_https,
        'httponly' => true,
        'samesite' => 'Lax'
    ]);
    
    session_start();
}

// === LOAD SECRETS FROM .env.php (outside public/ for security) ===
$_ENV_FILE = __DIR__ . '/../.env.php';
if (!file_exists($_ENV_FILE)) {
    error_log('CRITICAL: .env.php not found at ' . realpath(__DIR__ . '/../..') . '/.env.php');
    http_response_code(500);
    die(json_encode(['error' => 'Server configuration error.']));
}
$_SECRETS = require $_ENV_FILE;

// 1. MASTER DATABASE CREDENTIALS
define('MASTER_DB_HOST', $_SECRETS['MASTER_DB_HOST']);
define('MASTER_DB_USER', $_SECRETS['MASTER_DB_USER']);
define('MASTER_DB_PASS', $_SECRETS['MASTER_DB_PASS']);
define('MASTER_DB_NAME', $_SECRETS['MASTER_DB_NAME']);

// 2. KONFIGURACJA E-MAIL
define('MAIL_FROM', 'powiadomienia@gramyostro.com');
define('MAIL_SENDER_NAME', 'GK Digital SaaS');

// 2.1 SMTP CONFIGURATION
define('SMTP_HOST', $_SECRETS['SMTP_HOST']);
define('SMTP_USER', $_SECRETS['SMTP_USER']);
define('SMTP_PASS', $_SECRETS['SMTP_PASS']);
define('SMTP_PORT', $_SECRETS['SMTP_PORT']);
define('SMTP_SECURE', $_SECRETS['SMTP_SECURE']);

// 2.2 STRIPE CONFIGURATION
define('STRIPE_SECRET_KEY', $_SECRETS['STRIPE_SECRET_KEY']);
define('STRIPE_PUBLISHABLE_KEY', $_SECRETS['STRIPE_PUBLISHABLE_KEY']);
define('STRIPE_WEBHOOK_SECRET', $_SECRETS['STRIPE_WEBHOOK_SECRET']);

// 2.3 PLAN LIMITS
const PLAN_LIMITS = [
    'STARTER'  => ['storage' => 1024,   'tokens' => 100000],
    'STANDARD' => ['storage' => 5120,   'tokens' => 500000],
    'AGENCY'   => ['storage' => 102400, 'tokens' => 2000000]
];

// STRIPE PRICE CONFIGURATION
define('PRICE_STARTER', 'price_1T0KsDJQcFY2PeiP4hMVVXYa'); 
define('PRICE_STANDARD', 'price_1T0KsvJQcFY2PeiPZ6qPTWyO');
define('PRICE_AGENCY', 'price_1T0KtIJQcFY2PeiPZzKgAamL');

// 3. AI CONFIGURATION
define('GEMINI_API_KEY', $_SECRETS['GEMINI_API_KEY']);

// 4. DIRECTADMIN API (Dla Provisioningu)
define('DA_HOST', $_SECRETS['DA_HOST']);
define('DA_PORT', $_SECRETS['DA_PORT']);
define('DA_LOGIN', $_SECRETS['DA_LOGIN']);
define('DA_PASS', $_SECRETS['DA_PASS']);

// Clear secrets from memory
unset($_SECRETS, $_ENV_FILE);

// 5. ALWAYS CONNECT TO MASTER DB (For generic SaaS operations)
try {
    $master_pdo = new PDO("mysql:host=".MASTER_DB_HOST.";dbname=".MASTER_DB_NAME.";charset=utf8mb4", MASTER_DB_USER, MASTER_DB_PASS);
    $master_pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $master_pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    error_log("SaaS Critical: Could not connect to Master DB: " . $e->getMessage());
}

// --- CORS SECURITY ---
$allowed_origins = [
    'https://testgkportal.cfolks.pl',
    'https://gramyostro.com',
    'http://localhost:5173'
];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: $origin");
    header("Access-Control-Allow-Credentials: true");
}
// No fallback — same-origin requests don't need CORS headers

header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// LOGIKA WYBORU BAZY DANYCH
$db_host = defined('MASTER_DB_HOST') ? MASTER_DB_HOST : 'localhost';
$db_user = defined('MASTER_DB_USER') ? MASTER_DB_USER : 'root';
$db_pass = defined('MASTER_DB_PASS') ? MASTER_DB_PASS : '';
$db_name = defined('MASTER_DB_NAME') ? MASTER_DB_NAME : 'gk_portal';
$upload_subfolder = 'global';

// Sprawdzenie czy jesteśmy w kontekście konkretnego Tenanta
$instance_id = $_SESSION['tenant_instance_id'] ?? null;

// Jeśli mamy ID instancji, szukamy jej danych w bazie Master (używając $master_pdo)
if ($instance_id && isset($master_pdo)) {
    try {
        $stmt = $master_pdo->prepare("SELECT * FROM saas_instances WHERE instance_id = ?");
        $stmt->execute([$instance_id]);
        $instance = $stmt->fetch();

        if ($instance) {
            $db_host = $instance['db_host'];
            $db_user = $instance['db_user'];
            $db_pass = $instance['db_pass'];
            $db_name = $instance['db_name'];
            $upload_subfolder = $instance['upload_dir'];
            
            // Zapisujemy w sesji dla ciągłości
            $_SESSION['tenant_instance_id'] = $instance_id;
        }
    } catch (PDOException $e) {
        error_log("SaaS Error: Master DB Lookup Failed: " . $e->getMessage());
    }
}

// 5. DEFINIOWANIE ŚCIEŻEK UPLOADU (Dynamicznie dla Tenanta)
$base_upload = __DIR__ . '/../uploads/';
$instance_folder = $upload_subfolder ?: 'global';

define('UPLOAD_ROOT', $base_upload . $instance_folder . '/');
define('UPLOAD_URL', '/uploads/' . $instance_folder . '/');

// 6. INICJALIZACJA GŁÓWNEGO POŁĄCZENIA PDO (Może być Master lub Tenant)
try {
    $pdo = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8mb4", $db_user, $db_pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    $pdo->setAttribute(PDO::MYSQL_ATTR_INIT_COMMAND, "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci");
} catch(PDOException $e) {
    error_log("DB Connection Error ($db_name): " . $e->getMessage());
    die(json_encode(["error" => "Błąd połączenia z bazą danych. Spróbuj za chwilę."]));
}
?>