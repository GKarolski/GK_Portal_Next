<?php
/**
 * GK Portal SaaS - GOD MODE PANEL
 * Internal management dashboard for the platform owner.
 */

require_once '../api/config.php';

// 1. SECURITY CHECK (Session-based + Email + Bcrypt Password)
// Generate your credentials via: /admin/generate_hash.php (upload, use, DELETE!)
$GOD_MODE_EMAIL = 'G.Karolski@gmail.com';  // ZMIEŃ NA SWÓJ EMAIL
$GOD_MODE_HASH  = '$2y$12$mW0SG32nPcO4yNyWn7UKRe61zgAk6mhpufIUgLQGcAKlH/ysPsL4S'; // ZMIEŃ NA SWÓJ HASH

$loginError = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['god_email'], $_POST['god_password'])) {
    if ($_POST['god_email'] === $GOD_MODE_EMAIL && password_verify($_POST['god_password'], $GOD_MODE_HASH)) {
        $_SESSION['god_mode_authenticated'] = true;
        $_SESSION['god_mode_expires'] = time() + 1800; // 30 min
        header('Location: ' . strtok($_SERVER['REQUEST_URI'], '?'));
        exit;
    } else {
        $loginError = 'Nieprawidłowy email lub hasło.';
    }
}

if (empty($_SESSION['god_mode_authenticated']) || ($_SESSION['god_mode_expires'] ?? 0) < time()) {
    unset($_SESSION['god_mode_authenticated'], $_SESSION['god_mode_expires']);
    ?>
<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>God Mode | GK Portal</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            min-height: 100vh; display: flex; align-items: center; justify-content: center;
            background: #050505; font-family: 'Inter', sans-serif; color: #f8fafc;
            position: relative; overflow: hidden;
        }
        .bg-glow {
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            width: 600px; height: 600px; background: rgba(239, 68, 68, 0.04);
            border-radius: 50%; filter: blur(120px); pointer-events: none;
        }
        .card {
            background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.08);
            backdrop-filter: blur(20px); border-radius: 24px; padding: 48px;
            max-width: 420px; width: 100%; margin: 20px; position: relative; z-index: 10;
            box-shadow: 0 25px 50px rgba(0,0,0,0.5);
        }
        .logo {
            width: 56px; height: 56px; background: #0a0a0a; border-radius: 16px;
            display: flex; align-items: center; justify-content: center;
            margin: 0 auto 24px; border: 1px solid rgba(255,255,255,0.05);
            font-weight: 900; font-size: 18px; color: #ef4444;
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.05);
        }
        h1 { text-align: center; font-size: 24px; font-weight: 800; margin-bottom: 4px; letter-spacing: -0.5px; }
        .sub { text-align: center; color: #64748b; font-size: 13px; margin-bottom: 32px; }
        label {
            display: block; font-size: 10px; font-weight: 800; color: #64748b;
            text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px;
        }
        .input-wrap { position: relative; margin-bottom: 20px; }
        .input-wrap svg {
            position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
            width: 18px; height: 18px; color: #475569;
        }
        input {
            width: 100%; padding: 14px 14px 14px 44px; background: rgba(0,0,0,0.4);
            border: 1px solid rgba(255,255,255,0.1); border-radius: 12px;
            color: white; font-size: 14px; outline: none; transition: all 0.3s;
        }
        input:focus { border-color: #ef4444; box-shadow: 0 0 20px rgba(239,68,68,0.08); }
        input::placeholder { color: #334155; }
        .btn {
            width: 100%; padding: 14px; background: #ef4444; color: white; border: none;
            border-radius: 12px; font-weight: 700; font-size: 14px; cursor: pointer;
            transition: all 0.3s; display: flex; align-items: center; justify-content: center; gap: 8px;
            box-shadow: 0 4px 15px rgba(239,68,68,0.2); margin-top: 4px;
        }
        .btn:hover { background: #dc2626; box-shadow: 0 4px 25px rgba(239,68,68,0.3); transform: translateY(-1px); }
        .btn:active { transform: translateY(0); }
        .error {
            padding: 12px 16px; background: rgba(239,68,68,0.05);
            border: 1px solid rgba(239,68,68,0.15); border-radius: 10px;
            color: #f87171; font-size: 13px; font-weight: 600; margin-bottom: 20px;
            display: flex; align-items: center; gap: 8px;
        }
        .footer { text-align: center; margin-top: 32px; color: #1e293b; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 3px; }
    </style>
</head>
<body>
    <div class="bg-glow"></div>
    <div>
        <div class="card">
            <div class="logo">GK</div>
            <h1>God Mode</h1>
            <p class="sub">Panel zarządzania platformą SaaS</p>

            <?php if ($loginError): ?>
            <div class="error">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <?php echo htmlspecialchars($loginError); ?>
            </div>
            <?php endif; ?>

            <form method="POST">
                <label>Email</label>
                <div class="input-wrap">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                    <input type="email" name="god_email" placeholder="admin@domena.pl" required autofocus
                           value="<?php echo htmlspecialchars($_POST['god_email'] ?? ''); ?>">
                </div>

                <label>Hasło</label>
                <div class="input-wrap">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    <input type="password" name="god_password" placeholder="••••••••" required>
                </div>

                <button type="submit" class="btn">
                    Zaloguj bezpiecznie
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                </button>
            </form>
        </div>
        <div class="footer">Secured by GK_Digital Infrastructure</div>
    </div>
</body>
</html>
    <?php
    exit;
}


// 2. IMPERSONATION LOGIC
if (isset($_GET['action']) && $_GET['action'] === 'login_as' && isset($_GET['id'])) {
    $targetId = $_GET['id'];
    
    // Find tenant details in Master DB
    $stmt = $master_pdo->prepare("SELECT t.*, i.instance_id FROM saas_tenants t JOIN saas_instances i ON t.id = i.tenant_id WHERE t.id = ?");
    $stmt->execute([$targetId]);
    $tenant = $stmt->fetch();

    if ($tenant) {
        // Clear current session and set new tenant identity
        $_SESSION['tenant_id'] = $tenant['id'];
        $_SESSION['tenant_instance_id'] = $tenant['instance_id'];
        $_SESSION['is_owner'] = true;
        $_SESSION['owner_email'] = $tenant['owner_email'];
        
        // We don't have the user_id for the tenant's user table easily here (it's in tenant DB),
        // but for high-level dashboard viewing, tenant_id + instance_id is enough to bypass 
        // the instance check. The user will be redirected to the app and will need to have a session user_id.
        // For full "Log In As", we'd need to fetch the owner user record from the tenant DB.
        
        echo "<script>alert('Logowanie jako: " . $tenant['owner_email'] . "'); window.location.href='/app';</script>";
        exit;
    }
}

// 3. FETCH DATA FOR DASHBOARD
try {
    // KPIs
    $totalUsers = $master_pdo->query("SELECT COUNT(*) FROM saas_tenants")->fetchColumn();
    $activeSubs = $master_pdo->query("SELECT COUNT(*) FROM saas_tenants WHERE plan_tier != 'STARTER'")->fetchColumn();
    
    // Calculate MRR
    $revStats = $master_pdo->query("SELECT plan_tier, COUNT(*) as count FROM saas_tenants GROUP BY plan_tier")->fetchAll(PDO::FETCH_KEY_PAIR);
    $mrr = ($revStats['STANDARD'] ?? 0) * 149 + ($revStats['AGENCY'] ?? 0) * 259;

    // Tenants Table
    $tenants = $master_pdo->query("SELECT t.*, i.instance_id FROM saas_tenants t LEFT JOIN saas_instances i ON t.id = i.tenant_id ORDER BY t.created_at DESC")->fetchAll();

} catch (Exception $e) {
    error_log('God Mode DB Error: ' . $e->getMessage());
    die('Błąd połączenia z bazą danych.');
}
?>
<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>God Mode | GK Portal</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
        body { font-family: 'Inter', sans-serif; background-color: #020617; color: #f8fafc; }
        .glass { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.05); backdrop-filter: blur(10px); }
        .accent-red { color: #ef4444; }
        .bg-accent-red { background-color: #ef4444; }
    </style>
</head>
<body class="p-4 lg:p-12">
    <div class="max-w-7xl mx-auto space-y-12">
        
        <!-- Header -->
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
                <h1 class="text-4xl font-black italic tracking-tighter">GOD_<span class="text-accent-red">MODE</span></h1>
                <p class="text-slate-500 font-medium">SaaS Global Control Center</p>
            </div>
            <div class="flex gap-4">
                <a href="/app" class="px-6 py-2 rounded-xl glass hover:bg-white/5 transition-all text-sm font-bold">Wróć do App</a>
                <div class="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <span class="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> System Live
                </div>
            </div>
        </div>

        <!-- KPI Grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="glass p-8 rounded-3xl relative overflow-hidden group">
                <div class="relative z-10">
                    <p class="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Total Tenants</p>
                    <h2 class="text-5xl font-black"><?php echo $totalUsers; ?></h2>
                </div>
                <div class="absolute -right-4 -bottom-4 text-white/5 group-hover:text-white/10 transition-all">
                    <svg width="120" height="120" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                </div>
            </div>
            
            <div class="glass p-8 rounded-3xl relative overflow-hidden group border-accent-red/20 shadow-2xl shadow-accent-red/5">
                <div class="relative z-10">
                    <p class="text-accent-red text-xs font-bold uppercase tracking-widest mb-1">Active Subscriptions</p>
                    <h2 class="text-5xl font-black"><?php echo $activeSubs; ?></h2>
                </div>
                <div class="absolute -right-4 -bottom-4 text-accent-red/5 group-hover:text-accent-red/10 transition-all">
                    <svg width="120" height="120" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg>
                </div>
            </div>

            <div class="glass p-8 rounded-3xl relative overflow-hidden group">
                <div class="relative z-10">
                    <p class="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Estimated MRR</p>
                    <h2 class="text-5xl font-black text-emerald-400"><?php echo number_format($mrr, 0, ',', ' '); ?> <span class="text-2xl italic tracking-normal">PLN</span></h2>
                </div>
                <div class="absolute -right-4 -bottom-4 text-emerald-500/5 group-hover:text-emerald-500/10 transition-all">
                    <svg width="120" height="120" fill="currentColor" viewBox="0 0 24 24"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg>
                </div>
            </div>
        </div>

        <!-- Master Table -->
        <div class="glass rounded-3xl overflow-hidden">
            <div class="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                <h3 class="font-bold text-lg">Wszystkie Instancje</h3>
                <span class="text-slate-500 text-xs font-medium">Ostatnia aktualizacja: <?php echo date('H:i'); ?></span>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-white/5 bg-white/[0.02]">
                            <th class="px-6 py-4">ID / Instance</th>
                            <th class="px-6 py-4">Firma & Email</th>
                            <th class="px-6 py-4 text-center">Plan</th>
                            <th class="px-6 py-4">Status Stripe</th>
                            <th class="px-6 py-4">Data Rejestracji</th>
                            <th class="px-6 py-4 text-right">Akcje</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-white/5">
                        <?php foreach ($tenants as $t): ?>
                        <tr class="hover:bg-white/[0.02] transition-colors group">
                            <td class="px-6 py-5">
                                <div class="font-mono text-[10px] text-slate-500 mb-1"><?php echo $t['id']; ?></div>
                                <div class="font-bold text-accent-red text-xs tracking-tighter uppercase"><?php echo $t['instance_id']; ?></div>
                            </td>
                            <td class="px-6 py-5">
                                <div class="font-bold text-white"><?php echo $t['company_name'] ?: '---'; ?></div>
                                <div class="text-xs text-slate-500"><?php echo $t['owner_email']; ?></div>
                            </td>
                            <td class="px-6 py-5 text-center">
                                <?php 
                                    $planColor = 'bg-slate-500/10 text-slate-400';
                                    if ($t['plan_tier'] === 'STANDARD') $planColor = 'bg-blue-500/10 text-blue-400';
                                    if ($t['plan_tier'] === 'AGENCY') $planColor = 'bg-accent-red/10 text-accent-red';
                                ?>
                                <span class="px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase <?php echo $planColor; ?>">
                                    <?php echo $t['plan_tier']; ?>
                                </span>
                            </td>
                            <td class="px-6 py-5">
                                <div class="flex items-center gap-2">
                                    <div class="w-1.5 h-1.5 rounded-full <?php echo $t['stripe_subscription_id'] ? 'bg-emerald-500' : 'bg-slate-700'; ?>"></div>
                                    <span class="text-xs font-medium <?php echo $t['stripe_subscription_id'] ? 'text-slate-300' : 'text-slate-600'; ?>">
                                        <?php echo $t['stripe_subscription_id'] ?: 'Brak subskrypcji'; ?>
                                    </span>
                                </tr>
                            </td>
                            <td class="px-6 py-5">
                                <span class="text-xs font-mono text-slate-500">
                                    <?php echo date('d.m.Y H:i', strtotime($t['created_at'])); ?>
                                </span>
                            </td>
                            <td class="px-6 py-5 text-right">
                                <a href="?action=login_as&id=<?php echo $t['id']; ?>" 
                                   class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-red/10 text-accent-red text-xs font-black uppercase tracking-widest hover:bg-accent-red hover:text-white transition-all shadow-lg shadow-accent-red/10 group-hover:scale-105 active:scale-95">
                                    <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                                    Zaloguj jako
                                </a>
                            </td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        </div>

        <div class="text-center text-slate-700 text-[10px] font-bold uppercase tracking-widest pb-12">
            GK Portal God Mode Engine v1.0 &bull; Secure Encrypted Session
        </div>
    </div>
</body>
</html>
