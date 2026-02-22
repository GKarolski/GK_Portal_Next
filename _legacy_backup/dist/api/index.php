<?php
require_once 'config.php';
if (file_exists('../vendor/autoload.php')) {
    require_once '../vendor/autoload.php';
} elseif (file_exists('vendor/autoload.php')) {
    require_once 'vendor/autoload.php';
}

// CORS is handled in config.php — DO NOT set wildcard here
header("Content-Type: application/json; charset=UTF-8");

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true);

function send_email($to, $subject, $message) {
    $headers = "MIME-Version: 1.0" . "\r\n";
    $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
    $headers .= 'From: ' . MAIL_FROM . "\r\n";
    return mail($to, $subject, $message, $headers);
}

function extract_pdf_text($filename, $limits = null) {
    if (!file_exists($filename)) return "";
    $content = @file_get_contents($filename);
    if (!$content) return "";
    
    // 1. Try Gemini Vision/PDF Understanding (Multimodal)
    $base64 = base64_encode($content);
    // 使用 najnowszego modelu flash dla szybkości i obsługi plików
    $url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" . GEMINI_API_KEY;
    
    $data = [
        "contents" => [
            [
                "parts" => [
                    ["text" => "Extract all text from this PDF document verbatim. Do not summarize. Return only the text content."],
                    [
                        "inline_data" => [
                            "mime_type" => "application/pdf",
                            "data" => $base64
                        ]
                    ]
                ]
            ]
        ]
    ];
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    
    $response = curl_exec($ch);
    $err = curl_error($ch);
    curl_close($ch);
    
    if ($err) {
        error_log('[AI PDF] CURL Error: ' . $err);
        return "";
    }
    
    $json = json_decode($response, true);
    $text = $json['candidates'][0]['content']['parts'][0]['text'] ?? null;
    $usage = $json['usageMetadata'] ?? null;

    if ($text) {
        // Track Token Usage if Limits provided
        if ($limits) {
            $inputTokens = $usage['promptTokenCount'] ?? 0;
            $outputTokens = $usage['candidatesTokenCount'] ?? 0;
            $totalTokens = $usage['totalTokenCount'] ?? ($inputTokens + $outputTokens);

            // Fallback if metadata missing (unlikely with Gemini 2.0)
            if ($totalTokens === 0) {
                 // Better Heuristic: Text Length / 4 (Input was binary, so we can't count it easily without tokenizer)
                 // But wait, we sent the binary. Let's just assume a safe default or log warning.
                 // Falling back to 1 token per 4 chars of OUTPUT text + fixed cost for PDF?
                 $totalTokens = ceil(strlen($text) / 4) + 1000; 
            }

            $limits->updateTokenUsage($totalTokens);
        }
        return trim($text);
    }
    
    // Log error if no text
    error_log('[AI PDF] Empty Gemini Response: ' . substr($response, 0, 200));

    // Fallback to previous heuristic if AI fails? No, heuristic was bad.
    return "";
}

