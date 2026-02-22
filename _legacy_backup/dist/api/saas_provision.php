<?php
/**
 * GK Portal SaaS - System Provisioningu (Faza 2)
 * Odpowiada za rejestrację nowego tenanta, tworzenie bazy przez DirectAdmin API,
 * import schematu MVP oraz tworzenie folderów uploadu.
 */

require_once __DIR__ . '/config.php';

// Jeśli plik jest zainkludowany, nie wykonujemy logiki POST automatycznie
if (basename(__FILE__) === basename($_SERVER['SCRIPT_FILENAME'])) {
    executeProvisioning($pdo);
}

// --- LOGGING ---
function logProvision($msg) {
    error_log('[SaaS Provision] ' . $msg);
}

/**
 * Core Provisioning Logic
 * Can be called from register_process.php (Starter) or stripe_webhook.php (Paid)
 */
function provisionNewInstance($email, $company, $password, $plan = 'STARTER', $hashedPassword = null) {
    global $master_pdo;

    $email = strtolower(trim($email));
    $plan = strtoupper($plan);

    // 1. Get/Create Tenant in Master
    $stmt = $master_pdo->prepare("SELECT id, password_hash FROM saas_tenants WHERE owner_email = ?");
    $stmt->execute([$email]);
    $existing = $stmt->fetch();

    if ($existing) {
        $tenant_id = $existing['id'];
        $final_hash = $hashedPassword ?: $existing['password_hash'];
    } else {
        $final_hash = $hashedPassword ?: password_hash($password, PASSWORD_DEFAULT);
        $stmt = $master_pdo->prepare("INSERT INTO saas_tenants (owner_email, password_hash, plan_tier) VALUES (?, ?, ?)");
        $stmt->execute([$email, $final_hash, $plan]);
        $tenant_id = $master_pdo->lastInsertId();
    }

    // 2. Generate Instance Identity
    $suffix = bin2hex(random_bytes(3));
    $instance_id = "gk_inst_" . $suffix;
    $db_name_short = "inst_" . $suffix;

    // 3. Create DB via DirectAdmin
    logProvision("Creating Database via DA: $db_name_short");
    $da_res = createDatabaseDA($db_name_short, MASTER_DB_USER);
    if (isset($da_res['error']) && $da_res['error'] !== "0") {
        throw new Exception("DirectAdmin Error: " . ($da_res['text'] ?? 'Unknown API Error'));
    }
    logProvision("Database created. Waiting 5s for propagation...");
    
    // WAIT FOR PROPAGATION (Critical Fix for "Empty DB" issue)
    sleep(5);

    $full_db_name = DA_LOGIN . "_" . $db_name_short;
    $full_db_user = MASTER_DB_USER;
    $full_db_pass = MASTER_DB_PASS;

    // 4. Register Instance in Master
    $stmt = $master_pdo->prepare("INSERT INTO saas_instances (tenant_id, instance_id, db_name, db_user, db_pass, upload_dir) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->execute([$tenant_id, $instance_id, $full_db_name, $full_db_user, $full_db_pass, $instance_id]);

    // 5. Setup Folders
    $upload_path = __DIR__ . "/../uploads/" . $instance_id;
    if (!file_exists($upload_path)) mkdir($upload_path, 0755, true);

    // 6. Schema Import with RETRY LOGIC
    $schema_path = realpath(__DIR__ . '/mvp_schema.sql');
    if (!$schema_path || !file_exists($schema_path)) {
        // Fallback: try raw path
        $schema_path = __DIR__ . '/mvp_schema.sql';
        if (!file_exists($schema_path)) {
            logProvision("CRITICAL: Schema file not found at: " . $schema_path);
            throw new Exception("Missing mvp_schema.sql at: " . $schema_path);
        }
    }
    $schema_sql = file_get_contents($schema_path);
    
    logProvision("Connecting to new Tenant DB: $full_db_name...");
    
    $tenant_pdo = null;
    $attempts = 0;
    while ($attempts < 3) {
        try {
            $tenant_pdo = new PDO("mysql:host=localhost;dbname=$full_db_name;charset=utf8mb4", $full_db_user, $full_db_pass);
            $tenant_pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            break; // Connected!
        } catch (PDOException $e) {
            $attempts++;
            logProvision("Connection attempt $attempts failed: " . $e->getMessage());
            if ($attempts >= 3) throw new Exception("Failed to connect to new DB after 3 attempts: " . $e->getMessage());
            sleep(3);
        }
    }

    logProvision("Importing Schema...");
    try {
        $tenant_pdo->exec($schema_sql);
        logProvision("Schema Imported Successfully.");
    } catch (Exception $e) {
        logProvision("Schema Import FAILED: " . $e->getMessage());
        throw $e;
    }
    
    // Clear potential collisions in new database
    $tenant_pdo->exec("DELETE FROM users WHERE id = 'admin_01' OR email = " . $tenant_pdo->quote($email));

    // 7. Initial Org & User Setup
    $org_id = 'org_' . time();
    $admin_uid = 'u_owner_' . $tenant_id;

    $stmtOrg = $tenant_pdo->prepare("INSERT INTO organizations (id, name, vip_status) VALUES (?, ?, ?)");
    $stmtOrg->execute([$org_id, $company, ($plan === 'AGENCY' ? 'VIP' : 'STANDARD')]);

    $stmtUser = $tenant_pdo->prepare("INSERT INTO users (id, name, email, password, role, organization_id, role_in_org, is_active) VALUES (?, 'Właściciel', ?, ?, 'ADMIN', ?, 'OWNER', 1)");
    $stmtUser->execute([$admin_uid, $email, $final_hash, $org_id]);

    return [
        'tenant_id' => $tenant_id,
        'instance_id' => $instance_id,
        'admin_uid' => $admin_uid
    ];
}

function executeProvisioning($pdo) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        echo json_encode(["message" => "SaaS Provisioning Library Loaded."]);
        return;
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    $email = $input['email'] ?? null;
    $password = $input['password'] ?? null;
    $company = $input['company'] ?? 'Moja Firma';
    
    if (!$email || !$password) {
        die(json_encode(['error' => 'Missing email or password']));
    }

    try {
        $res = provisionNewInstance($email, $company, $password, 'STARTER');
        echo json_encode([
            'success' => true,
            'instance_id' => $res['instance_id'],
            'message' => 'Instancja została utworzona.'
        ]);
    } catch (Exception $e) {
        error_log('Provisioning Error: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Błąd provisioningu.']);
    }
}

