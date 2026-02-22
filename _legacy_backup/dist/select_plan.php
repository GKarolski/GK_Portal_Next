<?php
/**
 * GK Portal SaaS - Registration Step 2: Plan Selection
 */
session_start();

// Redirect back if Step 1 details are missing
if (!isset($_SESSION['signup_data'])) {
    header('Location: /register.php');
    exit;
}

$signup = $_SESSION['signup_data'];
?>
<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Wybierz Plan | GK Portal</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <script src="https://unpkg.com/lucide@latest"></script>
    <style>
        body { font-family: 'Inter', sans-serif; background-color: #050505; color: #f8fafc; }
        .glass { background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05); backdrop-filter: blur(20px); }
        .plan-card {
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .plan-card:hover {
            transform: translateY(-8px);
            border-color: rgba(239, 68, 68, 0.3);
            box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.5), 0 0 20px rgba(239, 68, 68, 0.1);
        }
        .btn-primary {
            background-color: #ef4444;
            transition: all 0.3s ease;
        }
        .btn-primary:hover {
            background-color: #dc2626;
            box-shadow: 0 0 20px rgba(239, 68, 68, 0.3);
        }
        .btn-secondary {
            background-color: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            transition: all 0.3s ease;
        }
        .btn-secondary:hover {
            background-color: rgba(255, 255, 255, 0.1);
            border-color: rgba(255, 255, 255, 0.2);
        }
    </style>
