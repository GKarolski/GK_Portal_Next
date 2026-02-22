"use client";

import React from 'react';
import Link from 'next/link';
import {
  Users,
  Zap,
  Lock,
  Check,
  ArrowRight,
  Activity,
  TrendingUp,
  Clock,
  AlertCircle,
  Plus,
  Sparkles,
  Wifi,
  BarChart2,
  UserPlus
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="bg-gk-950 text-white font-sans selection:bg-accent-red selection:text-white">
      {/* NAVIGATION */}
      <nav className="fixed w-full z-50 top-0 border-b border-white/5 bg-gk-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-[#171717] to-black border border-white/10 flex items-center justify-center text-accent-red font-bold shadow-[0_0_15px_rgba(239,68,68,0.2)]">GK</div>
            <span className="font-bold text-xl tracking-tight text-white">GK_<span className="text-accent-red">Digital</span></span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <Link href="#features" className="hover:text-white transition-colors">Funkcje</Link>
            <Link href="#process" className="hover:text-white transition-colors">Jak to działa</Link>
            <Link href="#pricing" className="hover:text-white transition-colors">Cennik</Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-slate-300 hover:text-white px-4 py-2">Logowanie</Link>
            <Link href="#pricing" className="bg-accent-red hover:bg-accent-redHover text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all hover:-translate-y-0.5">Dołącz Teraz</Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-accent-red/10 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-accent-red mb-8">
            <span className="w-2 h-2 rounded-full bg-accent-red animate-pulse"></span>
            SYSTEM V2.0 DOSTĘPNY
          </div>

          <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
            Zarządzaj Agencją jak <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-500">Systemem Operacyjnym</span>
          </h1>

          <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Koniec z chaosem w mailach i Excelu. GK Portal to Twoje centrum dowodzenia: klienci, zgłoszenia, płatności i AI w jednym miejscu.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
            <Link href="#pricing" className="bg-accent-red hover:bg-accent-redHover text-white px-8 py-4 rounded-xl text-lg font-bold w-full sm:w-auto shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all hover:scale-105">Rozpocznij Teraz</Link>
            <Link href="#features" className="px-8 py-4 rounded-xl border border-white/10 hover:bg-white/5 text-lg font-medium transition-all w-full sm:w-auto">Poznaj Funkcje</Link>
          </div>

          {/* MAC WINDOW DASHBOARD MOCKUP */}
          <div className="relative mx-auto max-w-5xl">
            <div className="bg-[#0a0a0ab3] backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl border border-white/10 relative group transform transition-transform duration-700 hover:scale-[1.01]">
              {/* Window Header */}
              <div className="h-10 bg-[#0a0a0a] border-b border-white/5 flex items-center px-4 gap-2">
                <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
                <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
                <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
                <div className="mx-auto text-xs font-mono text-slate-600">dashboard.gk-digital.pl</div>
              </div>
              {/* Window Content */}
              <div className="relative bg-black aspect-[16/9] flex overflow-hidden text-left font-sans select-none cursor-default">

                {/* SIDEBAR MOCKUP */}
                <div className="w-64 bg-[#0a0a0a] border-r border-[#262626] flex flex-col hidden md:flex shrink-0">
                  <div className="h-16 flex items-center px-6 border-b border-[#262626]">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-gradient-to-tr from-[#171717] to-black border border-white/10 flex items-center justify-center text-accent-red font-bold text-[10px] shadow-[0_0_10px_rgba(239,68,68,0.2)]">GK</div>
                      <span className="font-bold text-sm tracking-tight text-white">GK_<span className="text-accent-red text-xs">Digital</span></span>
                    </div>
                  </div>

                  <div className="p-4 space-y-1">
                    <div className="px-3 py-2 rounded-lg bg-accent-red/10 border border-accent-red/20 text-white text-xs font-semibold flex items-center gap-3 border-l-2 border-l-accent-red">
                      Dashboard
                    </div>
                    <div className="px-3 py-2 rounded-lg hover:bg-white/5 text-[#a1a1aa] hover:text-white text-xs font-medium flex items-center gap-3 transition-colors">
                      Klienci
                    </div>
                    <div className="px-3 py-2 rounded-lg hover:bg-white/5 text-[#a1a1aa] hover:text-white text-xs font-medium flex items-center gap-3 transition-colors">
                      Zgłoszenia
                    </div>
                    <div className="px-3 py-2 rounded-lg hover:bg-white/5 text-[#a1a1aa] hover:text-white text-xs font-medium flex items-center gap-3 transition-colors">
                      Kalendarz
                    </div>
                  </div>

                  <div className="mt-auto p-4 border-t border-[#262626] bg-[#0f0f0f]">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">STANDARD</span>
                      <div className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[10px] font-bold border border-emerald-500/20 flex items-center gap-1">
                        <Wifi size={10} /> ONLINE
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-[10px] text-[#71717a] mb-1 font-medium">
                          <span>Środowisko</span>
                          <span>2.4GB / 5GB</span>
                        </div>
                        <div className="h-1.5 w-full bg-[#27272a] rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 w-[48%]"></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[10px] text-[#71717a] mb-1 font-medium">
                          <span>AI Tokens</span>
                          <span>12k / 500k</span>
                        </div>
                        <div className="h-1.5 w-full bg-[#27272a] rounded-full overflow-hidden">
                          <div className="h-full bg-purple-500 w-[3%]"></div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-2 px-3 py-2 rounded border border-[#27272a] bg-[#18181b] hover:bg-[#27272a] transition-colors cursor-pointer group">
                      <UserPlus size={12} className="text-[#a1a1aa] group-hover:text-white" />
                      <span className="text-[10px] font-bold text-[#a1a1aa] group-hover:text-white">Zaproś Klienta</span>
                    </div>
                  </div>
                </div>

                {/* MAIN CONTENT MOCKUP */}
                <div className="flex-1 bg-black flex flex-col relative overflow-hidden">
                  <div className="h-16 border-b border-[#262626] flex items-center justify-between px-6 bg-black/80 backdrop-blur-md z-10">
                    <h2 className="text-sm font-bold text-white tracking-tight">Panel Agencji</h2>

                    <div className="flex items-center gap-4">
                      <div className="text-right hidden sm:block">
                        <div className="text-[11px] font-bold text-white">Jan Kowalski</div>
                        <div className="text-[9px] text-[#71717a] uppercase tracking-wider font-semibold">Administrator</div>
                      </div>
                      <div className="w-8 h-8 rounded bg-accent-red hover:bg-accent-redHover flex items-center justify-center text-white shadow-lg shadow-red-500/20 transition-all transform hover:scale-105 cursor-pointer">
                        <Plus size={16} />
                      </div>
                    </div>
                  </div>

                  <div className="p-6 h-full flex flex-col gap-6">
                    <div className="grid grid-cols-4 gap-4">
                      <div className="bg-[#0a0a0a] border border-[#262626] rounded-xl p-4 hover:border-[#3f3f46] transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[9px] font-bold text-[#71717a] uppercase tracking-widest">Krytyczne</span>
                          <div className="p-1 rounded bg-[#27272a] text-[#71717a]"><AlertCircle size={12} /></div>
                        </div>
                        <div className="text-2xl font-bold text-white mb-1 leading-none">0</div>
                        <div className="text-[9px] text-[#52525b] font-medium italic">Brak zagrożeń</div>
                      </div>
                      <div className="bg-[#0a0a0a] border border-[#262626] rounded-xl p-4 hover:border-[#3f3f46] transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[9px] font-bold text-[#71717a] uppercase tracking-widest">Otwarte</span>
                          <div className="p-1 rounded bg-[#27272a] text-blue-400"><Clock size={12} /></div>
                        </div>
                        <div className="text-2xl font-bold text-white mb-1 leading-none">12</div>
                        <div className="text-[9px] text-[#52525b] font-medium italic overflow-hidden whitespace-nowrap">Wszystkie aktywne</div>
                      </div>
                      <div className="bg-[#0a0a0a] border border-[#262626] rounded-xl p-4 hover:border-[#3f3f46] transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[9px] font-bold text-[#71717a] uppercase tracking-widest">Klienci</span>
                          <div className="p-1 rounded bg-[#27272a] text-purple-400"><Users size={12} /></div>
                        </div>
                        <div className="text-2xl font-bold text-white mb-1 leading-none">24</div>
                        <div className="text-[9px] text-[#52525b] font-medium italic">Aktywne konta</div>
                      </div>
                      <div className="bg-[#0a0a0a] border border-[#262626] rounded-xl p-4 hover:border-[#3f3f46] transition-colors border-emerald-500/20 shadow-[inset_0_0_10px_rgba(16,185,129,0.05)]">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[9px] font-bold text-[#71717a] uppercase tracking-widest">Przychód</span>
                          <div className="p-1 rounded bg-[#27272a] text-emerald-400"><TrendingUp size={12} /></div>
                        </div>
                        <div className="text-2xl font-bold text-emerald-500 mb-1 leading-none tracking-tight">45.2k</div>
                        <div className="text-[9px] text-[#52525b] font-medium uppercase tracking-widest">PLN / MSC</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-6 flex-1 min-h-0">
                      <div className="col-span-2 bg-[#0a0a0a] border border-[#262626] rounded-xl p-5 flex flex-col">
                        <div className="flex items-center gap-2 mb-6">
                          <Activity size={16} className="text-white" />
                          <span className="text-xs font-bold text-white uppercase tracking-widest">Ostatnia Aktywność</span>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 rounded-lg bg-[#18181b] border border-[#27272a] hover:border-accent-red/30 transition-colors group">
                            <div className="flex items-center gap-4">
                              <div className="w-8 h-8 rounded bg-blue-500/10 text-blue-500 font-bold text-[10px] flex items-center justify-center border border-blue-500/20">TC</div>
                              <div>
                                <div className="text-[11px] font-bold text-white group-hover:text-accent-red transition-colors capitalize tracking-tight">TechCorp sp. z o.o.</div>
                                <div className="text-[9px] text-[#71717a] font-medium italic">Dodano zgłoszenie: "Awaria Checkoutu"</div>
                              </div>
                            </div>
                            <div className="text-[9px] font-mono text-[#52525b]">12 min temu</div>
                          </div>
                          <div className="flex items-center justify-between p-3 rounded-lg bg-[#18181b] border border-[#27272a] hover:border-accent-red/30 transition-colors group">
                            <div className="flex items-center gap-4">
                              <div className="w-8 h-8 rounded bg-purple-500/10 text-purple-500 font-bold text-[10px] flex items-center justify-center border border-purple-500/20">L2</div>
                              <div>
                                <div className="text-[11px] font-bold text-white group-hover:text-accent-red transition-colors capitalize tracking-tight">Logistyka24 Hub</div>
                                <div className="text-[9px] text-[#71717a] font-medium italic">Opłacono fakturę FV/2024/05/22</div>
                              </div>
                            </div>
                            <div className="text-[9px] font-mono text-[#52525b]">2h temu</div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-[#0a0a0a] border border-[#262626] rounded-xl p-5 flex flex-col relative overflow-hidden">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <BarChart2 size={16} className="text-emerald-500" />
                            <span className="text-xs font-bold text-white uppercase tracking-widest">Rozwój</span>
                          </div>
                        </div>
                        <div className="mb-4">
                          <div className="text-3xl font-bold text-emerald-500 tracking-tighter">+45.2%</div>
                          <div className="text-[9px] text-[#52525b] uppercase font-bold tracking-widest">Wzrost m/m</div>
                        </div>
                        <div className="flex items-end justify-between gap-1 flex-1 mt-auto h-24">
                          {[40, 55, 35, 70, 60, 90].map((h, i) => (
                            <div
                              key={i}
                              className={`w-full rounded-t-sm transition-all duration-500 hover:brightness-125 ${i === 5 ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-[#18181b]'}`}
                              style={{ height: `${h}%` }}
                            ></div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="absolute bottom-6 right-6 w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white shadow-xl shadow-purple-600/30 cursor-pointer transition-transform hover:scale-110 z-10">
                    <Sparkles size={18} />
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section id="features" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 tracking-tight">Wszystko, czego potrzebuje nowoczesna agencja</h2>
            <p className="text-slate-400 font-medium">Zintegrowane narzędzia, które oszczędzają Twój czas i fokus.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-[#0a0a0ab3] backdrop-blur-md p-8 rounded-2xl border border-white/5 hover:border-accent-red/30 transition-all hover:scale-[1.02] group">
              <div className="w-12 h-12 rounded-lg bg-[#171717] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Users size={24} className="text-accent-red" />
              </div>
              <h3 className="text-xl font-bold mb-3 tracking-tight">Portal Klienta</h3>
              <p className="text-slate-400 text-sm leading-relaxed font-medium">Dedykowany panel dla Twoich klientów. Mogą sami dodawać zgłoszenia, śledzić postęp prac i opłacać faktury w czasie rzeczywistym.</p>
            </div>

            <div className="bg-[#0a0a0ab3] backdrop-blur-md p-8 rounded-2xl border border-white/5 hover:border-accent-red/30 transition-all hover:scale-[1.02] group">
              <div className="w-12 h-12 rounded-lg bg-[#171717] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Zap size={24} className="text-accent-red" />
              </div>
              <h3 className="text-xl font-bold mb-3 tracking-tight">Smart Automation</h3>
              <p className="text-slate-400 text-sm leading-relaxed font-medium">Automatyczne przydzielanie zadań, inteligentne powiadomienia i segregacja zgłoszeń. Pozwól systemowi pracować za Ciebie.</p>
            </div>

            <div className="bg-[#0a0a0ab3] backdrop-blur-md p-8 rounded-2xl border border-white/5 hover:border-accent-red/30 transition-all hover:scale-[1.02] group">
              <div className="w-12 h-12 rounded-lg bg-[#171717] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Lock size={24} className="text-accent-red" />
              </div>
              <h3 className="text-xl font-bold mb-3 tracking-tight">Totalne Bezpieczeństwo</h3>
              <p className="text-slate-400 text-sm leading-relaxed font-medium">Separacja danych na poziomie bazy danych. Szyfrowane połączenia, RLS i backupy zabezpieczające interesy Twoje i Twoich klientów.</p>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-24 bg-[#0a0a0a] border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 tracking-tight">Proste, Przejrzyste Pakiety</h2>
            <p className="text-slate-400 font-medium whitespace-nowrap">Brak ukrytych opłat. Skaluj system wraz ze swoim sukcesem.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* STARTER */}
            <div className="bg-[#0a0a0ab3] backdrop-blur-md p-8 rounded-3xl border border-white/5 flex flex-col relative transition-all hover:border-white/20">
              <h3 className="text-lg font-medium text-slate-400 mb-2">Starter</h3>
              <div className="text-4xl font-extrabold mb-6 tracking-tight">89 zł <span className="text-sm font-normal text-slate-500 uppercase tracking-widest">/msc</span></div>
              <p className="text-sm text-slate-400 mb-8 font-medium italic">Idealny dla freelancerów i małych butików.</p>

              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3 text-sm text-slate-300 font-medium"><Check size={16} className="text-accent-red" /> 1 Użytkownik Admin</li>
                <li className="flex items-center gap-3 text-sm text-slate-300 font-medium"><Check size={16} className="text-accent-red" /> do 10 Klientów</li>
                <li className="flex items-center gap-3 text-sm text-slate-300 font-medium"><Check size={16} className="text-accent-red" /> 1 GB Przestrzeni</li>
              </ul>

              <Link href="/register?plan=STARTER" className="w-full py-3 rounded-xl border border-white/10 hover:bg-white/5 text-center transition-all font-bold tracking-tight">Wybierz Starter</Link>
            </div>

            {/* STANDARD */}
            <div className="bg-[#ef444405] backdrop-blur-md p-8 rounded-3xl border border-accent-red/50 flex flex-col relative transform md:-translate-y-4 shadow-[0_20px_40px_rgba(0,0,0,0.4)] transition-all hover:scale-[1.02]">
              <div className="absolute top-0 right-0 bg-accent-red text-white text-[10px] font-bold px-4 py-1.5 rounded-bl-xl uppercase tracking-widest">POLECANY</div>
              <h3 className="text-lg font-medium text-accent-red mb-2">Standard</h3>
              <div className="text-4xl font-extrabold mb-6 tracking-tight">149 zł <span className="text-sm font-normal text-slate-500 uppercase tracking-widest">/msc</span></div>
              <p className="text-sm text-slate-400 mb-8 font-medium italic">Najlepszy wybór dla rozwijających się agencji.</p>

              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3 text-sm text-white font-semibold"><Check size={16} className="text-accent-red" /> 3 Użytkowników Admin</li>
                <li className="flex items-center gap-3 text-sm text-white font-semibold"><Check size={16} className="text-accent-red" /> do 50 Klientów</li>
                <li className="flex items-center gap-3 text-sm text-white font-semibold"><Check size={16} className="text-accent-red" /> 5 GB Przestrzeni</li>
                <li className="flex items-center gap-3 text-sm text-white font-semibold"><Check size={16} className="text-accent-red" /> Personalizacja White-Label</li>
              </ul>

              <Link href="/register?plan=STANDARD" className="w-full py-3 rounded-xl bg-accent-red hover:bg-accent-redHover text-white text-center transition-all font-extrabold tracking-tight shadow-[0_0_20px_rgba(239,68,68,0.3)]">Wybierz Standard</Link>
            </div>

            {/* AGENCY */}
            <div className="bg-[#0a0a0ab3] backdrop-blur-md p-8 rounded-3xl border border-white/5 flex flex-col relative transition-all hover:border-white/20">
              <h3 className="text-lg font-medium text-slate-400 mb-2">Agency</h3>
              <div className="text-4xl font-extrabold mb-6 tracking-tight">259 zł <span className="text-sm font-normal text-slate-500 uppercase tracking-widest">/msc</span></div>
              <p className="text-sm text-slate-400 mb-8 font-medium italic">Pełna moc dla struktur korporacyjnych.</p>

              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3 text-sm text-slate-300 font-medium"><Check size={16} className="text-accent-red" /> Nielimitowani Admini</li>
                <li className="flex items-center gap-3 text-sm text-slate-300 font-medium"><Check size={16} className="text-accent-red" /> Nielimitowani Klienci</li>
                <li className="flex items-center gap-3 text-sm text-slate-300 font-medium"><Check size={16} className="text-accent-red" /> 100 GB Przestrzeni</li>
                <li className="flex items-center gap-3 text-sm text-slate-300 font-medium"><Check size={16} className="text-accent-red" /> Priorytetowy Support 24/7</li>
              </ul>

              <Link href="/register?plan=AGENCY" className="w-full py-3 rounded-xl border border-white/10 hover:bg-white/5 text-center transition-all font-bold tracking-tight">Wybierz Agency</Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA FOOTER */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-accent-red/5 blur-[100px] pointer-events-none"></div>

        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl font-bold mb-6 tracking-tight">Gotowy na transformację procesów?</h2>
          <p className="text-slate-400 mb-10 text-lg font-medium italic whitespace-nowrap">Dołącz do liderów automatyzacji i skup się na tym, co naprawdę generuje zysk.</p>
          <Link href="/register?plan=STARTER" className="inline-flex items-center gap-4 text-white bg-[#171717] hover:bg-[#262626] border border-white/10 px-8 py-4 rounded-xl font-bold transition-all shadow-xl">
            Zacznij od Startera <ArrowRight size={18} className="text-accent-red" />
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5 py-12 bg-black text-sm">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-slate-500 font-medium">
            &copy; {new Date().getFullYear()} GK Digital Platform. Wszystkie prawa zastrzeżone.
          </div>
          <div className="flex gap-8">
            <Link href="#" className="text-slate-500 hover:text-white transition-colors">Regulamin</Link>
            <Link href="#" className="text-slate-500 hover:text-white transition-colors">Prywatność</Link>
            <Link href="#" className="text-slate-500 hover:text-white transition-colors">Kontakt</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