function createDatabaseDA($dbName, $dbUser) {
    $da_host = DA_HOST;
    $da_port = DA_PORT;
    $da_login = DA_LOGIN;
    $da_pass = DA_PASS;
    $auth = base64_encode("$da_login:$da_pass");

    // Zgodnie z działającym skryptem USERA:
    // Używamy 'userlist', aby dodać nową bazę do ISTNIEJĄCEGO użytkownika (opvlirxcsv_gkportal)
    // UWAGA: DA sam dodaje prefix, więc musimy go usunąć z nazwy jeśli tam jest
    $short_user = str_replace(DA_LOGIN . '_', '', MASTER_DB_USER);
    
    $postData = [
        'action' => 'create',
        'name' => $dbName, 
        'userlist' => $short_user, // Doda bazę do Twojego głównego użytkownika
        'json' => 'yes'
    ];

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "https://$da_host:$da_port/CMD_API_DATABASES");
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($postData));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ["Authorization: Basic $auth"]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    
    $response = curl_exec($ch);
    $curl_err = curl_error($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($curl_err) {
        return ['error' => '1', 'text' => "CURL Error: $curl_err"];
    }

    if ($http_code >= 400) {
        return ['error' => '1', 'text' => "HTTP Error $http_code. Response: " . substr($response, 0, 200)];
    }

    $decoded = json_decode($response, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        return ['error' => '1', 'text' => "Invalid JSON from DA. Raw: " . substr($response, 0, 200)];
    }
    
    return $decoded;
}

// Logic flow summary:
// 1. Odbierz dane (Email właściciela)
// 2. Wygeneruj unikalny Instance ID
// 3. Wywołaj DirectAdmin API
// 4. Jeśli sukces -> Zapisz w saas_instances
// 5. Zaimportuj mvp_schema.sql do nowej bazy
// 6. Stwórz folder uploadu