</head>
<body class="min-h-screen py-20 px-6 relative overflow-x-hidden">
    
    <!-- Background Effects -->
    <div class="fixed inset-0 z-0">
        <div class="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-red-600/5 blur-[120px] rounded-full pointer-events-none"></div>
    </div>

    <div class="max-w-7xl mx-auto relative z-10">
        
        <div class="text-center mb-16">
            <h1 class="text-4xl md:text-5xl font-bold tracking-tight mb-6">Wybierz paliwo dla <span class="text-red-500"><?php echo htmlspecialchars($signup['company']); ?></span></h1>
            <p class="text-slate-400 text-lg max-w-2xl mx-auto">Skaluj swój biznes z mocą AI. Przejrzyste zasady, zero ukrytych kosztów.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
            
            <!-- Standard Plan -->
            <div class="glass plan-card p-8 rounded-2xl flex flex-col relative group">
                <div class="mb-6">
                    <span class="text-[11px] font-bold uppercase tracking-widest text-slate-500">Optymalny</span>
                    <h3 class="text-2xl font-bold mt-2 text-white">Standard</h3>
                    <p class="text-sm text-slate-400 mt-2">Dla rosnących agencji.</p>
                </div>
                <div class="mb-8 flex items-baseline gap-1">
                    <span class="text-4xl font-bold text-white">149</span>
                    <span class="text-slate-500 text-sm font-medium">PLN / m-c</span>
                </div>
                
                <div class="h-px bg-white/5 w-full mb-8"></div>

                <ul class="space-y-4 mb-12 flex-1">
                    <li class="flex items-start gap-3 text-sm text-slate-300">
                        <i data-lucide="check" class="w-5 h-5 text-red-500 shrink-0"></i>
                        <span>5 GB Magazynu Plików</span>
                    </li>
                    <li class="flex items-start gap-3 text-sm text-slate-300">
                        <i data-lucide="check" class="w-5 h-5 text-red-500 shrink-0"></i>
                        <span>500k AI Tokens / m-c</span>
                    </li>
                    <li class="flex items-start gap-3 text-sm text-slate-300">
                        <i data-lucide="check" class="w-5 h-5 text-red-500 shrink-0"></i>
                        <span>Priorytetowe Wsparcie</span>
                    </li>
                    <li class="flex items-start gap-3 text-sm text-slate-300">
                        <i data-lucide="check" class="w-5 h-5 text-red-500 shrink-0"></i>
                        <span>Dostęp do API (Basic)</span>
                    </li>
                </ul>

                <button onclick="selectPlan('STANDARD')" class="btn-secondary w-full h-12 rounded-lg text-white font-bold text-sm tracking-wide transition-all group-hover:bg-white/10">
                    Wybieram Standard
                </button>
            </div>

            <!-- Agency Plan (VIP) -->
            <div class="relative group h-full md:-mt-8 md:mb-8">
                <!-- Glow Effect -->
                <div class="absolute -inset-0.5 bg-gradient-to-b from-red-600 to-red-900 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
                
                <div class="relative glass bg-[#0a0a0a] plan-card p-8 rounded-2xl flex flex-col h-full border border-red-500/30">
                    <div class="absolute top-0 right-0 p-4">
                        <span class="bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-[0_0_10px_rgba(239,68,68,0.4)]">Polecany</span>
                    </div>

                    <div class="mb-6">
                        <span class="text-[11px] font-bold uppercase tracking-widest text-red-400">Dla Profesjonalistów</span>
                        <h3 class="text-3xl font-bold mt-2 text-white">Agency <span class="text-red-500">+</span></h3>
                        <p class="text-sm text-slate-400 mt-2">Pełna moc i brak limitów.</p>
                    </div>
                    <div class="mb-8 flex items-baseline gap-1">
                        <span class="text-5xl font-bold text-white">259</span>
                        <span class="text-slate-500 text-sm font-medium">PLN / m-c</span>
                    </div>

                    <div class="h-px bg-white/5 w-full mb-8"></div>

                    <ul class="space-y-4 mb-12 flex-1">
                        <li class="flex items-start gap-3 text-sm text-white font-medium">
                            <div class="bg-red-500/20 p-1 rounded">
                                <i data-lucide="zap" class="w-4 h-4 text-red-500 shrink-0"></i>
                            </div>
                            <span>100 GB Magazynu Plików</span>
                        </li>
                        <li class="flex items-start gap-3 text-sm text-white font-medium">
                            <div class="bg-red-500/20 p-1 rounded">
                                <i data-lucide="zap" class="w-4 h-4 text-red-500 shrink-0"></i>
                            </div>
                            <span>2.0M AI Tokens / m-c</span>
                        </li>
                        <li class="flex items-start gap-3 text-sm text-white font-medium">
                            <div class="bg-red-500/20 p-1 rounded">
                                <i data-lucide="zap" class="w-4 h-4 text-red-500 shrink-0"></i>
                            </div>
                            <span>White-Label (Twoje Logo)</span>
                        </li>
                        <li class="flex items-start gap-3 text-sm text-white font-medium">
                            <div class="bg-red-500/20 p-1 rounded">
                                <i data-lucide="zap" class="w-4 h-4 text-red-500 shrink-0"></i>
                            </div>
                            <span>Dedykowany Opiekun 24/7</span>
                        </li>
                         <li class="flex items-start gap-3 text-sm text-white font-medium">
                            <div class="bg-red-500/20 p-1 rounded">
                                <i data-lucide="zap" class="w-4 h-4 text-red-500 shrink-0"></i>
                            </div>
                            <span>Dostęp do API (Full)</span>
                        </li>
                    </ul>

                    <button onclick="selectPlan('AGENCY')" class="btn-primary w-full h-14 rounded-lg text-white font-bold text-sm tracking-wide flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                        <span>Wybieram Agency Plus</span>
                        <i data-lucide="arrow-right" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>

            <!-- Starter Plan -->
            <div class="glass plan-card p-8 rounded-2xl flex flex-col relative group opacity-60 hover:opacity-100 transition-opacity duration-300">
                <div class="mb-6">
                    <span class="text-[11px] font-bold uppercase tracking-widest text-slate-500">Start</span>
                    <h3 class="text-2xl font-bold mt-2 text-white">Starter</h3>
                    <p class="text-sm text-slate-400 mt-2">Dla freelancerów.</p>
                </div>
                <div class="mb-8 flex items-baseline gap-1">
                    <span class="text-4xl font-bold text-white">89</span>
                    <span class="text-slate-500 text-sm font-medium">PLN / m-c</span>
                </div>

                <div class="h-px bg-white/5 w-full mb-8"></div>

                <ul class="space-y-4 mb-12 flex-1">
                    <li class="flex items-start gap-3 text-sm text-slate-400">
                        <i data-lucide="check" class="w-5 h-5 text-slate-600 shrink-0"></i>
                        <span>1 GB Magazynu Plików</span>
                    </li>
                    <li class="flex items-start gap-3 text-sm text-slate-400">
                        <i data-lucide="check" class="w-5 h-5 text-slate-600 shrink-0"></i>
                        <span>100k AI Tokens</span>
                    </li>
                    <li class="flex items-start gap-3 text-sm text-slate-400">
                        <i data-lucide="check" class="w-5 h-5 text-slate-600 shrink-0"></i>
                        <span>Podstawowe Wsparcie</span>
                    </li>
                </ul>

                <button onclick="selectPlan('STARTER')" class="btn-secondary w-full h-12 rounded-lg text-white font-bold text-sm tracking-wide transition-all bg-transparent hover:bg-white/5 border-white/5">
                    Wybieram Starter
                </button>
            </div>

        </div>

        <!-- Steps Indicator -->
        <div class="flex justify-center gap-2 mt-16">
            <div class="w-2 h-1 bg-red-500/50 rounded-full"></div>
            <div class="w-12 h-1 bg-red-500 rounded-full"></div>
            <div class="w-2 h-1 bg-white/10 rounded-full"></div>
        </div>
        
         <div class="text-center mt-4">
            <p class="text-xs text-slate-600 font-medium">Krok 2: Wybór poziomu mocy</p>
        </div>

    </div>

    <script>
        lucide.createIcons();

        async function selectPlan(plan) {
            try {
                // UI feedback
                document.body.style.cursor = 'wait';
                const btns = document.querySelectorAll('button');
                btns.forEach(b => {
                    b.disabled = true;
                    b.classList.add('opacity-50', 'cursor-not-allowed');
                });

                const res = await fetch('/api/register_process.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        action: 'stripe',
                        plan: plan 
                    })
                });

                const result = await res.json();

                if (result.success && result.redirect) {
                    window.location.href = result.redirect;
                } else {
                    alert(result.error || 'Błąd integracji z systemem płatności.');
                    document.body.style.cursor = 'default';
                    btns.forEach(b => {
                        b.disabled = false;
                        b.classList.remove('opacity-50', 'cursor-not-allowed');
                    });
                }
            } catch (err) {
                alert('Wystąpił błąd krytyczny.');
                document.body.style.cursor = 'default';
                btns.forEach(b => {
                    b.disabled = false;
                    b.classList.remove('opacity-50', 'cursor-not-allowed');
                });
            }
        }
    </script>
</body>
</html>