function safe_json_encode($data) {
    return json_encode($data, JSON_PARTIAL_OUTPUT_ON_ERROR | JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
}

// 1. UPLOAD PLIKÓW (Multi-Tenant Aware + STORAGE LIMITS)
if ($action === 'upload_file' && $method === 'POST') {
    // Auth required for uploads
    if (empty($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Wymagane zalogowanie.']);
        exit;
    }
    if (isset($_FILES['file'])) {
        $target_dir = UPLOAD_ROOT; 
        if (!file_exists($target_dir)) mkdir($target_dir, 0755, true);
        
        // LIMIT CHECK
        require_once 'saas_limits.php';
        $limits = new SaaS_Limits($master_pdo ?? null, $_SESSION['tenant_instance_id'] ?? null);
        
        if (!$limits->checkStorage($_FILES['file']['size'])) {
             http_response_code(403);
             echo json_encode(['error' => 'Przekroczono limit miejsca na dysku dla Twojego planu (' . $limits->getPlanName() . ').']);
             exit;
        }

        $originalName = basename($_FILES["file"]["name"]);
        $fileName = time() . '_' . preg_replace("/[^a-zA-Z0-9\.]/", "", $originalName);
        $target_file = $target_dir . $fileName;
        
        if (move_uploaded_file($_FILES["file"]["tmp_name"], $target_file)) {
            // UPDATE USAGE
            $limits->updateStorageUsage($_FILES['file']['size']);
            
            echo json_encode(['success' => true, 'url' => UPLOAD_URL . $fileName, 'name' => $originalName]);
        } else {
            http_response_code(500); echo json_encode(['error' => 'Błąd zapisu pliku w ' . $target_dir]);
        }
    } else {
        http_response_code(400); echo json_encode(['error' => 'Brak pliku']);
    }
    exit;
}

// === AUTH GUARD ===
$public_actions = [
    'login', 'check_auth', 'logout', 'register',
    'verify_token', 'complete_setup',
    'trigger_reset', 'health_check',
    'check_provisioning_status'
];

function requireAuth() {
    if (empty($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Wymagane zalogowanie.']);
        exit;
    }
}

function requireAdmin() {
    requireAuth();
    if (($_SESSION['role'] ?? '') !== 'ADMIN') {
        http_response_code(403);
        echo json_encode(['error' => 'Brak uprawnień administratora.']);
        exit;
    }
}

// Apply guard: all non-public actions require login
if (!in_array($action, $public_actions) && $action !== '') {
    requireAuth();
}

switch ($action) {
    // --- 2. LOGOWANIE (POPRAWIONE BEZPIECZEŃSTWO) ---
    case 'logout':
        // Destroy Session Data
        $_SESSION = [];
        
        // Destroy Session Cookie
        if (ini_get("session.use_cookies")) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', [
                'expires' => time() - 42000,
                'path' => $params["path"],
                'domain' => $params["domain"],
                'secure' => $params["secure"],
                'httponly' => $params["httponly"],
                'samesite' => $params["samesite"]
            ]);
        }
        
        session_destroy();
        echo json_encode(['success' => true]);
        exit;
        break;

    // --- 2. LOGOWANIE (SAAS MULTI-TENANT AWARE) ---
    case 'check_auth':
        if (!isset($_SESSION['user_id'])) {
            echo json_encode(null);
            exit;
        }

        $userId = $_SESSION['user_id'];
        try {
            // Use existing $pdo (connected to Tenant or Master)
            $stmt = $pdo->prepare("SELECT u.*, o.name as organization_name, o.logo as organization_logo, o.vip_status FROM users u LEFT JOIN organizations o ON u.organization_id = o.id WHERE u.id = ?");
            $stmt->execute([$userId]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($user && $user['is_active']) {
                unset($user['password']);
                
                // Map fields for frontend consistency
                if (isset($user['company_name'])) $user['companyName'] = $user['company_name'];
                if (isset($user['organization_id'])) $user['organizationId'] = $user['organization_id'];
                if (isset($user['organization_logo'])) $user['organizationLogo'] = $user['organization_logo'];
                if (isset($user['role_in_org'])) $user['roleInOrg'] = $user['role_in_org'];
                $user['isActive'] = (bool)($user['is_active'] ?? true);
                $user['settings'] = json_decode($user['settings'] ?? '{}', true);

                if (isset($_SESSION['tenant_instance_id'])) {
                    $user['instanceId'] = $_SESSION['tenant_instance_id'];
                }

                // SAAS PLAN INFO
                require_once 'saas_limits.php';
                $limits = new SaaS_Limits($master_pdo ?? null, $_SESSION['tenant_instance_id'] ?? null);
                $user['plan'] = [
                    'tier' => $limits->getPlanName(),
                    'storage' => $limits->getStorageInfo(),
                    'features' => [
                        'smart_context' => $limits->canUseSmartContext()
                    ]
                ];

                echo json_encode($user);
            } else {
                echo json_encode(null);
            }
        } catch (Exception $e) {
            echo json_encode(null);
        }
        exit;
        break;

    case 'login':
        if ($method !== 'POST') break;
        
        $email = isset($input['email']) ? strtolower(trim($input['email'])) : '';
        $password = $input['password'] ?? '';
        $user = null;
        $isOwnerVerified = false;
        $targetInstanceId = null;

        // A. TRY MASTER LOGIN (Owner)
        // Checks if this email belongs to a tenant owner in the Master Database
        if (isset($master_pdo)) {
            try {
                $stmt = $master_pdo->prepare("SELECT t.id, t.password_hash, i.instance_id, i.db_name, i.db_user, i.db_pass, i.db_host FROM saas_tenants t JOIN saas_instances i ON t.id = i.tenant_id WHERE t.owner_email = ? AND t.status = 'ACTIVE'");
                $stmt->execute([$email]);
                $tenant = $stmt->fetch(PDO::FETCH_ASSOC);

                if ($tenant) {
                    error_log("Login Trace: Found Master Tenant ID " . $tenant['id'] . " for email $email");
                    if (password_verify($password, $tenant['password_hash'])) {
                        $isOwnerVerified = true;
                        $targetInstanceId = $tenant['instance_id'];
                        $tHost = $tenant['db_host'] ?: 'localhost';
                        
                        // Connect to Tenant DB
                        try {
                            $tPdo = new PDO("mysql:host=$tHost;dbname=".$tenant['db_name'].";charset=utf8mb4", $tenant['db_user'], $tenant['db_pass']);
                            $stmt = $tPdo->prepare("SELECT u.*, o.name as organization_name, o.logo as organization_logo, o.vip_status FROM users u LEFT JOIN organizations o ON u.organization_id = o.id WHERE u.email = ?");
                            $stmt->execute([$email]);
                            $user = $stmt->fetch(PDO::FETCH_ASSOC);
                            
                            if ($user) {
                                error_log("Login Trace: Found User in Tenant DB: " . $user['id']);
                            } else {
                                error_log("Login Trace: User NOT found in Tenant DB ($email)");
                            }
                        } catch (PDOException $e) {
                             error_log("SaaS Login Error: Owner found but Tenant DB unreachable: " . $e->getMessage());
                        }
                    } else {
                        error_log("Login Trace: Password verification FAILED for Master Tenant " . $tenant['id']);
                    }
                } else {
                    error_log("Login Trace: Email $email NOT found in Master DB (ACTIVE tenants only)");
                }
            } catch (Exception $e) { /* Ignore Master Errors */ }
        }

        // B. TRY STANDARD LOGIN (If not Verified Owner)
        // This runs if we are likely already on a Tenant Domain or if it's a Team Member
        if (!$isOwnerVerified && !$user) {
             try {
                // Try using the current $pdo (which might be Master or Tenant)
                $stmt = $pdo->prepare("SELECT u.*, o.name as organization_name, o.logo as organization_logo, o.vip_status FROM users u LEFT JOIN organizations o ON u.organization_id = o.id WHERE u.email = ?");
                $stmt->execute([$email]);
                $user = $stmt->fetch(PDO::FETCH_ASSOC);
             } catch (PDOException $e) {
                 // Suppress "Table doesn't exist" error if we are on Master DB and table users is missing
                 // This acts as "User not found"
             }
        }

        if ($user) {
            $isValid = false;
            
            if ($isOwnerVerified) {
                // Jeśli zweryfikowaliśmy już hasło przez saas_tenants, ufamy temu
                $isValid = true;
            } else {
                // Standardowe sprawdzanie hasła (bcrypt only)
                if (password_verify($password, $user['password'])) {
                    $isValid = true;
                }
            }

            if ($isValid) {
                if (!$user['is_active']) { 
                    echo json_encode(['error' => 'Konto nieaktywne.']); 
                    exit; 
                }
                unset($user['password']);
                
                // Map fields for frontend consistency
                if (isset($user['company_name'])) $user['companyName'] = $user['company_name'];
                if (isset($user['organization_id'])) $user['organizationId'] = $user['organization_id'];
                if (isset($user['organization_logo'])) $user['organizationLogo'] = $user['organization_logo'];
                if (isset($user['role_in_org'])) $user['roleInOrg'] = $user['role_in_org'];
                if (isset($user['is_active'])) $user['isActive'] = (bool)$user['is_active'];
                
                $user['settings'] = json_decode($user['settings'] ?? '{}', true);

                // Setting Session for SaaS Persistence
                if ($targetInstanceId) {
                    $_SESSION['tenant_instance_id'] = $targetInstanceId;
                    $_SESSION['tenant_id'] = $tenant['id'];
                    $user['instanceId'] = $targetInstanceId;
                    $_SESSION['is_owner'] = $isOwnerVerified;
                } else if (isset($_SESSION['tenant_instance_id'])) {
                    $user['instanceId'] = $_SESSION['tenant_instance_id'];
                }

                // SECURITY: Regenerate Session ID to prevent Session Fixation
                // CRITICAL: Preserve SaaS context
                $prevInstance = $_SESSION['tenant_instance_id'] ?? null;
                $prevOwner = $_SESSION['is_owner'] ?? false;
                $prevTenantId = $_SESSION['tenant_id'] ?? null;
                
                session_regenerate_id(true);
                
                if ($prevInstance) $_SESSION['tenant_instance_id'] = $prevInstance;
                if ($prevOwner) $_SESSION['is_owner'] = $prevOwner;
                if ($prevTenantId) $_SESSION['tenant_id'] = $prevTenantId;

                $_SESSION['user_id'] = $user['id'];
                
                // SAAS PLAN INFO
                require_once 'saas_limits.php';
                $limits = new SaaS_Limits($master_pdo ?? null, $_SESSION['tenant_instance_id'] ?? null);
                $user['plan'] = [
                    'tier' => $limits->getPlanName(),
                    'storage' => $limits->getStorageInfo(),
                    'features' => [
                        'smart_context' => $limits->canUseSmartContext()
                    ]
                ];

                echo json_encode($user);
            } else {
                http_response_code(401); 
                echo json_encode(['error' => 'Błędne hasło.']);
            }
        } else {
            http_response_code(401); 
            echo json_encode(['error' => 'Użytkownik nie istnieje.']);
        }
        break;

    // --- 3. USUWANIE KLIENTA ---
    case 'delete_client':
        if ($method !== 'POST') break;
        $uid = $input['userId'];
        $pdo->prepare("DELETE FROM tickets WHERE client_id = ?")->execute([$uid]);
        $pdo->prepare("DELETE FROM users WHERE id = ?")->execute([$uid]);
        echo json_encode(['success' => true]);
        break;

    case 'get_clients':
        $stmt = $pdo->query("SELECT id, name, email, role, company_name as companyName, is_active as isActive, phone, nip, website, admin_notes as adminNotes, avatar, organization_id as organizationId, role_in_org as roleInOrg FROM users WHERE role = 'CLIENT' ORDER BY company_name ASC");
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        break;

    case 'get_portal_settings':
        $uid = $input['userId'] ?? $_GET['userId'] ?? null;
        if ($uid) {
            $stmt = $pdo->prepare("SELECT settings, avatar FROM users WHERE id = ?");
            $stmt->execute([$uid]);
        } else {
            $stmt = $pdo->prepare("SELECT settings, avatar FROM users WHERE role = 'ADMIN' LIMIT 1");
            $stmt->execute();
        }
        $admin = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($admin) {
            $settings = json_decode($admin['settings'] ?? '{}', true);
            $settings['avatar'] = $admin['avatar'];
            echo json_encode($settings);
        } else {
            echo json_encode(['contactName' => '', 'contactEmail' => '', 'contactPhone' => '', 'popupNote' => '', 'avatar' => null]);
        }
        break;

    case 'get_org_users':
        $orgId = $input['organizationId'] ?? $_GET['organizationId'] ?? null;
        if (!$orgId) { echo json_encode([]); exit; }
        // Pobieramy wszystkich członków organizacji (klienci + admini/pracownicy)
        $stmt = $pdo->prepare("SELECT id, name, email, role, company_name as companyName, is_active as isActive, avatar, organization_id as organizationId, color, role_in_org as roleInOrg FROM users WHERE organization_id = ? ORDER BY role DESC, name ASC");
        $stmt->execute([$orgId]);
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Ensure booleans and other mapping
        foreach ($users as &$u) {
            if (isset($u['isActive'])) $u['isActive'] = (bool)$u['isActive'];
        }
        
        echo json_encode($users);
        break;

    case 'invite_client':
        if ($method !== 'POST') break;
        $token = bin2hex(random_bytes(16));
        $orgId = $input['organizationId'] ?? null;
        
        // FIX: Create Organization if not provided (New Client Flow)
        if (!$orgId && !empty($input['company'])) {
            $orgId = 'org_' . time() . '_' . rand(100,999);
            $stmtOrg = $pdo->prepare("INSERT INTO organizations (id, name, vip_status) VALUES (?, ?, 'STANDARD')");
            $stmtOrg->execute([$orgId, $input['company']]);
        }

        $roleInOrg = 'OWNER'; // Default for new org
        if ($input['organizationId']) $roleInOrg = 'MEMBER'; // If invited to existing, then Member

        try {
            $phone = $input['phone'] ?? null;
            $nip = $input['nip'] ?? null;
            $website = $input['website'] ?? null;
            $adminNotes = $input['adminNotes'] ?? null;
            $avatar = $input['avatar'] ?? null;

            $stmt = $pdo->prepare("INSERT INTO users (id, name, email, role, company_name, organization_id, role_in_org, is_active, activation_token, password, phone, nip, website, admin_notes, avatar) VALUES (?, ?, ?, 'CLIENT', ?, ?, ?, 0, ?, '', ?, ?, ?, ?, ?)");
            $stmt->execute(['u_'.time(), $input['name'], $input['email'], $input['company'], $orgId, $roleInOrg, $token, $phone, $nip, $website, $adminNotes, $avatar]);
            
            // Budujemy pełny link. Zakładamy, że HTTP_ORIGIN jest poprawny.
            $baseUrl = $_SERVER['HTTP_ORIGIN'] ?? 'gramyostro.com'; 
            $instanceId = $_SESSION['tenant_instance_id'] ?? $input['instanceId'] ?? '';
            // Fix: remove login.php, point to root handling AuthFlows
            $link = $baseUrl . "/?instance=" . $instanceId . "&action=activate&token=" . $token;
            
            if (send_email($input['email'], "Zaproszenie do GK Portal", "Witaj!<br>Kliknij tutaj, aby aktywować konto: <a href='$link'>$link</a>")) {
                echo json_encode(['success' => true]);
            } else {
                // Jeśli mail() zwróci false, logujemy błąd, ale userowi zwracamy success (żeby nie blokować UI), lub error.
                // Na prodzie mail() może zwrócić true nawet jak nie wyjdzie, ale jeśli false to na pewno błąd.
                error_log("Błąd wysyłania maila do: " . $input['email']);
                echo json_encode(['success' => true, 'warning' => 'Mail function failed']);
            }
        } catch (Exception $e) { echo json_encode(['error' => 'Email zajęty']); }
        break;

    // --- 4. POBIERANIE DANYCH ---
    case 'get_tickets':
        $uid = $_GET['userId'];
        $role = $_GET['role'];
        $month = $_GET['month'] ?? date('Y-m'); // Format YYYY-MM
        
        if ($role === 'ADMIN') {
            $sql = "SELECT t.*, 
                    (SELECT SUM(duration_seconds) FROM work_sessions WHERE ticket_id = t.id) as total_duration_seconds,
                    u.name as created_by_name, u.avatar as created_by_avatar
                    FROM tickets t 
                    LEFT JOIN users u ON t.created_by_user_id = u.id
                    WHERE t.billing_month = ? OR (t.billing_month < ? AND t.status != 'DONE') 
                    ORDER BY t.created_at DESC";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$month, $month]);
        } else {
            // Client / Organization View
            // 1. Get User's Organization ID
            $cleanUid = preg_replace('/^u_/', '', $uid);
            
            // Check if user has an Organization
            $stmtOrg = $pdo->prepare("SELECT organization_id FROM users WHERE id = ?");
            $stmtOrg->execute([$uid]); // Use raw ID first
            $userOrgId = $stmtOrg->fetchColumn();
            
            if (!$userOrgId) {
                // Fallback: try clean ID
                $stmtOrg->execute([$cleanUid]);
                $userOrgId = $stmtOrg->fetchColumn();
            }

            if ($userOrgId) {
                // SHOW ALL TICKETS FOR ORGANIZATION
                $stmt = $pdo->prepare("SELECT t.*, 
                    (SELECT SUM(duration_seconds) FROM work_sessions WHERE ticket_id = t.id) as total_duration_seconds,
                    u.name as created_by_name, u.avatar as created_by_avatar
                    FROM tickets t 
                    LEFT JOIN users u ON t.created_by_user_id = u.id
                    WHERE t.organization_id = ? AND (t.billing_month = ? OR (t.billing_month < ? AND t.status != 'DONE'))
                    ORDER BY t.created_at DESC");
                $stmt->execute([$userOrgId, $month, $month]);
            } else {
                // LEGACY: Show only own tickets (No Org)
                $stmt = $pdo->prepare("SELECT t.*, 
                    (SELECT SUM(duration_seconds) FROM work_sessions WHERE ticket_id = t.id) as total_duration_seconds 
                    FROM tickets t 
                    WHERE (t.client_id = ? OR t.client_id = ?) AND (t.billing_month = ? OR (t.billing_month < ? AND t.status != 'DONE'))
                    ORDER BY t.created_at DESC");
                $stmt->execute([$uid, $cleanUid, $month, $month]);
            }
        }
        $tickets = $stmt->fetchAll();
        
        foreach ($tickets as &$t) {
            $t['subtasks'] = json_decode($t['subtasks_json'] ?? '[]');
            $t['attachments'] = json_decode($t['attachments_json'] ?? '[]');
            $t['historyLog'] = json_decode($t['history_json'] ?? '[]');
            
            // --- SECURITY & PRIVACY FOR CLIENT ---
            if ($role !== 'ADMIN') {
                unset($t['internal_notes']);
                unset($t['admin_start_date']);
                unset($t['price']);   // UKRYWAMY CENĘ
                unset($t['budget']);  // UKRYWAMY BUDŻET (opcjonalnie, jeśli to wrażliwe)
                
                if (is_array($t['subtasks'])) {
                    $t['subtasks'] = array_values(array_filter($t['subtasks'], function($s) {
                        return isset($s->isVisibleToClient) && $s->isVisibleToClient;
                    }));
                }
            }
            
            $t['clientId'] = $t['client_id'];
            $t['clientName'] = $t['client_name'];
            $t['deviceType'] = $t['device_type'];
            $t['internalNotes'] = $t['internal_notes'] ?? '';
            $t['adminDeadline'] = $t['admin_deadline'];
            $t['createdAt'] = $t['created_at'];
            $t['adminStartDate'] = $t['admin_start_date'] ?? null;
            $t['adminStartDate'] = $t['admin_start_date'] ?? null;
            $t['billingMonth'] = $t['billing_month'];
            $t['publicNotes'] = $t['public_notes'] ?? '';
            
            // Organization Support
            $t['organizationId'] = $t['organization_id'] ?? null;
            $t['createdByName'] = $t['created_by_name'] ?? $t['client_name'];
            $t['createdByAvatar'] = $t['created_by_avatar'] ?? null;
            $t['folderId'] = $t['folder_id'] ?? null;
        }
        echo safe_json_encode($tickets);
        break;

    case 'get_folders':
        $orgId = $input['organizationId'] ?? null;
        if (!$orgId) { echo json_encode([]); exit; }
        
        $stmt = $pdo->prepare("SELECT *, organization_id as organizationId FROM folders WHERE organization_id = ? ORDER BY created_at ASC");
        $stmt->execute([$orgId]);
        $folders = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $res = [];
        foreach($folders as $f) {
            $f['automationRules'] = json_decode($f['automation_rules'] ?? '[]', true);
            unset($f['automation_rules']);
            $res[] = $f;
        }
        echo safe_json_encode($res);
        break;

    case 'manage_folder':
        $mode = $input['mode']; // create, update, delete
        
        if ($mode === 'delete') {
            $stmt = $pdo->prepare("DELETE FROM folders WHERE id = ?");
            $stmt->execute([$input['folderId']]);
            // Optional: Reset tickets in this folder to Inbox?
            $pdo->prepare("UPDATE tickets SET folder_id = NULL WHERE folder_id = ?")->execute([$input['folderId']]);
            echo json_encode(['success' => true]);
            exit;
        }
        
        $rulesJson = json_encode($input['automationRules'] ?? []);
        
        if ($mode === 'create') {
            $id = 'fld_' . time() . '_' . rand(100,999);
            $stmt = $pdo->prepare("INSERT INTO folders (id, organization_id, name, icon, color, automation_rules, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())");
            $stmt->execute([$id, $input['organizationId'], $input['name'], $input['icon'], $input['color'], $rulesJson]);
        } else {
            $stmt = $pdo->prepare("UPDATE folders SET name = ?, icon = ?, color = ?, automation_rules = ? WHERE id = ?");
            $stmt->execute([$input['name'], $input['icon'], $input['color'], $rulesJson, $input['folderId']]);
        }
        echo json_encode(['success' => true]);
        break;

    case 'create_ticket':
        if ($method !== 'POST') break;
        
        try {
            // DEBUG LOGGING
            error_log("CREATE_TICKET INPUT: " . file_get_contents('php://input'));
            
            // Validate Input: Support both wrapped 'payload' and direct body
            $t = $input['payload'] ?? $input; 
            if (!$t) throw new Exception("Brak danych zgłoszenia (Empty Body).");

            // Client ID Resolution
            $clientId = $input['overrideClientId'] ?? null;
            if (!$clientId && isset($input['user']) && is_array($input['user'])) {
                $clientId = $input['user']['id'] ?? null;
            }
            if (!$clientId) {
                $clientId = $t['clientId'] ?? null;
            }
            
            // Final check
            if (!$clientId || $clientId === '') throw new Exception("Brak ID klienta (clientId). Otrzymano payload: " . json_encode($t));
            
            // Fetch Context (Organization & Names)
            $stmt = $pdo->prepare("SELECT company_name, name, organization_id FROM users WHERE id = ?");
            $stmt->execute([$clientId]);
            $u = $stmt->fetch();
            
            if (!$u) throw new Exception("Nie znaleziono klienta w bazie o ID: " . htmlspecialchars($clientId));

            $clientName = $u['company_name'] ?: $u['name'];
            $orgId = $u['organization_id']; // Auto-assign Organization
            $createdById = $clientId; // For now, Creator = Client (or Admin impersonating Client)

            $subtasks = [];
            $attachments = $t['attachments'] ?? []; 

            $billingMonth = date('Y-m');

            $id = 't' . uniqid(); // Use uniqid to prevent collision in Batch Requests
            
            // Include admin_start_date in INSERT
            $sql = "INSERT INTO tickets (id, client_id, client_name, organization_id, created_by_user_id, subject, category, url, device_type, platform, budget, description, status, priority, price, internal_notes, public_notes, admin_deadline, error_date, created_at, subtasks_json, history_json, attachments_json, billing_month, admin_start_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, '[]', ?, ?, ?)";
            
            // ... Normalization ...
            $rawPlatform = strtolower($t['platform'] ?? '');
            $platform = 'Inne';
            if (preg_match('/(meta|facebook|fb|instagram|ig)/', $rawPlatform)) $platform = 'Meta Ads';
            elseif (preg_match('/(google|adwords|ads)/', $rawPlatform)) $platform = 'Google Ads';
            elseif (preg_match('/(tiktok)/', $rawPlatform)) $platform = 'TikTok Ads';
            
            $rawDevice = strtolower($t['deviceType'] ?? $t['device_type'] ?? '');
            $deviceType = 'Wszystkie';
            if (preg_match('/(mobile|telefon|komórka|android|iphone)/', $rawDevice)) $deviceType = 'Mobile';
            elseif (preg_match('/(tablet|ipad)/', $rawDevice)) $deviceType = 'Tablet';
            elseif (preg_match('/(desktop|komputer|pc|windows|mac)/', $rawDevice)) $deviceType = 'Desktop';

            $price = floatval($t['price'] ?? 0);
            $adminStart = isset($t['adminStartDate']) ? substr($t['adminStartDate'], 0, 10) : date('Y-m-d');
            $adminDeadline = isset($t['adminDeadline']) ? substr($t['adminDeadline'], 0, 10) : null;
            $errorDate = isset($t['errorDate']) ? substr($t['errorDate'], 0, 10) : null;
            
            // Allow subtasks pass-through if AI provides them
            $subtasks = isset($t['subtasks']) ? $t['subtasks'] : []; 

            // SMART FOLDERS AUTOMATION ENGINE
            $folderId = $t['folderId'] ?? null;

            // If no manual folder assigned, try finding one via rules
            if (!$folderId) {
                try {
                    $stmt = $pdo->prepare("SELECT * FROM folders WHERE organization_id = ?");
                    $stmt->execute([$orgId]);
                    $folders = $stmt->fetchAll(PDO::FETCH_ASSOC);

                    foreach ($folders as $f) {
                        if ($folderId) break; // Found one
                        $rules = json_decode($f['automation_rules'] ?? '[]', true);
                        
                        foreach ($rules as $rule) {
                            $match = false;
                            switch ($rule['type']) {
                                case 'FROM_USER':
                                    if ($createdById === $rule['value']) $match = true;
                                    break;
                                case 'KEYWORD':
                                    if (stripos($t['subject'] ?? '', $rule['value']) !== false || stripos($t['description'] ?? '', $rule['value']) !== false) $match = true;
                                    break;
                                case 'CATEGORY':
                                    if (($t['category'] ?? '') === $rule['value']) $match = true;
                                    break;
                            }
                            if ($match) {
                                $folderId = $f['id'];
                                break; 
                            }
                        }
                    }
                } catch (Exception $e) {
                    // Ignore folder automation errors to not block ticket creation
                    error_log("Automation Rules Error: " . $e->getMessage());
                }
            }

            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                $id, $clientId, $clientName, $orgId, $createdById, $t['subject'] ?? 'Bez tematu', $t['category'] ?? 'GENERAL', 
                $t['url'] ?? '', $deviceType, $platform, $t['budget'] ?? '', 
                $t['description'] ?? '', 'PENDING', $t['priority'] ?? 'NORMAL', $price, 
                $t['internalNotes'] ?? '', $t['publicNotes'] ?? '', $adminDeadline, $errorDate,
                json_encode($subtasks), json_encode($attachments), $billingMonth, $adminStart
            ]);
            
            // Update Folder ID if found
            if ($folderId) {
                $pdo->prepare("UPDATE tickets SET folder_id = ? WHERE id = ?")->execute([$folderId, $id]);
            }

            // Optional: Send Email
            // CHECK ADMIN SETTINGS FIRST
            $adminSettings = [];
            try {
                // Fetch Admin (role=ADMIN) settings. Assuming single admin or first admin for now.
                $stmtAdmin = $pdo->query("SELECT settings, email FROM users WHERE role = 'ADMIN' LIMIT 1");
                $admin = $stmtAdmin->fetch(PDO::FETCH_ASSOC);
                if ($admin && $admin['settings']) {
                    $adminSettings = json_decode($admin['settings'], true);
                }
                $adminEmail = $admin['email'] ?? 'kontakt@gk-digital.pl'; // Fallback
            } catch (Exception $e) {}

            $shouldSendEmail = true;
            $notifSettings = $adminSettings['notifications'] ?? [];
            
            // Check: Enable Emails?
            if (isset($notifSettings['emailOnNewTicket']) && $notifSettings['emailOnNewTicket'] === false) {
                $shouldSendEmail = false;
            }

            // Check: High Priority Only?
            if ($shouldSendEmail && isset($notifSettings['emailOnNewTicketHighPriorityOnly']) && $notifSettings['emailOnNewTicketHighPriorityOnly'] === true) {
                $priority = $t['priority'] ?? 'NORMAL';
                if ($priority !== 'URGENT' && $priority !== 'HIGH') {
                    $shouldSendEmail = false;
                }
            }

            if ($shouldSendEmail) {
                 send_email($adminEmail, "Nowe Zgłoszenie: " . ($t['subject'] ?? 'Bez tematu'), "Otrzymano nowe zgłoszenie od: $clientName.<br>Priorytet: " . ($t['priority'] ?? 'NORMAL'));
            }

            echo json_encode(['success' => true, 'id' => $id]);

        } catch (Exception $e) {
            error_log('create_ticket error: ' . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Błąd tworzenia zgłoszenia.']);
        }
        break;

    case 'update_user_color':
        if ($method !== 'POST') break;
        $uid = $input['userId'];
        $color = $input['color'];
        $pdo->prepare("UPDATE users SET color = ? WHERE id = ?")->execute([$color, $uid]);
        echo json_encode(['success' => true]);
        break;

    case 'update_ticket':
        if ($method !== 'POST') break;
        $tid = $input['ticketId'];
        $field = $input['field']; 
        $val = $input['value'];
        
        // Field Mapping (AI -> DB)
        $map = [
            'folderId' => 'folder_id', // ADDED
            'folder_id' => 'folder_id',
            'deviceType' => 'device_type',
            'device_type' => 'device_type',
            'adminStartDate' => 'admin_start_date',
            'adminDeadline' => 'admin_deadline',
            'errorDate' => 'error_date',
            'error_date' => 'error_date',
            'isHidden' => 'is_hidden_from_client',
            'is_hidden_from_client' => 'is_hidden_from_client',
            'internalNotes' => 'internal_notes',
            'platform' => 'platform',
            'url' => 'url',
            'budget' => 'budget',
            'subject' => 'subject',
            'category' => 'category',
            'priority' => 'priority',
            'price' => 'price',
            'status' => 'status',
            'publicNotes' => 'public_notes', // ADDED
            'dates' => 'dates' // Handle special dates object
        ];

        $dbField = $map[$field] ?? null;
        if (!$dbField && !in_array($field, ['subtasks', 'description', 'historyLog', 'attachments', 'toggle_subtask_client_visibility', 'dates'])) {
            echo json_encode(['error' => 'Nieprawidłowe pole: ' . htmlspecialchars($field)]);
            exit;
        }

        try {
            // Log actual update attempt for debugging
            if (in_array($dbField, ['folder_id', 'priority', 'price', 'device_type', 'platform', 'url', 'budget', 'subject', 'category', 'admin_start_date', 'admin_deadline', 'error_date', 'is_hidden_from_client', 'public_notes'])) {
                $v = $val;
                if (in_array($dbField, ['admin_start_date', 'admin_deadline', 'error_date']) && $val) {
                    $v = substr($val, 0, 10);
                }
                $stmt = $pdo->prepare("UPDATE tickets SET $dbField = ? WHERE id = ?");
                $stmt->execute([$v, $tid]);
            }
            elseif ($dbField === 'dates') {
                $start = isset($val['start']) ? substr($val['start'], 0, 10) : null;
                $deadline = isset($val['deadline']) ? substr($val['deadline'], 0, 10) : null;
                $stmt = $pdo->prepare("UPDATE tickets SET admin_start_date = ?, admin_deadline = ? WHERE id = ?");
                $stmt->execute([$start, $deadline, $tid]);
            }
            elseif ($dbField === 'status') {
                // ... (Status Logic kept same)
                if ($val === 'DONE') {
                    $currentMonth = date('Y-m');
                    $stmt = $pdo->prepare("UPDATE tickets SET status = ?, billing_month = ? WHERE id = ?");
                    $stmt->execute([$val, $currentMonth, $tid]);
                } else {
                    $stmt = $pdo->prepare("UPDATE tickets SET status = ? WHERE id = ?");
                    $stmt->execute([$val, $tid]);
                }
            }
            elseif ($dbField === 'internal_notes') {
                 $stmt = $pdo->prepare("UPDATE tickets SET internal_notes = ? WHERE id = ?");
                 $stmt->execute([$val, $tid]);
            }
            elseif ($field === 'dates') { 
                $stmt = $pdo->prepare("UPDATE tickets SET admin_start_date = ?, admin_deadline = ? WHERE id = ?");
                $stmt->execute([$val['start'], $val['deadline'], $tid]);
            }
            elseif ($field === 'subtasks') {
                // ... (Keep existing Subtask Logic) ...
                // SMART APPEND & NORMALIZATION LOGIC
                $currentSubtasks = [];
                if (is_string($val)) {
                    $stmt = $pdo->prepare("SELECT subtasks_json FROM tickets WHERE id = ?");
                    $stmt->execute([$tid]);
                    $row = $stmt->fetch();
                    $currentSubtasks = $row ? (json_decode($row['subtasks_json'], true) ?: []) : [];
                    $currentSubtasks[] = ['id' => uniqid('st_'), 'title' => $val, 'isCompleted' => false, 'isVisibleToClient' => true];
                    $finalSubtasks = $currentSubtasks;
                } else {
                    $inputArray = is_array($val) ? $val : [];
                    $finalSubtasks = [];
                    foreach ($inputArray as $item) {
                        if (is_string($item)) $finalSubtasks[] = ['id' => uniqid('st_'), 'title' => $item, 'isCompleted' => false, 'isVisibleToClient' => true];
                        elseif (is_array($item)) $finalSubtasks[] = ['id' => $item['id'] ?? uniqid('st_'), 'title' => $item['title'] ?? '', 'isCompleted' => $item['isCompleted'] ?? false, 'isVisibleToClient' => $item['isVisibleToClient'] ?? true];
                    }
                }
                $stmt = $pdo->prepare("UPDATE tickets SET subtasks_json = ? WHERE id = ?");
                $stmt->execute([json_encode($finalSubtasks), $tid]);
            }
            elseif ($field === 'toggle_subtask_client_visibility') {
                // "Ukryj podzadania" handler
                // Schema: true = UKRYJ (Hidden), false = POKAŻ (Visible)
                
                $isVisible = true; // Default to VISIBLE (Show)
                
                // If val is TRUE -> We want to HIDE -> isVisible = false
                if ($val === true || $val === 'true' || $val === 1) $isVisible = false; 
                
                // If val is FALSE -> We want to SHOW -> isVisible = true
                if ($val === false || $val === 'false' || $val === 0) $isVisible = true; 
                
                $stmt = $pdo->prepare("SELECT subtasks_json FROM tickets WHERE id = ?");
                $stmt->execute([$tid]);
                $row = $stmt->fetch();
                $subs = $row ? (json_decode($row['subtasks_json'], true) ?: []) : [];
                
                foreach ($subs as &$s) { $s['isVisibleToClient'] = $isVisible; }
                
                $stmt = $pdo->prepare("UPDATE tickets SET subtasks_json = ? WHERE id = ?");
                $stmt->execute([json_encode($subs), $tid]);
                
                echo json_encode(['success' => true]);
                break; 
            }
            elseif ($field === 'description') {
                $stmt = $pdo->prepare("UPDATE tickets SET description = ? WHERE id = ?");
                $stmt->execute([$val, $tid]);
            }
            elseif ($field === 'historyLog') {
                $stmt = $pdo->prepare("UPDATE tickets SET history_json = ? WHERE id = ?");
                $stmt->execute([json_encode($val), $tid]);
            }
            elseif ($field === 'attachments') {
                $stmt = $pdo->prepare("UPDATE tickets SET attachments_json = ? WHERE id = ?");
                $stmt->execute([json_encode($val), $tid]);
            }
            
            if (isset($stmt) && $stmt->rowCount() === 0) {
                echo json_encode(['success' => true, 'warning' => 'No changes made']);
            } else {
                echo json_encode(['success' => true]);
            }

        } catch (Exception $e) {
            error_log('update_ticket error: ' . $e->getMessage());
            echo json_encode(['error' => 'Wystąpił błąd bazy danych. Spróbuj ponownie.']);
        }
        break;

    case 'delete_ticket':
        if ($method !== 'POST') break;
        $tid = $input['ticketId'];
        if(!$tid) { echo json_encode(['error' => 'No ID']); break; }
        
        $stmt = $pdo->prepare("DELETE FROM tickets WHERE id = ?");
        $stmt->execute([$tid]);
        
        if ($stmt->rowCount() > 0) {
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['error' => 'Ticket not found or already deleted']);
        }
        break;
        
    case 'update_profile':
        if ($method !== 'POST') break;
        try {
            // Build dynamic query
            $query = "UPDATE users SET ";
            $params = [];
            $updates = [];

            if(isset($input['email'])) { $updates[] = "email = ?"; $params[] = $input['email']; }
            if(!empty($input['name'])) { $updates[] = "name = ?"; $params[] = $input['name']; }
            if(!empty($input['companyName'])) { $updates[] = "company_name = ?"; $params[] = $input['companyName']; }
            
            if(isset($input['phone'])) { $updates[] = "phone = ?"; $params[] = $input['phone']; }
            if(isset($input['nip'])) { $updates[] = "nip = ?"; $params[] = $input['nip']; }
            if(isset($input['website'])) { $updates[] = "website = ?"; $params[] = $input['website']; }
            if(isset($input['adminNotes'])) { $updates[] = "admin_notes = ?"; $params[] = $input['adminNotes']; }
            if(isset($input['avatar'])) { $updates[] = "avatar = ?"; $params[] = $input['avatar']; }
            if(isset($input['settings'])) { 
                $updates[] = "settings = ?"; 
                $params[] = is_array($input['settings']) ? json_encode($input['settings']) : $input['settings']; 
            }

            if(!empty($input['password'])) { 
                $updates[] = "password = ?"; 
                $params[] = password_hash($input['password'], PASSWORD_DEFAULT); 
            }

            if (empty($updates)) {
                echo json_encode(['success' => true, 'warning' => 'No fields to update']);
                break;
            }

            $query .= implode(", ", $updates);
            $query .= " WHERE id = ?"; 
            $params[] = $input['userId'];

            $pdo->prepare($query)->execute($params);
            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            error_log('update_profile error: ' . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Błąd aktualizacji profilu.']);
        }
        break;



    case 'trigger_reset':
        $token = bin2hex(random_bytes(16));
        $pdo->prepare("UPDATE users SET reset_token = ? WHERE id = ?")->execute([$token, $input['userId']]);
        
        // Pobieramy email i nazwe usera
        $stmt = $pdo->prepare("SELECT email, name FROM users WHERE id = ?");
        $stmt->execute([$input['userId']]);
        $u = $stmt->fetch();
        
        if ($u) {
            $baseUrl = $_SERVER['HTTP_ORIGIN'] ?? 'gramyostro.com';
            $instanceId = $_SESSION['tenant_instance_id'] ?? $input['instanceId'] ?? '';
            $link = $baseUrl . "/?instance=" . $instanceId . "&action=reset&token=" . $token;
            
            require_once 'lib/Mailer.php';
            Mailer::send($u['email'], "Reset Hasła - GK Portal", "email_reset", [
                "name" => $u['name'],
                "link" => $link
            ]);
        }
        
        echo json_encode(['success' => true]);
        break;

    // verify_token and complete_setup — see end of switch (with column whitelist)


    // --- AI CHAT ---
    case 'chat':
        if ($method !== 'POST') break;

        // 1. Validate API Key
        if (!defined('GEMINI_API_KEY') || empty(GEMINI_API_KEY)) {
            echo json_encode(['type' => 'MESSAGE', 'text' => 'Błąd konfiguracji: Brak klucza API Gemini.']);
            break;
        }

        // LIMIT CHECK
        require_once 'saas_limits.php';
        $limits = new SaaS_Limits($master_pdo ?? null, $_SESSION['tenant_instance_id'] ?? null);
        
        if (!$limits->checkTokens()) {
             echo json_encode(['type' => 'MESSAGE', 'text' => "⛔ Przekroczono miesięczny limit tokenów AI dla Twojego planu (" . $limits->getPlanName() . "). Zwiększ plan, aby kontynuować."]);
             break;
        }

        // [MASTER PLAN] 2. Prepare Context (Deep Knowledge)
        $month = date('Y-m');
        $context = $input['context'] ?? [];
        
        // A. Fetch Tickets
        $stmt = $pdo->prepare("SELECT id, subject, status, price, priority, billing_month, category, client_id,
            (SELECT SUM(duration_seconds) FROM work_sessions WHERE ticket_id = tickets.id) as total_duration_seconds
            FROM tickets ORDER BY created_at DESC LIMIT 15");
        $stmt->execute();
        $tickets = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Revenue
        $stmtRev = $pdo->prepare("SELECT SUM(price) as total FROM tickets WHERE status = 'DONE' AND billing_month = ?");
        $stmtRev->execute([$month]);
        $revenue = $stmtRev->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;

        $ticketsContext = array_map(function($t) {
            $priceStr = $t['price'] > 0 ? "{$t['price']} PLN" : "Brak wyceny";
            $durStr = isset($t['total_duration_seconds']) ? round($t['total_duration_seconds']/3600, 2) . "h" : "0h";
            return "- [ID: {$t['id']}] [Client: {$t['client_id']}] [{$t['status']}] [{$t['category']}] {$t['subject']} ({$priceStr}, Time: {$durStr})";
        }, $tickets);
        $ticketsStr = implode("\n", $ticketsContext);

        // B. Fetch Clients
        $stmtClients = $pdo->prepare("SELECT id, company_name, name, email, phone, admin_notes FROM users WHERE role = 'CLIENT'");
        $stmtClients->execute();
        $clients = $stmtClients->fetchAll(PDO::FETCH_ASSOC);

        $clientsContext = array_map(function($c) {
            $contact = $c['name'] ?: 'Brak danych';
            $company = $c['company_name'] ?: 'Brak nazwy';
            $info = "ID: {$c['id']} | Firma: {$company} | Kontakt: {$contact} | Email: {$c['email']}";
            if ($c['admin_notes']) $info .= " | Info: {$c['admin_notes']}";
            return $info;
        }, $clients);
        $clientsStr = implode("\n", $clientsContext);

        // Active Ticket Context
        $activeTicket = $input['context']['selectedTicket'] ?? null;
        $activeTicketStr = "BRAK (User jest na Dashboardzie)";
        if ($activeTicket) {
            $subs = isset($activeTicket['subtasks']) ? json_encode($activeTicket['subtasks'], JSON_UNESCAPED_UNICODE) : '[]';
            $billing = $activeTicket['billingType'] ?? 'FIXED';
            $duration = $activeTicket['total_duration_seconds'] ?? 0;
            $activeTicketStr = "ID: {$activeTicket['id']} | Temat: {$activeTicket['subject']} | Status: {$activeTicket['status']} | Kategoria: {$activeTicket['category']} | Priorytet: {$activeTicket['priority']} | Budżet: {$activeTicket['budget']} | Urządzenie: {$activeTicket['deviceType']} | Platforma: {$activeTicket['platform']} | Data Błędu: {$activeTicket['errorDate']} | Ukryte: {$activeTicket['isHidden']} | Tryb: {$billing} | Czas: " . round($duration/3600, 2) . "h | Podzadania: {$subs}";
        }

        // --- DEFINICJA SCHEMATU (Total Awareness) ---
        $schemaJson = json_encode([
            'GLOBAL_FIELDS' => [
                'subject' => 'String (Tytuł zadania - wymagane)',
                'description' => 'String (Markdown - konkretnie)',
                'priority' => ['LOW', 'NORMAL', 'HIGH', 'URGENT'],
                'category' => ['BUG', 'FEATURE', 'MARKETING'],
                'status' => ['NEW', 'PENDING', 'IN_PROGRESS', 'REVIEW', 'DONE'],
                
                // Advanced Context
                'client_id' => 'String (ID Klienta, np. u_client_001)',
                'folder_id' => 'String (ID Folderu - można sugerować jeśli znany)',
                'created_by_user_id' => 'String (ID autora - zazwyczaj ID klienta lub admina)',
                
                // Admin / Billing
                'price' => 'Number (float) - Wycena netto (Fixed) LUB Stawka h (Hourly)',
                'billing_type' => ['FIXED', 'HOURLY'],
                'billing_month' => 'String (YYYY-MM)',
                'adminStartDate' => 'YYYY-MM-DD (Data Startu)',
                'adminDeadline' => 'YYYY-MM-DD (Termin)',
                'internalNotes' => 'String (Prywatne notatki admina)',
                
                // Tech / Data
                'error_date' => 'YYYY-MM-DD (Data wystąpienia błędu dla BUG)',
                'url' => 'String (Link do błędu lub inspiracji)',
                'subtasks' => 'Array of Objects [{title: string, isVisibleToClient: bool}]',
                'attachments' => 'Array of Objects [{name: string, url: string}]'
            ],
            'CATEGORY_SPECIFIC' => [
                'BUG' => [
                    'device_type' => ['Mobile', 'Desktop', 'Tablet', 'Wszystkie']
                ],
                'MARKETING' => [
                    'platform' => ['Meta Ads', 'Google Ads', 'TikTok Ads', 'Inne'],
                    'budget' => 'String (np. 500 PLN)'
                ]
            ],
            'ALLOWED_ACTIONS' => [
                'CREATE_TICKET' => 'Tworzy nowe zadanie. WYMAGA: subject, description, category, clientId. OPCJONALNIE: wszystkie pola z GLOBAL i CATEGORY_SPECIFIC.',
                'UPDATE_TICKET' => ['ticket_id' => 'ID', 'field' => 'nazwa_pola (np. status, price, folder_id)', 'value' => 'nowa_wartość'],
                'UPDATE_CLIENT_DATA' => ['client_id' => 'ID', 'field' => 'admin_notes', 'value' => 'Nowa treść'],
                'START_TIMER' => 'Uruchamia stoper',
                'STOP_TIMER' => 'Zatrzymuje stoper',
                'ADD_MANUAL_TIME' => ['ticket_id' => 'ID', 'duration' => 'minuty', 'note' => 'opcjonalny opis']
            ]
        ], JSON_UNESCAPED_UNICODE);



        // --- HELPER: SOP Context Fetching (Faza 2.5 - Client Specific) ---
        $sopContext = "";
        
        // SMART CONTEXT CHECK
        if ($limits->canUseSmartContext()) {
            $category = $context['category'] ?? ($context['selectedTicket']['category'] ?? 'GENERAL');
            $clientId = $context['activeClientId'] ?? ($context['selectedTicket']['clientId'] ?? ($context['selectedTicket']['client_id'] ?? null));
            
            if ($clientId === 'ALL') $clientId = null;
            
            // Fetch General Category SOPs + Client Specific SOPs
            $sopQuery = "SELECT title, content FROM sops WHERE (category = ? OR category = 'GENERAL')";
            $sopParams = [$category];
            
            if ($clientId) {
                $sopQuery .= " OR client_id = ?";
                $sopParams[] = $clientId;
            }
            
            $sopStmt = $pdo->prepare($sopQuery);
            $sopStmt->execute($sopParams);
            $sops = $sopStmt->fetchAll();
            
            if ($sops) {
                $sopContext = "\n\n### AKTUALNE PROCEDURY (SOP):\n";
                foreach ($sops as $sop) {
                    $sopContext .= "- **{$sop['title']}**:\n{$sop['content']}\n\n";
                }
            }
        }
        
        // --- HELPER: Persistent Context (Vault) Fetching ---
        $vaultContext = "";
        
        // SMART CONTEXT CHECK
        if ($limits->canUseSmartContext()) {
            if ($clientId && $clientId !== 'ALL') {
                $vStmt = $pdo->prepare("SELECT filename, parsed_content FROM client_documents WHERE client_id = ?");
                $vStmt->execute([$clientId]);
            } else {
                // Global view for Admin: Fetch last 20 docs metadata
                $vStmt = $pdo->prepare("SELECT filename, parsed_content, client_id FROM client_documents ORDER BY uploaded_at DESC LIMIT 20");
                $vStmt->execute();
            }
            $files = $vStmt->fetchAll();
            if ($files) {
                $vaultContext = "\n\n### PLIKI W CONTEXT VAULT (Wiedza o klientach):\n";
                foreach ($files as $f) {
                    $cID = isset($f['client_id']) ? "[Klient: {$f['client_id']}] " : "";
                    $rawContent = $f['parsed_content'];
                    
                    // Detection if content is useless/binary
                    if (!$rawContent || strlen(trim($rawContent)) < 5 || strpos($rawContent, '[Dokument binarny') !== false) {
                        $contentSnippet = "[UWAGA: Plik {$f['filename']} jest nieczytelny dla asystenta (format binarny/skan). Poproś użytkownika o wklejenie treści lub wgranie pliku .txt/.md jeśli dane z tego pliku są niezbędne.]";
                    } else {
                        // Zwiększamy limit kontekstu dla Gemini Flash (ma duże okno)
                        $contentSnippet = mb_substr($rawContent, 0, 50000) . (strlen($rawContent) > 50000 ? "..." : "");
                    }
                    
                    $vaultContext .= "- **{$cID}{$f['filename']}**:\n{$contentSnippet}\n\n";
                }
            }
        }

        // --- ACTIVE CONTEXT RECOGNITION ---
        $activeClientStr = "BRAK (Widok ogólny / Dashboard)";
        if ($clientId && $clientId !== 'ALL') {
            $stmtC = $pdo->prepare("SELECT id, company_name, name, email, admin_notes FROM users WHERE id = ?");
            $stmtC->execute([$clientId]);
            $currC = $stmtC->fetch();
            if ($currC) {
                $cName = $currC['company_name'] ?: $currC['name'];
                $activeClientStr = "ID: {$currC['id']} | FIRMA: {$cName} | Email: {$currC['email']}";
                if ($currC['admin_notes']) $activeClientStr .= " | NOTATKI O KLIENCIE: {$currC['admin_notes']}";
            }
        }

        $systemPrompt = "
        Jesteś Asystentką GK Portal (Wersja 3.2 - Context Master).
        Twoim celem jest zarządzanie zadaniami (Tickets) zgodnie ze ŚCISŁYM SCHEMATEM BAZY DANYCH.
        
        === TWOJE AKTUALNE OTOCZENIE (ACTIVE CONTEXT) ===
        TYM KLIENTEM SIĘ TERAZ ZAJMUJESZ: 
        >>> {$activeClientStr} <<<
        
        ZADANIE (Jeśli otwarte): {$activeTicketStr}
        
        ### 1. TWOJA BAZA WIEDZY (SCHEMA)
        Oto jedyne dozwolone pola i wartości. NIE wymyślaj własnych!
        $schemaJson
        
        $sopContext
        
        $vaultContext
        
        Styl: PROFESJONALNY, ZWIĘZŁY, KONKRETNY.
        ZASADA 1: ŻADNYCH EMOTIKONEK (Emoji = BAN).
        ZASADA 2: Używaj list punktowanych dla czytelności.
        ZASADA 3: Nie lej wody. Krótkie zdania.
        
        OBECNA DATA: " . date('Y-m-d') . "
        STATYSTYKI (Ten miesiąc):
        - Przychód: {$revenue} PLN.
        - Twoja Stawka Celowa: 150 PLN/h.
        
        ### 2. LOGIKA CZASU (Time Intelligence)
        - **RHR (Real Hourly Rate)**: Jeśli Billing = FIXED, RHR = Cena / Godziny. Celuj w > 100 PLN/h.
        - **Accrued**: Jeśli Billing = HOURLY, Przychód = Czas * Cena.
        - Jeśli widzisz, że zadanie zajmuje za dużo czasu (niski RHR), zasugeruj uproszczenie lub dopłatę.
        - Jeśli user mówi \"zacznij mierzyć czas\" -> Wygeneruj START_TIMER.
        - Jeśli user mówi \"pracowałem nad tym godzinę\" -> Wygeneruj ADD_MANUAL_TIME (duration: 60).
        
        === AKTUALNIE OTWARTY TICKET (Active Context) ===
        {$activeTicketStr}
        
        === BAZA WIEDZY O KLIENTACH (Deep Context) ===
        {$clientsStr}
        
        === OSTATNIE ZADANIA I WYCENY (Pricing Intelligence) ===
        {$ticketsStr}
        
        ### 2. ZASADY KONTEKSTU (Context Anchors)
        A. **AKTUALNIE OTWARTY TICKET (FOCUS)**:
           - Jeśli w sekcji 'AKTUALNIE OTWARTY TICKET' jest ID (np. t12345), to jest Twój PRIORYTET.
           - Komendy 'zmień datę', 'ustaw budżet', 'popraw opis' -> Dotyczą TEGO ID.
           - Nie szukaj innych zadań, jeśli masz otwarte konkretne.
        
        B. **ROZPOZNAWANIE KLIENTA**:
           - Jeśli user podaje nazwę klienta, szukaj w sekcji 'BAZA WIEDZY O KLIENTACH'.
           - Jeśli klient ma 'admin_notes', użyj ich.
        
        - ZAWSZE zwracaj tablicę obiektów JSON: `[ {akcja1}, {akcja2} ]`.
        - Nawet dla jednej akcji: `[ { ... } ]`.
        - **CHAOS CONVERTER**: Jeśli wiadomość od usera zawiera wiele oddzielnych próśb/zadań, ROZBIJ JE na osobne obiekty `CREATE_TICKET` i zwróć je w tablicy.
        - Możesz wykonywać WIELE akcji na raz (np. UPDATE daty I UPDATE budżetu).
        - **SOP ENFORCEMENT**: ZAWSZE stosuj się do PROCEDUR (SOP) wymienionych powyżej. Jeśli procedura wymaga konkretnych kroków, DODAJ JE do pola `subtasks` przy tworzeniu zadania.
        
        ### 4. LOGIKA PÓL (Field Logic)
        - **Data**: 'Dzisiaj' = " . date('Y-m-d') . ". 'Jutro' = " . date('Y-m-d', strtotime('+1 day')) . ".
        - **Urządzenia**: 'telefon' -> 'Mobile'. 'komputer' -> 'Desktop'.
        - **Wycena**: Jeśli user pyta, wpisz sugerowaną cenę w `price` (float).
        - **Podzadania**: Jeśli user wymienia listę kroków -> wrzuć je do `subtasks`.

        ### 5. FORMAT ODPOWIEDZI (JSON ONLY)
        Twoja odpowiedź musi być POPRAWNYM JSONEM (Array).
        
        [Opcja A: Rozmowa/Pytanie]
        [{ \"type\": \"MESSAGE\", \"text\": \"- Lista zmian:\\n- Punkt 1\\n- Punkt 2\" }]
        
        [Opcja B: Tworzenie Zadania (CREATE)]
        [
            {
                \"type\": \"ACTION\",
                \"action\": \"CREATE_TICKET\",
                \"data\": {
                    \"subject\": \"...tytuł...\",
                    \"priority\": \"LOW|NORMAL|HIGH|URGENT\",
                    \"status\": \"NEW\",
                    \"category\": \"FEATURE|BUG|MARKETING\",
                    \"client_id\": \"...ID...\",
                    \"description\": \"...opis...\",
                    \"price\": 100.0,
                    \"budget\": \"...200 PLN...\",
                    \"adminStartDate\": \"YYYY-MM-DD\",
                    \"adminDeadline\": \"YYYY-MM-DD\",
                    \"error_date\": \"YYYY-MM-DD\",
                    \"internalNotes\": \"...notatki...\",
                    \"is_hidden_from_client\": true,
                    \"subtasks\": [\"Krok 1\", \"Krok 2\"],
                    \"device_type\": \"Mobile\"
                }
            }
        ]

        [Opcja C: Edycja Zadania (UPDATE - Można łączyć!)]
        [
            {
                \"type\": \"ACTION\",
                \"action\": \"UPDATE_TICKET\",
                \"data\": { \"ticket_id\": \"...ID...\", \"field\": \"...field_name...\", \"value\": \"...value...\" }
            },
            {
                \"type\": \"ACTION\",
                \"action\": \"UPDATE_TICKET\",
                \"data\": { \"ticket_id\": \"...ID...\", \"field\": \"...field_name2...\", \"value\": \"...value2...\" }
            }
        ]

        [Opcja E: Zarządzanie Czasem]
        [
            { \"type\": \"ACTION\", \"action\": \"START_TIMER\", \"data\": { \"ticket_id\": \"...ID...\" } },
            { \"type\": \"ACTION\", \"action\": \"STOP_TIMER\", \"data\": { \"user_id\": \"ME\" } },
            { 
               \"type\": \"ACTION\", 
               \"action\": \"ADD_MANUAL_TIME\", 
               \"data\": { \"ticket_id\": \"...ID...\", \"duration\": 60, \"note\": \"Praca własna\", \"date\": \"2026-02-01 10:00\" } 
            }
        ]
        
        ZASADY MULTIMODALNE (MULTIMODAL RULES):
        - Jeśli otrzymasz obrazy: Opisz co na nich widzisz w kontekście zadań.
        - Jeśli otrzymasz PDF / CSV / TXT: Przeanalizuj treść dokumentu i wyciągnij istotne informacje.
        - Zauważ: Dla plików Word (.docx) i Excel (.xlsx) system automatycznie wyekstrahował tekst i umieścił go poniżej (oznaczony jako [TREŚĆ PLIKU]).
        
        ZASADY BEZPIECZEŃSTWA (DELETE):
        - Jeśli user pisze \"usuń to\": ZAPYTAJ O POTWIERDZENIE (Pełny tytuł).
        - Generuj DELETE_TICKET *tylko* jeśli User podał poprawny tytuł zadania.
        ";

        // --- HELPER: Office Text Extraction ---
        function extractOfficeText($base64, $mimeType) {
            $tmp = sys_get_temp_dir() . '/' . uniqid('ai_');
            file_put_contents($tmp, base64_decode($base64));
            
            $text = "";
            $zip = new ZipArchive();
            if ($zip->open($tmp) === true) {
                if (strpos($mimeType, 'wordprocessingml') !== false) {
                    // DOCX
                    if (($index = $zip->locateName('word/document.xml')) !== false) {
                        $data = $zip->getFromIndex($index);
                        $text = strip_tags($data);
                    }
                } elseif (strpos($mimeType, 'spreadsheetml') !== false) {
                    // XLSX
                    $sharedStrings = [];
                    if (($ssIndex = $zip->locateName('xl/sharedStrings.xml')) !== false) {
                        $ssData = $zip->getFromIndex($ssIndex);
                        $xml = simplexml_load_string($ssData);
                        foreach ($xml->si as $si) {
                            $sharedStrings[] = (string)$si->t;
                        }
                    }
                    if (($wsIndex = $zip->locateName('xl/worksheets/sheet1.xml')) !== false) {
                        $wsData = $zip->getFromIndex($wsIndex);
                        $xml = simplexml_load_string($wsData);
                        foreach ($xml->sheetData->row as $row) {
                            foreach ($row->c as $c) {
                                $v = (string)$c->v;
                                if (isset($c['t']) && (string)$c['t'] === 's') {
                                    $text .= ($sharedStrings[$v] ?? $v) . " | ";
                                } else {
                                    $text .= $v . " | ";
                                }
                            }
                            $text .= "\n";
                        }
                    }
                }
                $zip->close();
            }
            unlink($tmp);
            return $text;
        }

        // 3. Build Payload (Gemini 3.0 Structure)
        $messages = $input['messages'] ?? [];
        
        // Convert history to 'contents' format
        $contents = [];
        foreach ($messages as $msg) {
            $role = ($msg['role'] === 'user') ? 'user' : 'model';
            
            // Handle Thought Signature (Round Trip)
            // If the frontend sends a thoughtSignature (from a previous model response), we MUST include it.
            // The structure for model response in history should be:
            // { role: "model", parts: [...], thought: ..., thoughtSignature: ... } - check specific API docs for where thoughtSignature goes.
            // Based on user prompt: "wysyłasz w kolejnym zapytaniu w obiekcie parts" -> likely strict structure needed.
            // Actually, usually it's passed as a sibling or part. Let's assume standard 'parts' text for now + thought fields if API allows.
            // User Prompt trace: "zapisujesz je i wysyłasz w kolejnym zapytaniu w obiekcie parts".
            // This suggests it might need to be part of the text OR a specific field. 
            // For Safety in PHP basic implementation: We pass the text. If we had the signature, we'd add it.
            // Let's look for 'thoughtSignature' in the input message.
            
            $parts = [ ["text" => $msg['content']] ];
            
            // Handle Vision/Multimodal files
            if (isset($msg['files']) && is_array($msg['files'])) {
                foreach ($msg['files'] as $fIdx => $file) {
                    $mime = $file['mimeType'];
                    $filename = $msg['attachments'][$fIdx] ?? 'Dokument';
                    
                    // SMART PRE-CHECK: Estimate Cost to prevent massive overage
                    // Heuristic: 1MB Base64 ~= 20k Tokens (Conservative text density)
                    // If file is 1MB, we require ~20k buffer.
                    $estimatedTokens = ceil(strlen($file['base64']) / 50); 
                    $safeBuffer = max(1000, $estimatedTokens);

                    // CHECK SUBSCRIPTION LIMITS BEFORE PROCESSING FILE
                    if (!$limits->checkTokens($safeBuffer)) {
                        $parts[0]['text'] .= "\n\n[SYSTEM INFO: Plik '{$filename}' został wgrany, ale pominięto jego analizę przez AI. Powód: Zbyt mała liczba dostępnych tokenów na ten plik (Wymagane ok. {$safeBuffer}, Twój limit zostałby przekroczony).]";
                        continue;
                    }
                    
                    // IF OFFICE -> EXTRACT TEXT AND INJECT AS MESSAGE PART
                    if (strpos($mime, 'wordprocessingml') !== false || strpos($mime, 'spreadsheetml') !== false) {
                        $officeText = extractOfficeText($file['base64'], $mime);
                        $parts[0]['text'] .= "\n\n[TREŚĆ PLIKU {$filename}]:\n{$officeText}";
                    } else {
                        // NATIVE SUPPORT (Images, PDF, CSV, TXT)
                        $parts[] = [
                            "inline_data" => [
                                "mime_type" => $mime,
                                "data" => $file['base64']
                            ]
                        ];
                    }
                }
            }

            $contentObj = [
                "role" => $role,
                "parts" => $parts
            ];

            if (isset($msg['thoughtSignature'])) {
                $contentObj['thoughtSignature'] = $msg['thoughtSignature'];
            }

            $contents[] = $contentObj;
        }

        $url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=" . GEMINI_API_KEY;
        
        $data = [
            "system_instruction" => [
                "parts" => [ ["text" => $systemPrompt] ]
            ],
            "contents" => $contents,
            "generationConfig" => [
                "responseMimeType" => "application/json"
            ],
            "safetySettings" => [
                [ "category" => "HARM_CATEGORY_HARASSMENT", "threshold" => "BLOCK_NONE" ],
                [ "category" => "HARM_CATEGORY_HATE_SPEECH", "threshold" => "BLOCK_NONE" ],
                [ "category" => "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold" => "BLOCK_NONE" ],
                [ "category" => "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold" => "BLOCK_NONE" ]
            ]
        ];

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        
        $response = curl_exec($ch);
                if (curl_errno($ch)) {
              $curlErr = curl_error($ch);
              error_log('[AI Chat] CURL ERROR: ' . $curlErr);
              echo json_encode(['type' => 'MESSAGE', 'text' => 'Błąd połączenia z API AI.']);
         } else {

            $json = json_decode($response, true);
            
            // TOKEN COUNTING & UPDATE
            // Estimate: (Prompt + Response Char Count) / 4
            $approxTokens = ceil((strlen($systemPrompt) + strlen(json_encode($contents)) + strlen($response)) / 4);
            $limits->updateTokenUsage($approxTokens);

            // Check for JSON Decode Error
            if ($json === null) {
                 echo json_encode(['type' => 'MESSAGE', 'text' => "Błąd: Otrzymano niepoprawny JSON z Google API. Zobacz logi."]);
            } else {
                $aiText = $json['candidates'][0]['content']['parts'][0]['text'] ?? null;
                $thoughtSignature = $json['candidates'][0]['thoughtSignature'] ?? null; 
                
                if ($aiText) {
                    // ... (Existing JSON wrapping logic) ...
                    $responseObj = json_decode($aiText, true);
                    if ($responseObj) {
                        if ($thoughtSignature) {
                            if (isset($responseObj[0])) {
                                $responseObj[0]['thoughtSignature'] = $thoughtSignature;
                            } else {
                                $responseObj['thoughtSignature'] = $thoughtSignature;
                            }
                        }
                        echo json_encode($responseObj);
                    } else {
                        // Fallback if not valid JSON (Raw text)
                        echo $aiText;
                    }

                } else {
                    error_log('[AI Chat] Empty AI Response: ' . substr($response, 0, 300));
                    echo json_encode([
                        'type' => 'MESSAGE', 
                        'text' => 'Otrzymałam pustą odpowiedź od modelu. Spróbuj ponownie.'
                    ]);
                }
            }
        }
        curl_close($ch);
        break;

    // duplicate delete_ticket removed (better version at line ~922)

    // --- DEBUG: TOKEN X-RAY ---
    case 'debug_token_usage':
        // logic copied and adapted for debugging
        if ($method !== 'POST') break;
        
        require_once 'saas_limits.php';
        $limits = new SaaS_Limits($master_pdo ?? null, $_SESSION['tenant_instance_id'] ?? null);

        // 1. Prepare Context (Same as chat)
        $month = date('Y-m');
        $context = $input['context'] ?? [];
        
        // A. Fetch Tickets
        $stmt = $pdo->prepare("SELECT id, subject, status, price, priority, billing_month, category, client_id,
            (SELECT SUM(duration_seconds) FROM work_sessions WHERE ticket_id = tickets.id) as total_duration_seconds
            FROM tickets ORDER BY created_at DESC LIMIT 15");
        $stmt->execute();
        $tickets = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $ticketsContext = array_map(function($t) {
            $priceStr = $t['price'] > 0 ? "{$t['price']} PLN" : "Brak wyceny";
            $durStr = isset($t['total_duration_seconds']) ? round($t['total_duration_seconds']/3600, 2) . "h" : "0h";
            return "- [ID: {$t['id']}] [Client: {$t['client_id']}] [{$t['status']}] [{$t['category']}] {$t['subject']} ({$priceStr}, Time: {$durStr})";
        }, $tickets);
        $ticketsStr = implode("\n", $ticketsContext);

        // Fetch Clients Context
        $stmtClients = $pdo->prepare("SELECT id, company_name, name, email, admin_notes FROM users WHERE role = 'CLIENT'");
        $stmtClients->execute();
        $clients = $stmtClients->fetchAll(PDO::FETCH_ASSOC);
        $clientsContext = array_map(function($c) {
            $contact = $c['name'] ?: 'Brak danych';
            $company = $c['company_name'] ?: 'Brak nazwy';
            $info = "ID: {$c['id']} | Firma: {$company} | Kontakt: {$contact} | Email: {$c['email']}";
            if ($c['admin_notes']) $info .= " | Info: {$c['admin_notes']}";
            return $info;
        }, $clients);
        $clientsStr = implode("\n", $clientsContext);

        // Active Ticket
        $activeTicket = $input['context']['selectedTicket'] ?? null;
        $activeTicketStr = "BRAK (User jest na Dashboardzie)";
        if ($activeTicket) {
             $subs = isset($activeTicket['subtasks']) ? json_encode($activeTicket['subtasks'], JSON_UNESCAPED_UNICODE) : '[]';
             $billing = $activeTicket['billingType'] ?? 'FIXED';
             $duration = $activeTicket['total_duration_seconds'] ?? 0;
             $activeTicketStr = "ID: {$activeTicket['id']} | Temat: {$activeTicket['subject']} | Status: {$activeTicket['status']} | Kategoria: {$activeTicket['category']} | Priorytet: {$activeTicket['priority']} | Budżet: {$activeTicket['budget']} | Urządzenie: {$activeTicket['deviceType']} | Platforma: {$activeTicket['platform']} | Data Błędu: {$activeTicket['errorDate']} | Ukryte: {$activeTicket['isHidden']} | Tryb: {$billing} | Czas: " . round($duration/3600, 2) . "h | Podzadania: {$subs}";
        }
        
        // SOP Context
        $sopContext = "";
        if ($limits->canUseSmartContext()) {
            $category = $context['category'] ?? ($context['selectedTicket']['category'] ?? 'GENERAL');
            $clientId = $context['activeClientId'] ?? ($context['selectedTicket']['clientId'] ?? ($context['selectedTicket']['client_id'] ?? null));
            if ($clientId === 'ALL') $clientId = null;
            $sopQuery = "SELECT title, content FROM sops WHERE (category = ? OR category = 'GENERAL')";
            $sopParams = [$category];
            if ($clientId) {
                $sopQuery .= " OR client_id = ?";
                $sopParams[] = $clientId;
            }
            $sopStmt = $pdo->prepare($sopQuery);
            $sopStmt->execute($sopParams);
            $sops = $sopStmt->fetchAll();
            if ($sops) {
                 $sopContext = "\n\n### AKTUALNE PROCEDURY (SOP):\n";
                 foreach ($sops as $sop) {
                     $sopContext .= "- **{$sop['title']}**:\n{$sop['content']}\n\n";
                 }
            }
        }

        // Vault Context
        $vaultContext = "";
        if ($limits->canUseSmartContext()) {
             if ($clientId && $clientId !== 'ALL') {
                 $vStmt = $pdo->prepare("SELECT filename, parsed_content FROM client_documents WHERE client_id = ?");
                 $vStmt->execute([$clientId]);
             } else {
                 $vStmt = $pdo->prepare("SELECT filename, parsed_content, client_id FROM client_documents ORDER BY uploaded_at DESC LIMIT 20");
                 $vStmt->execute();
             }
             $files = $vStmt->fetchAll();
             if ($files) {
                 $vaultContext = "\n\n### PLIKI W CONTEXT VAULT (Wiedza o klientach):\n";
                 foreach ($files as $f) {
                     $cID = isset($f['client_id']) ? "[Klient: {$f['client_id']}] " : "";
                     $rawContent = $f['parsed_content'];
                     if (!$rawContent || strlen(trim($rawContent)) < 5 || strpos($rawContent, '[Dokument binarny') !== false) {
                         $contentSnippet = "[UWAGA: Plik {$f['filename']} jest nieczytelny...]";
                     } else {
                         $contentSnippet = mb_substr($rawContent, 0, 50000) . (strlen($rawContent) > 50000 ? "..." : "");
                     }
                     $vaultContext .= "- **{$cID}{$f['filename']}**:\n{$contentSnippet}\n\n";
                 }
             }
        }

        // Schema JSON (Simplified for debug view)
        $schemaJson = "...(JSON Schema Definitions)...";

        // Active Client
        $activeClientStr = "BRAK (Widok ogólny / Dashboard)";
        if ($clientId && $clientId !== 'ALL') {
             $stmtC = $pdo->prepare("SELECT id, company_name, name, email, admin_notes FROM users WHERE id = ?");
             $stmtC->execute([$clientId]);
             $currC = $stmtC->fetch();
             if ($currC) {
                 $cName = $currC['company_name'] ?: $currC['name'];
                 $activeClientStr = "ID: {$currC['id']} | FIRMA: {$cName} | Email: {$currC['email']}";
                 if ($currC['admin_notes']) $activeClientStr .= " | NOTATKI O KLIENCIE: {$currC['admin_notes']}";
             }
        }
        
        $revenue = 0; // Placeholder

        $systemPrompt = "
        Jesteś Asystentką GK Portal (Wersja 3.2 - Context Master).
        Twoim celem jest zarządzanie zadaniami (Tickets) zgodnie ze ŚCISŁYM SCHEMATEM BAZY DANYCH.
        
        === TWOJE AKTUALNE OTOCZENIE (ACTIVE CONTEXT) ===
        TYM KLIENTEM SIĘ TERAZ ZAJMUJESZ: 
        >>> {$activeClientStr} <<<
        
        ZADANIE (Jeśli otwarte): {$activeTicketStr}
        
        ### 1. TWOJA BAZA WIEDZY (SCHEMA)
        Oto jedyne dozwolone pola i wartości. NIE wymyślaj własnych!
        $schemaJson
        
        $sopContext
        
        $vaultContext
        
        Styl: PROFESJONALNY, ZWIĘZŁY, KONKRETNY.
        ZASADA 1: ŻADNYCH EMOTIKONEK (Emoji = BAN).
        ZASADA 2: Używaj list punktowanych dla czytelności.
        ZASADA 3: Nie lej wody. Krótkie zdania.
        
        OBECNA DATA: " . date('Y-m-d') . "
        STATYSTYKI (Ten miesiąc):
        - Przychód: {$revenue} PLN.
        - Twoja Stawka Celowa: 150 PLN/h.
        
        ### 2. LOGIKA CZASU (Time Intelligence)
        - **RHR (Real Hourly Rate)**: Jeśli Billing = FIXED, RHR = Cena / Godziny. Celuj w > 100 PLN/h.
        - **Accrued**: Jeśli Billing = HOURLY, Przychód = Czas * Cena.
        - Jeśli widzisz, że zadanie zajmuje za dużo czasu (niski RHR), zasugeruj uproszczenie lub dopłatę.
        - Jeśli user mówi \"zacznij mierzyć czas\" -> Wygeneruj START_TIMER.
        - Jeśli user mówi \"pracowałem nad tym godzinę\" -> Wygeneruj ADD_MANUAL_TIME (duration: 60).
        
        === AKTUALNIE OTWARTY TICKET (Active Context) ===
        {$activeTicketStr}
        
        === BAZA WIEDZY O KLIENTACH (Deep Context) ===
        {$clientsStr}
        
        === OSTATNIE ZADANIA I WYCENY (Pricing Intelligence) ===
        {$ticketsStr}
        
        ### 2. ZASADY KONTEKSTU (Context Anchors)
        A. **AKTUALNIE OTWARTY TICKET (FOCUS)**:
           - Jeśli w sekcji 'AKTUALNIE OTWARTY TICKET' jest ID (np. t12345), to jest Twój PRIORYTET.
           - Komendy 'zmień datę', 'ustaw budżet', 'popraw opis' -> Dotyczą TEGO ID.
           - Nie szukaj innych zadań, jeśli masz otwarte konkretne.
        
        B. **ROZPOZNAWANIE KLIENTA**:
           - Jeśli user podaje nazwę klienta, szukaj w sekcji 'BAZA WIEDZY O KLIENTACH'.
           - Jeśli klient ma 'admin_notes', użyj ich.
        
        - ZAWSZE zwracaj tablicę obiektów JSON: `[ {akcja1}, {akcja2} ]`.
        ";

        // Breakdown Analysis
        $stats = [
            'System Prompt Length' => strlen($systemPrompt),
            'System Prompt Tokens (Est)' => ceil(strlen($systemPrompt) / 4),
            'Tickets Context Length' => strlen($ticketsStr),
            'Clients Context Length' => strlen($clientsStr),
            'Vault Context Length' => strlen($vaultContext),
            'SOP Context Length' => strlen($sopContext),
            'Total Estimated Overhead' => ceil(strlen($systemPrompt) / 4)
        ];

        echo json_encode([
            'breakdown' => $stats,
            'system_prompt_preview' => substr($systemPrompt, 0, 2000) . '...',
            'vault_content' => substr($vaultContext, 0, 1000) . '...',
            'full_system_prompt' => $systemPrompt
        ]);
        break;

    // --- 5. TIME TRACKING (FAZA 1 & 1.9) ---
    case 'get_active_timer':
        try {
            $uid = $_GET['userId'] ?? '';
            $stmt = $pdo->prepare("
                SELECT w.*, t.subject as ticket_subject, t.billing_type, t.price 
                FROM work_sessions w 
                LEFT JOIN tickets t ON w.ticket_id = t.id 
                WHERE w.user_id = ? AND w.is_active = 1 
                LIMIT 1
            ");
            $stmt->execute([$uid]);
            $session = $stmt->fetch();
            echo json_encode(['active' => !!$session, 'session' => $session]);
        } catch (Exception $e) {
            error_log('active_timer error: ' . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Błąd serwera.']);
        }
        break;

    case 'get_work_sessions':
        $tid = $_GET['ticketId'];
        $stmt = $pdo->prepare("SELECT w.*, u.name as user_name FROM work_sessions w LEFT JOIN users u ON w.user_id = u.id WHERE w.ticket_id = ? ORDER BY w.start_time DESC");
        $stmt->execute([$tid]);
        echo json_encode($stmt->fetchAll());
        break;

    case 'manage_work_session':
        if ($method !== 'POST') break;
        $subAction = $input['subAction']; // 'create', 'update', 'delete'
        
        if ($subAction === 'create') {
            // Manual Add
            $tid = $input['ticketId'];
            $uid = $input['userId'];
            $duration = (int)$input['duration']; // in seconds
            $note = $input['note'] ?? '';
            $date = $input['date'] ?? date('Y-m-d H:i:s');
            
            // We insert a completed session
            $stmt = $pdo->prepare("INSERT INTO work_sessions (user_id, ticket_id, start_time, end_time, duration_seconds, is_active, note) VALUES (?, ?, ?, ?, ?, 0, ?)");
            // Approx start/end for log logic (Start = Date, End = Date + Duration)
            $end = date('Y-m-d H:i:s', strtotime($date) + $duration);
            $stmt->execute([$uid, $tid, $date, $end, $duration, $note]);
            echo json_encode(['success' => true]);
        }
        elseif ($subAction === 'update') {
            $sid = $input['sessionId'];
            $duration = (int)$input['duration'];
            $note = $input['note'];
            
            $stmt = $pdo->prepare("UPDATE work_sessions SET duration_seconds = ?, note = ? WHERE id = ?");
            $stmt->execute([$duration, $note, $sid]);
            echo json_encode(['success' => true]);
        }
        elseif ($subAction === 'delete') {
            $sid = $input['sessionId'];
            $stmt = $pdo->prepare("DELETE FROM work_sessions WHERE id = ?");
            $stmt->execute([$sid]);
            echo json_encode(['success' => true]);
        }
        break;
        
    case 'start_timer':
        if ($method !== 'POST') break;
        $uid = $input['userId'];
        $tid = $input['ticketId'];
        
        try {
            // A. Mutual Exclusion: Stop any existing timer for this user
            $pdo->prepare("UPDATE work_sessions SET is_active = 0, end_time = NOW(), duration_seconds = TIMESTAMPDIFF(SECOND, start_time, NOW()) WHERE user_id = ? AND is_active = 1")->execute([$uid]);
            
            // B. Start New Timer
            $stmt = $pdo->prepare("INSERT INTO work_sessions (user_id, ticket_id, start_time, is_active) VALUES (?, ?, NOW(), 1)");
            $stmt->execute([$uid, $tid]);
            
            // C. Status-Driven Timer: Auto-set to IN_PROGRESS if NEW/PENDING
            $pdo->prepare("UPDATE tickets SET status = 'IN_PROGRESS' WHERE id = ? AND status IN ('NEW', 'PENDING')")->execute([$tid]);
            
            // D. Return Server Time (Source of Truth)
            $stmt = $pdo->query("SELECT NOW() as serverTime");
            $serverTime = $stmt->fetch()['serverTime'];
            
            echo json_encode(['success' => true, 'start_time' => $serverTime]);
        } catch (Exception $e) {
            error_log('Timer start error: ' . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Błąd serwera.']);
        }
        break;

    case 'stop_timer':
        if ($method !== 'POST') break;
        $uid = $input['userId'];
        
        // 1. Fetch the active timer to check duration and note
        $stmt = $pdo->prepare("SELECT id, start_time, note FROM work_sessions WHERE user_id = ? AND is_active = 1 LIMIT 1");
        $stmt->execute([$uid]);
        $session = $stmt->fetch();
        
        if ($session) {
            $duration = time() - strtotime($session['start_time']);
            
            // 2. Micro-Session Hygiene: Delete if < 60s and no note exists
            if ($duration < 60 && empty($session['note'])) {
                $stmt = $pdo->prepare("DELETE FROM work_sessions WHERE id = ?");
                $stmt->execute([$session['id']]);
                echo json_encode(['success' => true, 'action' => 'deleted_micro_session']);
            } else {
                $stmt = $pdo->prepare("UPDATE work_sessions SET is_active = 0, end_time = NOW(), duration_seconds = ? WHERE id = ?");
                $stmt->execute([$duration, $session['id']]);
                echo json_encode(['success' => true]);
            }
        } else {
            echo json_encode(['success' => true, 'message' => 'No active timer']);
        }
        break;

    case 'request_reset':
        if ($method !== 'POST') break;
        $email = $input['email'] ?? '';
        
        $stmt = $pdo->prepare("SELECT id, name FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch();
        
        if ($user) {
            $token = bin2hex(random_bytes(32));
            $pdo->prepare("UPDATE users SET reset_token = ? WHERE id = ?")->execute([$token, $user['id']]);
            
            require_once 'lib/Mailer.php';
            $resetLink = "https://testgkportal.cfolks.pl/?action=reset&token=$token";
            
            Mailer::send($email, "Reset Hasła - GK Portal", "email_reset", [
                "name" => $user['name'],
                "link" => $resetLink
            ]);
        }
        
        echo json_encode(['success' => true]);
        break;

    case 'verify_token':
        if ($method !== 'POST') break;
        $token = $input['token'];
        $type = $input['type']; // 'activate' or 'reset'
        
        $allowed_types = ['activate' => 'activation_token', 'reset' => 'reset_token'];
        $col = $allowed_types[$type] ?? null;
        if (!$col) { echo json_encode(['valid' => false, 'error' => 'Nieprawidłowy typ tokena.']); exit; }
        
        $stmt = $pdo->prepare("SELECT email FROM users WHERE $col = ?");
        $stmt->execute([$token]);
        $user = $stmt->fetch();
        
        if ($user) {
            // SAAS PLAN INFO
            require_once 'saas_limits.php';
            $limits = new SaaS_Limits($master_pdo ?? null, $_SESSION['tenant_instance_id'] ?? null);
            $planInfo = [
                'tier' => $limits->getPlanName(),
                'storage' => $limits->getStorageInfo(),
                'features' => [
                    'smart_context' => $limits->canUseSmartContext()
                ]
            ];
            
            echo json_encode(['valid' => true, 'email' => $user['email'], 'plan' => $planInfo]);
        } else {
            echo json_encode(['valid' => false]);
        }
        break;

    case 'complete_setup':
        if ($method !== 'POST') break;
        $pass = password_hash($input['password'], PASSWORD_DEFAULT);
        $allowed_cols = ['activate' => 'activation_token', 'reset' => 'reset_token'];
        $col = $allowed_cols[$input['type']] ?? null;
        if (!$col) { echo json_encode(['error' => 'Nieprawidłowy typ.']); exit; }
        $pdo->prepare("UPDATE users SET password = ?, is_active = 1, $col = NULL WHERE $col = ?")->execute([$pass, $input['token']]);
        echo json_encode(['success' => true]);
        break;

    // --- 6. SOP & KNOWLEDGE BASE (FAZA 2) ---
    case 'get_sops':
        $category = $_GET['category'] ?? null;
        if ($category) {
            $stmt = $pdo->prepare("SELECT * FROM sops WHERE category = ? ORDER BY title ASC");
            $stmt->execute([$category]);
        } else {
            $stmt = $pdo->query("SELECT * FROM sops ORDER BY title ASC");
        }
        echo json_encode($stmt->fetchAll());
        break;

    case 'manage_sop':
        if ($method !== 'POST') break;
        $subAction = $input['subAction']; // 'create', 'update', 'delete'
        
        if ($subAction === 'create') {
            $stmt = $pdo->prepare("INSERT INTO sops (title, content, category, client_id) VALUES (?, ?, ?, ?)");
            $stmt->execute([$input['title'], $input['content'], $input['category'] ?? 'GENERAL', $input['client_id'] ?? null]);
            echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
        }
        elseif ($subAction === 'update') {
            $stmt = $pdo->prepare("UPDATE sops SET title = ?, content = ?, category = ?, client_id = ? WHERE id = ?");
            $stmt->execute([$input['title'], $input['content'], $input['category'], $input['client_id'] ?? null, $input['id']]);
            echo json_encode(['success' => true]);
        }
        elseif ($subAction === 'delete') {
            $stmt = $pdo->prepare("DELETE FROM sops WHERE id = ?");
            $stmt->execute([$input['id']]);
            echo json_encode(['success' => true]);
        }
        break;

    case 'get_client_documents':
        $clientId = $_GET['client_id'] ?? null;
        if ($clientId && $clientId !== 'ALL') {
            $stmt = $pdo->prepare("SELECT * FROM client_documents WHERE client_id = ? ORDER BY uploaded_at DESC");
            $stmt->execute([$clientId]);
        } else {
            $stmt = $pdo->query("SELECT * FROM client_documents ORDER BY uploaded_at DESC");
        }
        $docs = $stmt->fetchAll(PDO::FETCH_ASSOC);

        header('Content-Type: application/json; charset=utf-8');
        echo safe_json_encode($docs);
        break;

    case 'manage_client_document':
        if ($method !== 'POST') break;
        // Unify data source for mixed content-types
        $inputData = json_decode(file_get_contents('php://input'), true) ?: $_POST;
        $subAction = $inputData['subAction'] ?? '';
        

        
        if ($subAction === 'upload') {
            if (isset($_FILES['file']) && (isset($_POST['client_id']) || isset($inputData['client_id']))) {
                
                // LIMIT CHECK
                require_once 'saas_limits.php';
                $limits = new SaaS_Limits($master_pdo ?? null, $_SESSION['tenant_instance_id'] ?? null);
                
                if (!$limits->checkStorage($_FILES['file']['size'])) {
                     echo safe_json_encode(['error' => 'Przekroczono limit miejsca na dysku dla Twojego planu (' . $limits->getPlanName() . ').']);
                     break;
                }

                $clientId = $_POST['client_id'] ?? $inputData['client_id'];
                $target_dir = UPLOAD_ROOT . "vault/"; 
                if (!file_exists($target_dir)) mkdir($target_dir, 0755, true);
                $originalName = basename($_FILES["file"]["name"]);
                $fileName = time() . '_vault_' . preg_replace("/[^a-zA-Z0-9\.]/", "", $originalName);
                $target_file = $target_dir . $fileName;
                
                $logMsg = "[".date('Y-m-d H:i:s')."] Starting upload: $originalName for client $clientId in $target_dir\n";
                
                if (move_uploaded_file($_FILES["file"]["tmp_name"], $target_file)) {
                    $logMsg .= "[".date('Y-m-d H:i:s')."] File moved to: $target_file\n";
                    $ext = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
                    $parsedContent = null;
                    if ($ext === 'txt' || $ext === 'md') {
                        $parsedContent = file_get_contents($target_file);
                    } elseif ($ext === 'pdf') {
                        $parsedContent = extract_pdf_text($target_file, $limits);
                    }
                    
                    try {
                        $stmt = $pdo->prepare("INSERT INTO client_documents (client_id, filename, file_path, parsed_content) VALUES (?, ?, ?, ?)");
                        $stmt->execute([$clientId, $originalName, UPLOAD_URL . 'vault/' . $fileName, $parsedContent]);
                        $logMsg .= "[".date('Y-m-d H:i:s')."] DB Insert Success. ID: ".$pdo->lastInsertId()."\n";
                        
                        // UPDATE USAGE
                        $limits->updateStorageUsage($_FILES['file']['size']);
                        
                        echo safe_json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
                    } catch (Exception $e) {
                        $logMsg .= "[".date('Y-m-d H:i:s')."] DB Error: ".$e->getMessage()."\n";
                        echo safe_json_encode(['error' => 'Błąd bazy danych.']);
                    }
                } else {
                    $logMsg .= "[".date('Y-m-d H:i:s')."] Move FAILED. tmp: ".$_FILES["file"]["tmp_name"]."\n";
                    echo safe_json_encode(['error' => 'Nie udało się przenieść wgranego pliku.']);
                }
                error_log($logMsg);
            } else {
                echo safe_json_encode(['error' => 'Brak pliku lub client_id w żądaniu.']);
            }
        } elseif ($subAction === 'reindex') {
            $id = $inputData['id'] ?? null;
            $stmt = $pdo->prepare("SELECT filename, file_path FROM client_documents WHERE id = ?");
            $stmt->execute([$id]);
            $doc = $stmt->fetch();
            if ($doc) {
                $fullPath = ".." . $doc['file_path'];
                if (file_exists($fullPath)) {
                    $ext = strtolower(pathinfo($doc['filename'], PATHINFO_EXTENSION));
                    $content = null;
                    if ($ext === 'txt' || $ext === 'md') {
                        $content = @file_get_contents($fullPath);
                    } elseif ($ext === 'pdf') {
                         // LIMIT CHECK FOR REINDEX
                         require_once 'saas_limits.php';
                         $limits = new SaaS_Limits($master_pdo ?? null, $_SESSION['tenant_instance_id'] ?? null);
                         $content = extract_pdf_text($fullPath, $limits);
                    }
                    
                    $pdo->prepare("UPDATE client_documents SET parsed_content = ? WHERE id = ?")->execute([$content, $id]);
                    echo safe_json_encode(['success' => true, 'preview' => mb_substr($content ?? '', 0, 100)]);
                } else {
                    echo safe_json_encode(['error' => 'Plik nie istnieje na dysku: ' . $doc['file_path']]);
                }
            } else {
                echo safe_json_encode(['error' => 'Dokument nie istnieje w bazie danych.']);
            }
        } elseif ($subAction === 'delete') {
            $id = $inputData['id'] ?? null;
            $stmt = $pdo->prepare("SELECT file_path FROM client_documents WHERE id = ?");
            $stmt->execute([$id]);
            $doc = $stmt->fetch();
            if ($doc) {
                @unlink(".." . $doc['file_path']);
                $pdo->prepare("DELETE FROM client_documents WHERE id = ?")->execute([$id]);
                echo safe_json_encode(['success' => true]);
            } else {
                echo safe_json_encode(['error' => 'Dokument nie istnieje']);
            }
        } else {
            echo safe_json_encode(['error' => 'Nieznany subAction: ' . $subAction]);
        }
        break;

    case 'update_client_data':
        $data = json_decode(file_get_contents('php://input'), true) ?: $_POST;
        $clientId = $data['client_id'] ?? null;
        $field = $data['field'] ?? null;
        $value = $data['value'] ?? null;

        if ($clientId && $field === 'admin_notes') {
            $stmt = $pdo->prepare("UPDATE users SET admin_notes = ? WHERE id = ?");
            $stmt->execute([$value, $clientId]);
            echo json_encode(['success' => true]);
        } else {
            http_response_code(400); echo json_encode(['error' => 'Błędne dane lub nieobsługiwane pole']);
        }
    break;
}
?>