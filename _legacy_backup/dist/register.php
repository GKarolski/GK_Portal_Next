<?php
/**
 * GK Portal SaaS - Registration Step 1: Account Details
 * V2: Cyberpunk Corporate Design
 */
session_start();
?>
<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Stwórz Konto | GK Portal</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <script src="https://unpkg.com/lucide@latest"></script>
    <style>
        body { font-family: 'Inter', sans-serif; background-color: #050505; color: #f8fafc; }
        .glass { background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05); backdrop-filter: blur(20px); }
        .input-field {
            background: rgba(10, 10, 10, 0.6);
            border: 1px solid rgba(255, 255, 255, 0.05);
            transition: all 0.3s ease;
        }
        .input-field:focus {
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
<body class="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
    
    <!-- Background Effects -->
    <div class="fixed inset-0 z-0">
        <div class="absolute top-0 right-0 w-[800px] h-[600px] bg-red-600/5 blur-[120px] rounded-full pointer-events-none"></div>
        <div class="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-600/5 blur-[100px] rounded-full pointer-events-none"></div>
    </div>

    <div class="w-full max-w-[480px] relative z-10">
        
        <!-- Logo -->
        <div class="flex justify-center mb-8">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded bg-gradient-to-tr from-gk-800 to-black border border-white/10 flex items-center justify-center text-accent-red font-bold text-sm shadow-[0_0_15px_rgba(239,68,68,0.3)] text-red-500">GK</div>
                <span class="font-bold text-xl tracking-tight text-white">GK_<span class="text-red-500">Digital</span></span>
            </div>
        </div>

        <div class="glass p-8 md:p-10 rounded-2xl shadow-2xl relative overflow-hidden group">
            <!-- Border Gradient -->
            <div class="absolute inset-0 border border-white/5 rounded-2xl pointer-events-none"></div>
            
            <div class="text-center mb-8">
                <h1 class="text-2xl font-bold text-white mb-2">Rozpocznij tutaj.</h1>
                <p class="text-sm text-slate-500">Krok 1: Skonfiguruj identyfikator organizacji.</p>
            </div>

            <form id="step1Form" class="space-y-5">
                <div class="space-y-1.5">
                    <label class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider ml-1">Nazwa Organizacji</label>
                    <div class="relative">
                        <i data-lucide="building-2" class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"></i>
                        <input type="text" name="company" required placeholder="np. GK Digital Sp. z o.o." 
                               class="input-field w-full h-12 pl-10 pr-4 rounded-lg text-sm text-white placeholder:text-slate-600 outline-none">
                    </div>
                </div>

                <div class="space-y-1.5">
                    <label class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider ml-1">Email Administratora</label>
                    <div class="relative">
                        <i data-lucide="mail" class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"></i>
                        <input type="email" name="email" required placeholder="jan@twoja-firma.pl" 
                               class="input-field w-full h-12 pl-10 pr-4 rounded-lg text-sm text-white placeholder:text-slate-600 outline-none">
                    </div>
                </div>

                <div class="space-y-1.5">
                    <label class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider ml-1">Hasło</label>
                    <div class="relative">
                        <i data-lucide="lock" class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"></i>
                        <input type="password" name="password" required placeholder="••••••••" 
                               class="input-field w-full h-12 pl-10 pr-4 rounded-lg text-sm text-white placeholder:text-slate-600 outline-none">
                    </div>
                </div>

                <div id="statusMessage" class="hidden p-3 rounded-lg text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20 text-center"></div>

                <button type="submit" id="submitBtn" class="btn-primary w-full h-12 rounded-lg text-white font-bold text-sm tracking-wide flex items-center justify-center gap-2 mt-4 cursor-pointer">
                    <span>Przejdź do wyboru pakietu</span>
                    <i data-lucide="arrow-right" class="w-4 h-4"></i>
                </button>
            </form>
            
            <div class="mt-8 pt-6 border-t border-white/5 text-center">
                 <p class="text-xs text-slate-600">Masz już konto? <a href="/login.php" class="text-white hover:text-red-500 transition-colors font-medium">Zaloguj się</a></p>
            </div>
        </div>
        
        <!-- Steps Indicator -->
        <div class="flex justify-center gap-2 mt-8">
            <div class="w-12 h-1 bg-red-500 rounded-full"></div>
            <div class="w-2 h-1 bg-white/10 rounded-full"></div>
            <div class="w-2 h-1 bg-white/10 rounded-full"></div>
        </div>

    </div>

    <script>
        lucide.createIcons();
        const form = document.getElementById('step1Form');
        const btn = document.getElementById('submitBtn');
        const status = document.getElementById('statusMessage');

        form.onsubmit = async (e) => {
            e.preventDefault();
            btn.disabled = true;
            btn.innerHTML = '<span class="animate-pulse">Przetwarzanie...</span>';
            status.classList.add('hidden');

            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            data.action = 'step1';

            try {
                const res = await fetch('/api/register_process.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                const result = await res.json();

                if (result.success) {
                    window.location.href = '/select_plan.php';
                } else {
                    throw new Error(result.error || 'Błąd zapisu danych.');
                }
            } catch (err) {
                console.error(err);
                btn.disabled = false;
                btn.innerHTML = '<span>Przejdź do wyboru pakietu</span> <i data-lucide="arrow-right" class="w-4 h-4"></i>';
                lucide.createIcons();
                status.innerText = err.message;
                status.classList.remove('hidden');
            }
        };
    </script>
</body>
</html>
