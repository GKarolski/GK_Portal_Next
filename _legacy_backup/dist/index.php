<!DOCTYPE html>
<html lang="pl" class="dark scroll-smooth">

<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>GK_Digital | System Operacyjny Twojej Agencji</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <script src="https://unpkg.com/lucide@latest"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          fontFamily: { sans: ['Inter', 'sans-serif'] },
          colors: {
            gk: {
              950: '#050505', 900: '#0a0a0a', 800: '#171717', 700: '#262626',
              glass: 'rgba(255, 255, 255, 0.03)',
            },
            accent: {
              red: '#ef4444', redHover: '#dc2626',
            }
          },
          backgroundImage: {
            'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
            'hero-glow': 'conic-gradient(from 180deg at 50% 50%, #171717 0deg, #050505 180deg, #171717 360deg)',
          }
        }
      }
    }
  </script>
  <style>
    body { background-color: #050505; color: #f5f5f5; }
    .glass-panel {
      background: rgba(10, 10, 10, 0.6);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.05);
    }
    .text-glow { text-shadow: 0 0 20px rgba(255, 255, 255, 0.1); }
    .btn-primary {
      background-color: #ef4444; color: white;
      box-shadow: 0 0 20px rgba(239, 68, 68, 0.3);
      transition: all 0.3s ease;
    }
    .btn-primary:hover {
      background-color: #dc2626; box-shadow: 0 0 30px rgba(239, 68, 68, 0.5); transform: translateY(-1px);
    }
    /* Mac Window Controls */
    .mac-dot { width: 12px; height: 12px; border-radius: 50%; }
    .mac-red { background: #ff5f56; }
    .mac-yellow { background: #ffbd2e; }
    .mac-green { background: #27c93f; }
  </style>
</head>

<body class="antialiased overflow-x-hidden">

  <!-- NAVIGATION -->
  <nav class="fixed w-full z-50 top-0 border-b border-white/5 bg-gk-950/80 backdrop-blur-md">
    <div class="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-lg bg-gradient-to-tr from-gk-800 to-black border border-white/10 flex items-center justify-center text-accent-red font-bold shadow-[0_0_15px_rgba(239,68,68,0.2)]">GK</div>
        <span class="font-bold text-xl tracking-tight text-white">GK_<span class="text-accent-red">Digital</span></span>
      </div>
      <div class="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
        <a href="#features" class="hover:text-white transition-colors">Funkcje</a>
        <a href="#process" class="hover:text-white transition-colors">Jak to działa</a>
        <a href="#pricing" class="hover:text-white transition-colors">Cennik</a>
      </div>
      <div class="flex items-center gap-4">
        <a href="/login.php" class="text-sm font-medium text-slate-300 hover:text-white px-4 py-2">Logowanie</a>
        <a href="#pricing" class="btn-primary px-5 py-2.5 rounded-xl text-sm font-semibold">Dołącz Teraz</a>
      </div>
    </div>
  </nav>

  <!-- HERO SECTION -->
  <section class="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
    <!-- Background Glow -->
    <div class="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-accent-red/10 blur-[120px] rounded-full pointer-events-none"></div>

    <div class="max-w-7xl mx-auto px-6 relative z-10 text-center">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-accent-red mb-8">
        <span class="w-2 h-2 rounded-full bg-accent-red animate-pulse"></span>
        SYSTEM V2.0 DOSTĘPNY
      </div>
      
      <h1 class="text-5xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
        Zarządzaj Agencją jak <br>
        <span class="text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-500">Systemem Operacyjnym</span>
      </h1>
      
      <p class="text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
        Koniec z chaosem w mailach i Excelu. GK Portal to Twoje centrum dowodzenia: klienci, zgłoszenia, płatności i AI w jednym miejscu.
      </p>

      <div class="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
        <a href="#pricing" class="btn-primary px-8 py-4 rounded-xl text-lg font-bold w-full sm:w-auto">Rozpocznij Teraz</a>
        <a href="#features" class="px-8 py-4 rounded-xl border border-white/10 hover:bg-white/5 text-lg font-medium transition-all w-full sm:w-auto">Poznaj Funkcje</a>
      </div>

      <!-- MAC WINDOW DASHBOARD MOCKUP -->
      <div class="relative mx-auto max-w-5xl">
        <div class="glass-panel rounded-2xl overflow-hidden shadow-2xl border border-white/10 relative group transform transition-transform duration-700 hover:scale-[1.01]">
          <!-- Window Header -->
          <div class="h-10 bg-gk-900 border-b border-white/5 flex items-center px-4 gap-2">
            <div class="mac-dot mac-red"></div>
            <div class="mac-dot mac-yellow"></div>
            <div class="mac-dot mac-green"></div>
            <div class="mx-auto text-xs font-mono text-slate-600">dashboard.gk-digital.pl</div>
          </div>
          <!-- Window Content (Live Code Mockup - 1:1 Replica) -->
          <div class="relative bg-[#050505] aspect-[16/9] flex overflow-hidden text-left font-sans select-none cursor-default">
            
            <!-- SIDEBAR -->
            <div class="w-64 bg-[#0a0a0a] border-r border-[#262626] flex flex-col hidden md:flex shrink-0">
                <!-- Sidebar Header -->
                <div class="h-16 flex items-center px-6 border-b border-[#262626]">
                    <div class="flex items-center gap-2">
                        <div class="w-6 h-6 rounded bg-gradient-to-tr from-gk-800 to-black border border-white/10 flex items-center justify-center text-accent-red font-bold text-[10px] shadow-[0_0_10px_rgba(239,68,68,0.2)]">GK</div>
                        <span class="font-bold text-sm tracking-tight text-white">GK_<span class="text-accent-red">Digital</span></span>
                    </div>
                </div>

                <!-- Menu -->
                <div class="p-4 space-y-1">
                    <div class="px-3 py-2 rounded-lg bg-accent-red/10 border border-accent-red/20 text-white text-xs font-semibold flex items-center gap-3 border-l-2 border-l-accent-red">
                        Dashboard
                    </div>
                    <div class="px-3 py-2 rounded-lg hover:bg-white/5 text-[#a1a1aa] hover:text-white text-xs font-medium flex items-center gap-3 transition-colors">
                        Klienci
                    </div>
                    <div class="px-3 py-2 rounded-lg hover:bg-white/5 text-[#a1a1aa] hover:text-white text-xs font-medium flex items-center gap-3 transition-colors">
                        Zgłoszenia
                    </div>
                    <div class="px-3 py-2 rounded-lg hover:bg-white/5 text-[#a1a1aa] hover:text-white text-xs font-medium flex items-center gap-3 transition-colors">
                        Kalendarz
                    </div>
                </div>

                <!-- Bottom Stats (Usage) -->
                <div class="mt-auto p-4 border-t border-[#262626] bg-[#0f0f0f]">
                    <div class="flex items-center justify-between mb-3">
                        <span class="text-[10px] font-bold text-amber-500">STANDARD</span>
                        <div class="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[10px] font-bold border border-emerald-500/20 flex items-center gap-1">
                            <i data-lucide="wifi" class="w-2 h-2"></i> ONLINE
                        </div>
                    </div>
                    
                    <div class="space-y-3">
                        <!-- Storage -->
                        <div>
                            <div class="flex justify-between text-[10px] text-[#71717a] mb-1">
                                <span>Środowisko</span>
                                <span>2.4GB / 5GB</span>
                            </div>
                            <div class="h-1 w-full bg-[#27272a] rounded-full overflow-hidden">
                                <div class="h-full bg-blue-500 w-[48%]"></div>
                            </div>
                        </div>
                        <!-- Tokens -->
                        <div>
                            <div class="flex justify-between text-[10px] text-[#71717a] mb-1">
                                <span>AI Tokens</span>
                                <span>12k / 500k</span>
                            </div>
                            <div class="h-1 w-full bg-[#27272a] rounded-full overflow-hidden">
                                <div class="h-full bg-purple-500 w-[3%]"></div>
                            </div>
                        </div>
                    </div>

                    <div class="mt-4 flex items-center gap-2 px-3 py-2 rounded border border-[#27272a] bg-[#18181b] hover:bg-[#27272a] transition-colors cursor-pointer group">
                        <i data-lucide="user-plus" class="w-3 h-3 text-[#a1a1aa] group-hover:text-white"></i>
                        <span class="text-[10px] font-bold text-[#a1a1aa] group-hover:text-white">Zaproś Klienta</span>
                    </div>
                </div>
            </div>

            <!-- MAIN CONTENT -->
            <div class="flex-1 bg-[#050505] flex flex-col relative overflow-hidden">
                <!-- Top Header -->
                <div class="h-16 border-b border-[#262626] flex items-center justify-between px-6 bg-[#050505]/80 backdrop-blur-md z-1">
                    <h2 class="text-sm font-bold text-white">Panel Agencji</h2>
                    
                    <div class="flex items-center gap-4">
                        <div class="text-right hidden sm:block">
                            <div class="text-[11px] font-bold text-white">Jan Kowalski</div>
                            <div class="text-[9px] text-[#71717a] uppercase tracking-wider font-semibold">Administrator</div>
                        </div>
                        <div class="w-8 h-8 rounded bg-accent-red hover:bg-accent-redHover flex items-center justify-center text-white shadow-lg shadow-red-500/20 transition-all transform hover:scale-105 cursor-pointer">
                            <i data-lucide="plus" class="w-4 h-4"></i>
                        </div>
                    </div>
                </div>

                <!-- Dashboard Content -->
                <div class="p-6 overflow-y-hidden h-full flex flex-col gap-6">
                    
                    <!-- KPI Row -->
                    <div class="grid grid-cols-4 gap-4">
                        <!-- Card 1 -->
                        <div class="bg-[#0a0a0a] border border-[#262626] rounded-xl p-4 relative group hover:border-[#3f3f46] transition-colors">
                            <div class="flex justify-between items-start mb-2">
                                <span class="text-[10px] font-bold text-[#71717a] uppercase tracking-wider">Krytyczne</span>
                                <div class="p-1 rounded bg-[#27272a] text-[#71717a]"><i data-lucide="alert-circle" class="w-3 h-3"></i></div>
                            </div>
                            <div class="text-2xl font-bold text-white mb-1">0</div>
                            <div class="text-[10px] text-[#52525b]">Wymagają natychmiastowej uwagi</div>
                        </div>

                        <!-- Card 2 -->
                        <div class="bg-[#0a0a0a] border border-[#262626] rounded-xl p-4 relative group hover:border-[#3f3f46] transition-colors">
                            <div class="flex justify-between items-start mb-2">
                                <span class="text-[10px] font-bold text-[#71717a] uppercase tracking-wider">Otwarte</span>
                                <div class="p-1 rounded bg-[#27272a] text-blue-400"><i data-lucide="clock" class="w-3 h-3"></i></div>
                            </div>
                            <div class="text-2xl font-bold text-white mb-1">12</div>
                            <div class="text-[10px] text-[#52525b]">Wszystkie aktywne zadania</div>
                        </div>

                        <!-- Card 3 -->
                        <div class="bg-[#0a0a0a] border border-[#262626] rounded-xl p-4 relative group hover:border-[#3f3f46] transition-colors">
                            <div class="flex justify-between items-start mb-2">
                                <span class="text-[10px] font-bold text-[#71717a] uppercase tracking-wider">Klienci</span>
                                <div class="p-1 rounded bg-[#27272a] text-purple-400"><i data-lucide="users" class="w-3 h-3"></i></div>
                            </div>
                            <div class="text-2xl font-bold text-white mb-1">24</div>
                            <div class="text-[10px] text-[#52525b]">Firmy z otwartymi zgłoszeniami</div>
                        </div>

                        <!-- Card 4 -->
                        <div class="bg-[#0a0a0a] border border-[#262626] rounded-xl p-4 relative group hover:border-[#3f3f46] transition-colors">
                            <div class="flex justify-between items-start mb-2">
                                <span class="text-[10px] font-bold text-[#71717a] uppercase tracking-wider">Przychód (Msc)</span>
                                <div class="p-1 rounded bg-[#27272a] text-emerald-400"><i data-lucide="trending-up" class="w-3 h-3"></i></div>
                            </div>
                            <div class="text-2xl font-bold text-emerald-500 mb-1">45 200 PLN</div>
                            <div class="text-[10px] text-[#52525b]">Na podstawie zamkniętych zadań</div>
                        </div>
                    </div>

                    <!-- Middle Row: Activity & Revenue -->
                    <div class="grid grid-cols-3 gap-6 flex-1 min-h-0">
                        
                        <!-- Left: Recent Activity (Taking 2/3) -->
                        <div class="col-span-2 bg-[#0a0a0a] border border-[#262626] rounded-xl p-5 flex flex-col">
                            <div class="flex items-center gap-2 mb-6">
                                <i data-lucide="activity" class="w-4 h-4 text-white"></i>
                                <span class="text-sm font-bold text-white">Ostatnia Aktywność</span>
                            </div>
                            
                            <!-- Activity List -->
                            <div class="space-y-3">
                                <!-- Item 1 -->
                                <div class="flex items-center justify-between p-3 rounded-lg bg-[#18181b] border border-[#27272a] hover:border-accent-red/30 transition-colors group">
                                    <div class="flex items-center gap-4">
                                        <div class="w-8 h-8 rounded bg-blue-500/10 text-blue-500 font-bold text-xs flex items-center justify-center">TC</div>
                                        <div>
                                            <div class="text-xs font-bold text-white group-hover:text-accent-red transition-colors">TechCorp sp. z o.o.</div>
                                            <div class="text-[10px] text-[#71717a]">Dodano nowe zgłoszenie: "Awaria Checkoutu"</div>
                                        </div>
                                    </div>
                                    <div class="text-[10px] font-mono text-[#52525b]">12 min temu</div>
                                </div>
                                <!-- Item 2 -->
                                <div class="flex items-center justify-between p-3 rounded-lg bg-[#18181b] border border-[#27272a] hover:border-accent-red/30 transition-colors group">
                                    <div class="flex items-center gap-4">
                                        <div class="w-8 h-8 rounded bg-purple-500/10 text-purple-500 font-bold text-xs flex items-center justify-center">L2</div>
                                        <div>
                                            <div class="text-xs font-bold text-white group-hover:text-accent-red transition-colors">Logistyka24</div>
                                            <div class="text-[10px] text-[#71717a]">Opłacono fakturę FV/2024/05/22</div>
                                        </div>
                                    </div>
                                    <div class="text-[10px] font-mono text-[#52525b]">2h temu</div>
                                </div>
                                <!-- Item 3 -->
                                <div class="flex items-center justify-between p-3 rounded-lg bg-[#18181b] border border-[#27272a] hover:border-accent-red/30 transition-colors group">
                                    <div class="flex items-center gap-4">
                                        <div class="w-8 h-8 rounded bg-emerald-500/10 text-emerald-500 font-bold text-xs flex items-center justify-center">S</div>
                                        <div>
                                            <div class="text-xs font-bold text-white group-hover:text-accent-red transition-colors">Studio 44</div>
                                            <div class="text-[10px] text-[#71717a]">Zaakceptowano wycenę "Redesign Logo"</div>
                                        </div>
                                    </div>
                                    <div class="text-[10px] font-mono text-[#52525b]">5h temu</div>
                                </div>
                            </div>
                        </div>

                        <!-- Right: Revenue Chart -->
                        <div class="bg-[#0a0a0a] border border-[#262626] rounded-xl p-5 flex flex-col relative overflow-hidden text-right">
                             <div class="flex items-center justify-between mb-4">
                                <div class="flex items-center gap-2">
                                     <i data-lucide="bar-chart-2" class="w-4 h-4 text-emerald-500"></i>
                                    <span class="text-sm font-bold text-white">Przychody</span>
                                </div>
                                <div class="flex gap-1">
                                    <span class="text-[9px] px-1.5 py-0.5 rounded bg-[#27272a] text-[#71717a]">3M</span>
                                    <span class="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500 text-black font-bold">6M</span>
                                    <span class="text-[9px] px-1.5 py-0.5 rounded bg-[#27272a] text-[#71717a]">1R</span>
                                </div>
                            </div>

                            <div class="mb-4">
                                <div class="text-3xl font-bold text-emerald-500">45 200 PLN</div>
                                <div class="text-[10px] text-[#52525b]">Suma z wybranego okresu</div>
                            </div>

                            <!-- CSS Chart -->
                            <div class="flex items-end justify-between gap-1 flex-1 mt-auto h-24">
                                <div class="w-full bg-[#18181b] rounded-t-sm hover:bg-emerald-500/20 transition-colors relative group" style="height: 40%">
                                    <div class="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] text-white opacity-0 group-hover:opacity-100 transition-opacity">12k</div>
                                    <div class="mt-full pt-1 text-center text-[8px] text-[#52525b] absolute -bottom-4 w-full">STY</div>
                                </div>
                                <div class="w-full bg-[#18181b] rounded-t-sm hover:bg-emerald-500/20 transition-colors relative group" style="height: 55%">
                                     <div class="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] text-white opacity-0 group-hover:opacity-100 transition-opacity">18k</div>
                                    <div class="mt-full pt-1 text-center text-[8px] text-[#52525b] absolute -bottom-4 w-full">LUT</div>
                                </div>
                                <div class="w-full bg-[#18181b] rounded-t-sm hover:bg-emerald-500/20 transition-colors relative group" style="height: 35%">
                                     <div class="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] text-white opacity-0 group-hover:opacity-100 transition-opacity">10k</div>
                                    <div class="mt-full pt-1 text-center text-[8px] text-[#52525b] absolute -bottom-4 w-full">MAR</div>
                                </div>
                                <div class="w-full bg-[#18181b] rounded-t-sm hover:bg-emerald-500/20 transition-colors relative group" style="height: 70%">
                                     <div class="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] text-white opacity-0 group-hover:opacity-100 transition-opacity">28k</div>
                                    <div class="mt-full pt-1 text-center text-[8px] text-[#52525b] absolute -bottom-4 w-full">KWI</div>
                                </div>
                                <div class="w-full bg-[#18181b] rounded-t-sm hover:bg-emerald-500/20 transition-colors relative group" style="height: 60%">
                                     <div class="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] text-white opacity-0 group-hover:opacity-100 transition-opacity">22k</div>
                                    <div class="mt-full pt-1 text-center text-[8px] text-[#52525b] absolute -bottom-4 w-full">MAJ</div>
                                </div>
                                <div class="w-full bg-emerald-900/40 border-t-2 border-emerald-500 rounded-t-sm hover:bg-emerald-500/40 transition-colors relative group" style="height: 90%">
                                     <div class="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] text-white opacity-0 group-hover:opacity-100 transition-opacity font-bold">45k</div>
                                    <div class="mt-full pt-1 text-center text-[8px] text-emerald-500 font-bold absolute -bottom-4 w-full">CZE</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Floating AI Button (Bottom Right) -->
                <div class="absolute bottom-6 right-6 w-10 h-10 rounded-full bg-purple-600 hover:bg-purple-500 flex items-center justify-center text-white shadow-xl shadow-purple-600/30 cursor-pointer transition-transform hover:scale-110 z-10">
                    <i data-lucide="sparkles" class="w-5 h-5"></i>
                </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- FEATURES GRID -->
  <section id="features" class="py-24 relative">
    <div class="max-w-7xl mx-auto px-6">
      <div class="text-center mb-16">
        <h2 class="text-3xl font-bold mb-4">Wszystko, czego potrzebuje nowoczesna agencja</h2>
        <p class="text-slate-400">Zintegrowane narzędzia, które oszczędzają Twój czas.</p>
      </div>

      <div class="grid md:grid-cols-3 gap-6">
        <!-- Feature 1 -->
        <div class="glass-panel p-8 rounded-2xl hover:border-accent-red/30 transition-colors group">
          <div class="w-12 h-12 rounded-lg bg-gk-800 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <i data-lucide="users" class="text-accent-red"></i>
          </div>
          <h3 class="text-xl font-bold mb-3">Portal Klienta</h3>
          <p class="text-slate-400 text-sm leading-relaxed">Dedykowany panel dla Twoich klientów. Mogą sami dodawać zgłoszenia, śledzić postęp prac i opłacać faktury.</p>
        </div>

        <!-- Feature 2 -->
        <div class="glass-panel p-8 rounded-2xl hover:border-accent-red/30 transition-colors group">
          <div class="w-12 h-12 rounded-lg bg-gk-800 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <i data-lucide="zap" class="text-accent-red"></i>
          </div>
          <h3 class="text-xl font-bold mb-3">Smart Automation</h3>
          <p class="text-slate-400 text-sm leading-relaxed">Automatyczne przydzielanie zadań, powiadomienia e-mail i segregacja zgłoszeń do odpowiednich folderów.</p>
        </div>

        <!-- Feature 3 -->
        <div class="glass-panel p-8 rounded-2xl hover:border-accent-red/30 transition-colors group">
          <div class="w-12 h-12 rounded-lg bg-gk-800 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <i data-lucide="lock" class="text-accent-red"></i>
          </div>
          <h3 class="text-xl font-bold mb-3">Totalne Bezpieczeństwo</h3>
          <p class="text-slate-400 text-sm leading-relaxed">Każdy Tenant ma osobną bazę danych. Separacja plików, szyfrowane połączenia i backupy co 24h.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- PRICING -->
  <section id="pricing" class="py-24 bg-gk-900 border-t border-white/5">
    <div class="max-w-7xl mx-auto px-6">
      <div class="text-center mb-16">
        <h2 class="text-3xl font-bold mb-4">Proste, Przejrzyste Pakiety</h2>
        <p class="text-slate-400">Brak ukrytych opłat. Anulujesz kiedy chcesz.</p>
      </div>

      <div class="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        
        <!-- PLAN 1: STARTER -->
        <div class="glass-panel p-8 rounded-3xl border border-white/5 flex flex-col relative overflow-hidden">
          <h3 class="text-lg font-medium text-slate-400 mb-2">Starter</h3>
          <div class="text-4xl font-bold mb-6">89 zł <span class="text-sm font-normal text-slate-500">/msc</span></div>
          <p class="text-sm text-slate-400 mb-8">Idealny dla freelancerów i początkujących.</p>
          
          <ul class="space-y-4 mb-8 flex-1">
            <li class="flex items-center gap-3 text-sm text-slate-300"><i data-lucide="check" class="w-4 h-4 text-accent-red"></i> 1 Użytkownik Admin</li>
            <li class="flex items-center gap-3 text-sm text-slate-300"><i data-lucide="check" class="w-4 h-4 text-accent-red"></i> do 10 Klientów</li>
            <li class="flex items-center gap-3 text-sm text-slate-300"><i data-lucide="check" class="w-4 h-4 text-accent-red"></i> 1 GB Przestrzeni</li>
          </ul>

          <a href="/register.php?plan=STARTER" class="w-full py-3 rounded-xl border border-white/20 hover:bg-white/5 text-center transition-colors font-semibold">Wybierz Starter</a>
        </div>

        <!-- PLAN 2: STANDARD (Highlighted) -->
        <div class="glass-panel p-8 rounded-3xl border border-accent-red/50 bg-accent-red/5 flex flex-col relative transform md:-translate-y-4 shadow-2xl">
            <div class="absolute top-0 right-0 bg-accent-red text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg">POLECANY</div>
          <h3 class="text-lg font-medium text-accent-red mb-2">Standard</h3>
          <div class="text-4xl font-bold mb-6">149 zł <span class="text-sm font-normal text-slate-500">/msc</span></div>
          <p class="text-sm text-slate-400 mb-8">Dla rozwijających się agencji.</p>
          
          <ul class="space-y-4 mb-8 flex-1">
            <li class="flex items-center gap-3 text-sm text-white"><i data-lucide="check" class="w-4 h-4 text-accent-red"></i> 3 Użytkowników Admin</li>
            <li class="flex items-center gap-3 text-sm text-white"><i data-lucide="check" class="w-4 h-4 text-accent-red"></i> do 50 Klientów</li>
            <li class="flex items-center gap-3 text-sm text-white"><i data-lucide="check" class="w-4 h-4 text-accent-red"></i> 5 GB Przestrzeni</li>
            <li class="flex items-center gap-3 text-sm text-white"><i data-lucide="check" class="w-4 h-4 text-accent-red"></i> Własne Logo (White Label)</li>
          </ul>

          <a href="/register.php?plan=STANDARD" class="w-full py-3 rounded-xl btn-primary text-center transition-colors font-semibold shadow-lg">Wybierz Standard</a>
        </div>

        <!-- PLAN 3: AGENCY -->
        <div class="glass-panel p-8 rounded-3xl border border-white/5 flex flex-col relative">
          <h3 class="text-lg font-medium text-slate-400 mb-2">Agency</h3>
          <div class="text-4xl font-bold mb-6">259 zł <span class="text-sm font-normal text-slate-500">/msc</span></div>
          <p class="text-sm text-slate-400 mb-8">Pełna moc bez kompromisów.</p>
          
          <ul class="space-y-4 mb-8 flex-1">
            <li class="flex items-center gap-3 text-sm text-slate-300"><i data-lucide="check" class="w-4 h-4 text-accent-red"></i> Nielimitowani Admini</li>
            <li class="flex items-center gap-3 text-sm text-slate-300"><i data-lucide="check" class="w-4 h-4 text-accent-red"></i> Nielimitowani Klienci</li>
            <li class="flex items-center gap-3 text-sm text-slate-300"><i data-lucide="check" class="w-4 h-4 text-accent-red"></i> 100 GB Przestrzeni</li>
            <li class="flex items-center gap-3 text-sm text-slate-300"><i data-lucide="check" class="w-4 h-4 text-accent-red"></i> Priorytetowy Support 24/7</li>
            <li class="flex items-center gap-3 text-sm text-slate-300"><i data-lucide="check" class="w-4 h-4 text-accent-red"></i> Dedykowany Adres IP</li>
          </ul>

          <a href="/register.php?plan=AGENCY" class="w-full py-3 rounded-xl border border-white/20 hover:bg-white/5 text-center transition-colors font-semibold">Wybierz Agency</a>
        </div>

      </div>
    </div>
  </section>

  <!-- CTA FOOTER -->
  <section class="py-20 relative overflow-hidden">
    <!-- Glow -->
    <div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-accent-red/5 blur-[100px] pointer-events-none"></div>

    <div class="max-w-4xl mx-auto px-6 text-center relative z-10">
      <h2 class="text-4xl font-bold mb-6">Gotowy na transformację?</h2>
      <p class="text-slate-400 mb-10 text-lg">Dołącz do pionierów nowoczesnego zarządzania agencją.</p>
      <a href="/register.php?plan=STARTER" class="inline-flex items-center gap-2 text-white bg-gk-800 hover:bg-gk-700 border border-white/10 px-8 py-4 rounded-xl font-semibold transition-all">
        Zacznij od Startera (89 zł) <i data-lucide="arrow-right" class="w-4 h-4 text-accent-red"></i>
      </a>
    </div>
  </section>

  <!-- MINIMALIST FOOTER -->
  <footer class="border-t border-white/5 py-12 bg-gk-950 text-sm">
    <div class="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
      <div class="text-slate-500">
        &copy; <?php echo date('Y'); ?> GK Digital. Wszelkie prawa zastrzeżone.
      </div>
      <div class="flex gap-6">
        <a href="#" class="text-slate-500 hover:text-white transition-colors">Regulamin</a>
        <a href="#" class="text-slate-500 hover:text-white transition-colors">Polityka Prywatności</a>
        <a href="#" class="text-slate-500 hover:text-white transition-colors">Kontakt</a>
      </div>
    </div>
  </footer>

  <script>
    lucide.createIcons();
  </script>
</body>
</html>
