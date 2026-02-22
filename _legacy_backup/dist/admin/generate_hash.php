<?php
/**
 * GK Portal SaaS - HASH GENERATOR
 * 
 * Wgraj ten plik na serwer, np. do public_html/admin/generate_hash.php
 * Wejdź w przeglądarce, wpisz hasło → skopiuj hash → wklej do god_mode.php
 * PO UŻYCIU NATYCHMIAST USUŃ TEN PLIK Z SERWERA!
 */
?>
<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🔐 Hash Generator</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            min-height: 100vh; display: flex; align-items: center; justify-content: center;
            background: #050505; font-family: 'Inter', system-ui, sans-serif; color: #fff;
        }
        .card {
            background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
            border-radius: 20px; padding: 40px; max-width: 500px; width: 100%; margin: 20px;
        }
        h1 { font-size: 20px; margin-bottom: 8px; }
        .sub { color: #64748b; font-size: 12px; margin-bottom: 30px; }
        label { display: block; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px; }
        input { 
            width: 100%; padding: 14px; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1);
            border-radius: 10px; color: white; font-size: 16px; outline: none; margin-bottom: 20px;
        }
        input:focus { border-color: #ef4444; box-shadow: 0 0 15px rgba(239,68,68,0.1); }
        button { 
            width: 100%; padding: 14px; background: #ef4444; color: white; border: none;
            border-radius: 10px; font-weight: 700; font-size: 14px; cursor: pointer;
        }
        button:hover { background: #dc2626; }
        .result {
            margin-top: 24px; padding: 16px; background: rgba(16,185,129,0.05); border: 1px solid rgba(16,185,129,0.2);
            border-radius: 12px;
        }
        .result h3 { color: #10b981; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px; }
        .hash { 
            word-break: break-all; font-family: monospace; font-size: 13px; color: #34d399;
            background: rgba(0,0,0,0.3); padding: 12px; border-radius: 8px; cursor: pointer;
            user-select: all;
        }
        .warning { 
            margin-top: 20px; padding: 12px; background: rgba(239,68,68,0.05); 
            border: 1px solid rgba(239,68,68,0.2); border-radius: 10px;
            color: #f87171; font-size: 11px; font-weight: 600;
        }
        .step { color: #64748b; font-size: 11px; margin-top: 16px; line-height: 1.8; }
        .step b { color: #94a3b8; }
    </style>
</head>
<body>
    <div class="card">
        <h1>🔐 God Mode Hash Generator</h1>
        <p class="sub">Wygeneruj hash bcrypt dla panelu God Mode</p>

        <form method="POST">
            <label>Email administratora</label>
            <input type="email" name="god_email" placeholder="admin@twojadomena.pl" required 
                   value="<?php echo htmlspecialchars($_POST['god_email'] ?? ''); ?>">

            <label>Hasło do God Mode</label>
            <input type="password" name="god_password" placeholder="Wpisz bezpieczne hasło" required>

            <button type="submit">Generuj Hash</button>
        </form>

        <?php if ($_SERVER['REQUEST_METHOD'] === 'POST' && !empty($_POST['god_password']) && !empty($_POST['god_email'])): ?>
        <div class="result">
            <h3>✅ Twoje dane</h3>
            
            <p style="color:#94a3b8;font-size:11px;margin-bottom:6px;font-weight:700;">EMAIL:</p>
            <div class="hash" style="color:#60a5fa;margin-bottom:12px;" onclick="copyThis(this)">
                <?php echo htmlspecialchars($_POST['god_email']); ?>
            </div>

            <p style="color:#94a3b8;font-size:11px;margin-bottom:6px;font-weight:700;">HASH HASŁA (skopiuj to):</p>
            <div class="hash" onclick="copyThis(this)">
                <?php echo password_hash($_POST['god_password'], PASSWORD_DEFAULT); ?>
            </div>

            <div class="step">
                <b>Krok 1:</b> Otwórz plik <code>admin/god_mode.php</code> na serwerze<br>
                <b>Krok 2:</b> Wklej email w linii <code>$GOD_MODE_EMAIL</code><br>
                <b>Krok 3:</b> Wklej hash w linii <code>$GOD_MODE_HASH</code><br>
                <b>Krok 4:</b> <span style="color:#ef4444;font-weight:800;">USUŃ TEN PLIK (generate_hash.php) Z SERWERA!</span>
            </div>
        </div>
        <?php endif; ?>

        <div class="warning">
            ⚠️ UWAGA: Ten plik MUSI zostać usunięty z serwera po wygenerowaniu hasha. 
            Każdy kto zna adres tego pliku może wygenerować hashe!
        </div>
    </div>

    <script>
        function copyThis(el) {
            const text = el.textContent.trim();
            navigator.clipboard.writeText(text).then(() => {
                const orig = el.style.borderColor;
                el.style.borderColor = '#10b981';
                setTimeout(() => el.style.borderColor = orig, 1000);
            });
        }
    </script>
</body>
</html>
