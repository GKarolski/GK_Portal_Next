<?php
session_start();
// If already logged in, redirect to App
if (isset($_SESSION['user_id'])) {
    header("Location: /app");
    exit;
}

$status = $_GET['status'] ?? '';
$successMessage = '';
if ($status === 'success') {
    $successMessage = 'Twoje konto zostało utworzone. Zaloguj się, aby uzyskać dostęp.';
}
?>
<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Logowanie | GK Portal</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <script src="https://unpkg.com/lucide@latest"></script>
    <style>
        body { font-family: 'Inter', sans-serif; background-color: #050505; color: #f8fafc; }
        .glass { background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05); backdrop-filter: blur(20px); }
        .input-cyber {
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: white;
            transition: all 0.3s ease;
        }
        .input-cyber:focus {
            border-color: #ef4444;
            box-shadow: 0 0 15px rgba(239, 68, 68, 0.1);
        }
        .btn-primary {
            background-color: #ef4444;
            transition: all 0.3s ease;
        }
        .btn-primary:hover {
            background-color: #dc2626;
            box-shadow: 0 0 20px rgba(239, 68, 68, 0.3);
        }
    </style>
</head>
<body class="min-h-screen flex items-center justify-center relative overflow-hidden px-4">
    
    <!-- Background Effects -->
    <div class="fixed inset-0 z-0 pointer-events-none">
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-red-600/5 blur-[120px] rounded-full"></div>
    </div>

    <div class="w-full max-w-md relative z-10">
        
        <div class="text-center mb-10">
            <a href="/" class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#0a0a0a] border border-white/5 mb-6 text-red-500 shadow-2xl">
                <i data-lucide="shield-check" class="w-8 h-8"></i>
            </a>
            <h1 class="text-3xl font-bold tracking-tight mb-2 text-white">Witaj ponownie</h1>
            <p class="text-slate-500">Zaloguj się do swojego panelu zarządzania.</p>
        </div>

        <div class="glass p-8 rounded-2xl shadow-2xl relative">
            
            <?php if ($successMessage): ?>
            <div class="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20 flex items-start gap-3">
                <i data-lucide="check-circle" class="w-5 h-5 text-green-500 shrink-0 mt-0.5"></i>
                <div>
                    <h3 class="text-sm font-bold text-green-400">Sukces!</h3>
                    <p class="text-xs text-green-500/80 mt-1"><?php echo htmlspecialchars($successMessage); ?></p>
                </div>
            </div>
            <?php endif; ?>

            <div id="error-msg" class="hidden mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
                <i data-lucide="alert-triangle" class="w-5 h-5 text-red-500 shrink-0 mt-0.5"></i>
                <div>
                    <h3 class="text-sm font-bold text-red-400">Błąd</h3>
                    <p id="error-text" class="text-xs text-red-500/80 mt-1"></p>
                </div>
            </div>

            <!-- LOGIN FORM -->
            <form id="loginForm" class="space-y-5">
                <div>
                    <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Email</label>
                    <div class="relative">
                        <input type="email" name="email" required 
                            class="input-cyber w-full h-12 rounded-lg pl-10 pr-4 text-sm focus:outline-none"
                            placeholder="name@company.com">
                        <i data-lucide="mail" class="absolute left-3 top-3.5 w-5 h-5 text-slate-600"></i>
                    </div>
                </div>

                <div>
                    <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex justify-between">
                        <span>Hasło</span>
                        <button type="button" onclick="toggleView('reset')" class="text-red-500 hover:text-red-400 normal-case font-normal transition-colors text-xs">Zapomniałeś hasła?</button>
                    </label>
                    <div class="relative">
                        <input type="password" name="password" required 
                            class="input-cyber w-full h-12 rounded-lg pl-10 pr-4 text-sm focus:outline-none"
                            placeholder="••••••••">
                        <i data-lucide="lock" class="absolute left-3 top-3.5 w-5 h-5 text-slate-600"></i>
                    </div>
                </div>

                <button type="submit" id="submitBtn" class="btn-primary w-full h-12 rounded-lg text-white font-bold text-sm tracking-wide flex items-center justify-center gap-2 mt-2">
                    <span>Zaloguj się</span>
                    <i data-lucide="arrow-right" class="w-4 h-4"></i>
                </button>
            </form>

            <!-- RESET PASSWORD FORM -->
            <form id="resetForm" class="space-y-5 hidden">
                <div class="text-center mb-6">
                    <h3 class="text-lg font-bold text-white">Odzyskiwanie Konta</h3>
                    <p class="text-xs text-slate-500 mt-1">Podaj email, aby otrzymać link resetujący.</p>
                </div>

                <div>
                    <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Email</label>
                    <div class="relative">
                        <input type="email" name="email" required 
                            class="input-cyber w-full h-12 rounded-lg pl-10 pr-4 text-sm focus:outline-none"
                            placeholder="name@company.com">
                        <i data-lucide="mail" class="absolute left-3 top-3.5 w-5 h-5 text-slate-600"></i>
                    </div>
                </div>

                <div id="reset-success" class="hidden p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-xs flex items-center gap-2">
                    <i data-lucide="check" class="w-4 h-4"></i>
                    Link resetujący został wysłany! Sprawdź skrzynkę (i SPAM).
                </div>

                <button type="submit" id="resetBtn" class="btn-primary w-full h-12 rounded-lg text-white font-bold text-sm tracking-wide flex items-center justify-center gap-2 mt-2">
                    <span>Wyślij Link</span>
                    <i data-lucide="send" class="w-4 h-4"></i>
                </button>

                <button type="button" onclick="toggleView('login')" class="w-full text-center text-xs text-slate-500 hover:text-white mt-4 transition-colors">
                    Wróć do logowania
                </button>
            </form>

            <div id="footer-links" class="mt-8 text-center">
                <p class="text-sm text-slate-500">
                    Nie masz konta? 
                    <a href="/register.php" class="text-white hover:text-red-500 font-medium transition-colors">Utwórz konto</a>
                </p>
            </div>
        </div>

    <div class="mt-8 text-center text-[10px] text-slate-700 font-mono">
            GK Portal &copy; <?php echo date('Y'); ?>
        </div>

    </div>

    <script>
        lucide.createIcons();

        function toggleView(view) {
            const loginForm = document.getElementById('loginForm');
            const resetForm = document.getElementById('resetForm');
            const footer = document.getElementById('footer-links');
            const errorDiv = document.getElementById('error-msg');
            
            errorDiv.classList.add('hidden'); // clear errors

            if (view === 'reset') {
                loginForm.classList.add('hidden');
                resetForm.classList.remove('hidden');
                footer.classList.add('hidden');
            } else {
                loginForm.classList.remove('hidden');
                resetForm.classList.add('hidden');
                footer.classList.remove('hidden');
            }
        }

        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('submitBtn');
            const errorDiv = document.getElementById('error-msg');
            const errorText = document.getElementById('error-text');
            
            errorDiv.classList.add('hidden');
            btn.disabled = true;
            btn.innerHTML = '<i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i>';
            lucide.createIcons();

            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());

            try {
                const res = await fetch('/api/index.php?action=login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                const result = await res.json();

                if (res.ok && !result.error) {
                    // Success - Redirect -> App
                    window.location.href = '/app';
                } else {
                    throw new Error(result.error || 'Błąd logowania');
                }
            } catch (err) {
                errorText.textContent = err.message;
                errorDiv.classList.remove('hidden');
                btn.disabled = false;
                btn.innerHTML = '<span>Zaloguj się</span><i data-lucide="arrow-right" class="w-4 h-4"></i>';
                lucide.createIcons();
            }
        });

        document.getElementById('resetForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('resetBtn');
            const successDiv = document.getElementById('reset-success');
            const errorDiv = document.getElementById('error-msg');
            const errorText = document.getElementById('error-text');

            successDiv.classList.add('hidden');
            errorDiv.classList.add('hidden');
            btn.disabled = true;
            btn.innerHTML = '<i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i>';
            lucide.createIcons();

            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());

            try {
                const res = await fetch('/api/index.php?action=request_reset', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                const result = await res.json();

                if (res.ok && result.success) {
                    successDiv.classList.remove('hidden');
                    // Optional: hide form fields?
                    document.querySelector('#resetForm input').disabled = true;
                } else {
                    throw new Error(result.error || 'Wystąpił błąd.');
                }
            } catch (err) {
                errorText.textContent = err.message;
                errorDiv.classList.remove('hidden');
            } finally {
                if (!successDiv.classList.contains('hidden')) {
                     btn.innerHTML = '<span>Wysłano!</span><i data-lucide="check" class="w-4 h-4"></i>';
                     btn.classList.add('bg-green-600', 'hover:bg-green-700');
                } else {
                     btn.disabled = false;
                     btn.innerHTML = '<span>Wyślij Link</span><i data-lucide="send" class="w-4 h-4"></i>';
                }
                lucide.createIcons();
            }
        });
    </script>
</body>
</html>
