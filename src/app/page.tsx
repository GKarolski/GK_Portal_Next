"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Zap,
  Lock,
  Check,
  ArrowRight,
  ArrowDown,
  Activity,
  TrendingUp,
  Clock,
  AlertCircle,
  Plus,
  Sparkles,
  Wifi,
  BarChart2,
  UserPlus,
  ShieldCheck,
  Bot,
  PlayCircle,
  ChevronDown,
  Building,
  Code2,
  MailWarning,
  MessageSquareDashed,
  Settings,
  Rocket,
} from "lucide-react";

/* ──────────────── animation helpers ──────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.15, ease: [0.25, 0.4, 0.25, 1] as const },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.85, y: 30 },
  visible: (i: number = 0) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.15, ease: [0.25, 0.4, 0.25, 1] as const },
  }),
};

const slideLeft = {
  hidden: { opacity: 0, x: -60 },
  visible: (i: number = 0) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.7, delay: i * 0.2, ease: [0.25, 0.4, 0.25, 1] as const },
  }),
};

const slideRight = {
  hidden: { opacity: 0, x: 60 },
  visible: (i: number = 0) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.7, delay: i * 0.2, ease: [0.25, 0.4, 0.25, 1] as const },
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.12 } },
};

const reviews = [
  { name: "Michał K.", role: "Graphic Designer", color: "bg-red-500/20 text-red-500", text: '"Nareszcie klienci nie pytają mnie 5 razy o to samo. Wrzucam pliki na ich portal, oni akceptują. Święty spokój."' },
  { name: "Anna Nowacka", role: "Copywriterka", color: "bg-emerald-500/20 text-emerald-500", text: '"Asystent AI to złoto. Czyta moje stare teksty ujęte w ticketach klienta i podrzuca mi dobre skróty."' },
  { name: "Tomek W.", role: "Web Developer", color: "bg-blue-500/20 text-blue-500", text: '"Wyceniłem swoje pakiety o 30% w górę. Klienci płacą chętniej, bo logują się do mojego profesjonalnego panelu."' },
  { name: "Piotrek Dz.", role: "Social Media Mgr", color: "bg-purple-500/20 text-purple-500", text: '"Koniec z szukaniem haseł do Instagrama w mailach. Mam wszystko posegregowane na każdego leada z osobna."' },
  { name: "Kasia M.", role: "Illustratorka", color: "bg-amber-500/20 text-amber-500", text: '"Moi klienci w końcu czują się profesjonalnie obsługiwani. Zero chaosu, wszystko w jednym miejscu."' },
  { name: "Robert N.", role: "Video Editor", color: "bg-cyan-500/20 text-cyan-500", text: '"Przejście na GK Portal trwało 15 minut. Teraz oszczędzam 5h tygodniowo, które tracił na maile i statusy."' },
];

/* ──────────────── pricing data ──────────────── */
const plans = [
  {
    name: "Starter",
    monthlyPrice: 129,
    yearlyPrice: 107,
    desc: "Na smak i wejście w uporządkowaną pracę z mniejszą bazą klientów.",
    features: [
      { icon: PlayCircle, text: "Webinar onboardingowy (migracja z excela)", highlight: true },
      { icon: Bot, text: "Podstawowy Asystent AI (mały limit zapytań)", purple: true },
      { icon: Check, text: "1 Użytkownik (Właściciel)" },
      { icon: Check, text: "15 Aktywnych Klientów" },
      { icon: Check, text: "5 GB Sejf Cyfrowy na pliki" },
    ],
    cta: "Zacznij od Startera",
    href: "/register?plan=STARTER",
    featured: false,
  },
  {
    name: "Professional",
    monthlyPrice: 249,
    yearlyPrice: 207,
    desc: "Pełen pakiet produktywności dla skalujących się solistów i teamów.",
    features: [
      { icon: PlayCircle, text: "Webinar onboardingowy (szybka migracja)", highlight: true },
      { icon: Bot, text: "Nielimitowany AI Asystent czytający duże załączniki do zgłoszeń.", purple: true },
      { icon: Check, text: "6 Użytkowników z uprawnieniami" },
      { icon: Check, text: "Nielimitowani Klienci na platformie" },
      { icon: Check, text: "25 GB Sejf Cyfrowy" },
      { icon: Check, text: "Role dla pracowników" },
    ],
    cta: "Wybieram Professional",
    href: "/register?plan=PROFESSIONAL",
    featured: true,
    badge: "Najczęściej Wybierany",
  },
  {
    name: "Expert",
    monthlyPrice: 599,
    yearlyPrice: 499,
    desc: "Dla pracowni z dużym przepływem potężnych plików.",
    features: [
      { icon: PlayCircle, text: "Webinar + 1h Custom Konsultacji IT z inżynierem", highlight: true },
      { icon: Bot, text: "Customowe modele AI trenowane na Twoich starych zleceniach.", purple: true },
      { icon: Check, text: "Nielimitowani Pracownicy" },
      { icon: Check, text: "100 GB Super Szybkiego Dysku" },
      { icon: Check, text: "Priorytetowy Support 24/7 na WhatsApp" },
    ],
    cta: "Wybierz Expert",
    href: "/register?plan=EXPERT",
    featured: false,
  },
];

const faqs = [
  {
    q: "Czy migracja i wdrożenie systemu są skomplikowane?",
    a: 'Ani trochę! GK Portal stworzyliśmy specjalnie dla freelancerów. W każdym pakiecie otrzymasz dostęp do webinaru "Łatwa Migracja", który przeprowadzi Cię za rękę przez proces przenoszenia klientów. Wystarczy kilka kliknięć, by Twój biznes wszedł na profesjonalne tory.',
  },
  {
    q: "Czy moi klienci poradzą sobie z obsługą panelu?",
    a: "Tak, panel projektowaliśmy z myślą o skrajnej prostocie. Klienci logują się tradycyjnie (login i hasło) do przejrzystego interfejsu. Wyeliminowaliśmy zbędne funkcje, które mogłyby ich rozpraszać – widzą tylko to, co niezbędne, by szybko zgłosić zadanie lub pobrać plik.",
  },
  {
    q: "Czy moje dane i baza danych są u Was bezpieczne?",
    a: 'Wykorzystujemy zaawansowaną architekturę Multi-Tenant zgodną ze standardami bezpieczeństwa w UE (RODO). Infrastruktura dla Twojej firmy jest zamknięta i chroniona za zaporą ogniową; nie miesza się z plikami innych kont. Dane są backupowane co 24h na oddzielne serwery offline.',
  },
];

/* ──────────────── main component ──────────────── */
export default function LandingPage() {
  const [isYearly, setIsYearly] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="bg-[#050505] text-[#f5f5f5] min-h-screen overflow-x-hidden">
      <style dangerouslySetInnerHTML={{
        __html: `
    body { background-color: #050505; color: #f5f5f5; }
    .glass-panel {
      background: linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 50%, rgba(0,0,0,0.1) 100%);
      backdrop-filter: blur(40px) saturate(1.4);
      -webkit-backdrop-filter: blur(40px) saturate(1.4);
      border: 1px solid rgba(255, 255, 255, 0.12);
      box-shadow:
        inset 0 1px 1px rgba(255,255,255,0.1),
        inset 0 -1px 1px rgba(0,0,0,0.2),
        0 8px 32px rgba(0,0,0,0.4);
    }
    .glass-panel-light {
      background: linear-gradient(145deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 40%, rgba(0,0,0,0.05) 100%);
      backdrop-filter: blur(40px) saturate(1.4);
      -webkit-backdrop-filter: blur(40px) saturate(1.4);
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow:
        inset 0 1px 1px rgba(255,255,255,0.12),
        inset 0 -1px 1px rgba(0,0,0,0.15),
        0 4px 24px rgba(0,0,0,0.3);
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .glass-panel-light:hover {
      background: linear-gradient(145deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.05) 40%, rgba(0,0,0,0.02) 100%);
      border-color: rgba(255, 255, 255, 0.18);
      box-shadow:
        inset 0 1px 2px rgba(255,255,255,0.15),
        inset 0 -1px 1px rgba(0,0,0,0.1),
        0 12px 48px rgba(0,0,0,0.4),
        0 0 0 1px rgba(255,255,255,0.05);
    }
    .glass-shine {
      position: relative;
      overflow: hidden;
    }
    .glass-shine::before {
      content: '';
      position: absolute;
      top: 0; left: -20%; right: -20%;
      height: 40%;
      background: linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 100%);
      pointer-events: none;
      border-radius: inherit;
      z-index: 1;
    }

    @keyframes marquee-scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
    .marquee-track { animation: marquee-scroll 40s linear infinite; display: flex; width: max-content; }
    .marquee-container:hover .marquee-track { animation-play-state: paused; }

    @keyframes pulse-glow {
      0%, 100% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); }
      50% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
    }

    .animated-border-box {
      position: relative; border-radius: 1.5rem; padding: 2px;
      background: transparent; overflow: hidden; z-index: 1;
    }
    .animated-border-box::before {
      content: ''; position: absolute; top: 50%; left: 50%; width: 150%; height: 150%;
      background: radial-gradient(circle, rgba(239, 68, 68, 0.4) 0%, transparent 70%);
      filter: blur(20px);
      animation: pulse-glow 4s ease-in-out infinite; z-index: -2;
      transform: translate(-50%, -50%);
    }
    .animated-border-box::after {
      content: ''; position: absolute; inset: 2px; border-radius: calc(1.5rem - 2px);
      background: #0a0a0a; z-index: -1;
    }

    .btn {
      display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem;
      border-radius: 0.75rem; font-weight: 700; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer; text-align: center; border: 1px solid transparent; text-decoration: none;
      line-height: 1.2;
    }
    .btn-primary {
      background-color: #ef4444; color: white;
      box-shadow: 0 0 20px rgba(239, 68, 68, 0.3);
    }
    .btn-primary:hover {
      background-color: #dc2626; box-shadow: 0 0 30px rgba(239, 68, 68, 0.5); transform: translateY(-3px);
    }
    .btn-premium {
      background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%); color: white;
      box-shadow: 0 10px 30px -10px rgba(239, 68, 68, 0.8);
      border: 1px solid rgba(255,100,100,0.5);
    }
    .btn-premium:hover {
      background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
      box-shadow: 0 15px 40px -10px rgba(239, 68, 68, 1); transform: translateY(-2px);
    }
    .btn-secondary {
      background-color: rgba(255,255,255,0.05); color: white;
      border-color: rgba(255,255,255,0.1);
    }
    .btn-secondary:hover {
      background-color: rgba(255,255,255,0.1); transform: translateY(-2px);
    }

    .btn-lg { padding: 1rem 2rem; font-size: 1.125rem; }
    .btn-md { padding: 0.75rem 1.5rem; font-size: 0.875rem; }
    .btn-sm { padding: 0.5rem 1rem; font-size: 0.875rem; }

    .mac-dot { width: 12px; height: 12px; border-radius: 50%; }
    .mac-red { background: #ff5f56; }
    .mac-yellow { background: #ffbd2e; }
    .mac-green { background: #27c93f; }
  ` }} />


      {/* NAVIGATION */}
      <nav className="fixed w-full z-50 top-0 border-b border-white/5 bg-[#050505]/80 backdrop-blur-md">
        <div className="max-w-[1200px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-[#1a1a2e] to-black border border-white/10 flex items-center justify-center text-red-500 font-bold shadow-[0_0_15px_rgba(239,68,68,0.2)]">GK</div>
            <span className="font-bold text-xl tracking-tight text-white">GK_<span className="text-red-500">Digital</span></span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">Funkcje</a>
            <a href="#process" className="hover:text-white transition-colors">Jak to działa</a>
            <a href="#pricing" className="hover:text-white transition-colors">Cennik</a>
          </div>
          <div className="flex items-center gap-4">
            <a href="/login" className="text-sm font-medium text-slate-300 hover:text-white px-4 py-2 hover:bg-white/5 rounded-lg transition-colors">Logowanie</a>
            <a href="/register" className="btn btn-primary btn-md">Dołącz Teraz</a>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1400px] h-[800px] pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, rgba(239,68,68,0.12) 0%, rgba(239,68,68,0.04) 40%, transparent 70%)' }}></div>

        <div className="max-w-[1200px] mx-auto px-6 relative z-10 text-center">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-red-500 mb-8">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            SYSTEM V2.0 DOSTĘPNY
          </motion.div>

          <motion.h1 initial="hidden" animate="visible" variants={fadeUp} custom={1} className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-extrabold tracking-tight mb-8 leading-tight">
            Zarządzaj zleceniami jak <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-500">Dojrzała Agencja</span>
          </motion.h1>

          <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={2} className="text-lg lg:text-xl text-slate-400 max-w-3xl mx-auto mb-10 leading-relaxed font-light">
            Koniec z chaosem w mailach, Messengerze i Excelu. GK Portal to Twoje centrum dowodzenia: klienci, zgłoszenia i <span className="text-white font-medium">Asystent AI</span> w jednym miejscu. Przejdź na wyższy poziom bez zatrudniania sztabu ludzi.
          </motion.p>

          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3} className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
            <a href="/register" className="btn btn-primary btn-lg w-full sm:w-auto">Rozpocznij Teraz</a>
            <a href="#process" className="btn btn-secondary btn-lg w-full sm:w-auto"><span>Poznaj Funkcje</span> <ArrowDown className="w-5 h-5" /></a>
          </motion.div>

          {/* MAC WINDOW DASHBOARD MOCKUP */}
          <motion.div initial={{ opacity: 0, y: 60, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.8, delay: 0.5, ease: [0.25, 0.4, 0.25, 1] }} className="relative mx-auto max-w-5xl">
            <div className="glass-panel rounded-2xl overflow-hidden shadow-2xl border border-white/10 relative group transform transition-transform duration-700 hover:scale-[1.01]">
              {/* Window Header */}
              <div className="h-10 bg-[#0f0f0f] border-b border-white/5 flex items-center px-4 gap-2">
                <div className="mac-dot mac-red"></div>
                <div className="mac-dot mac-yellow"></div>
                <div className="mac-dot mac-green"></div>
                <div className="mx-auto text-xs font-mono text-slate-600">dashboard.gk-digital.pl</div>
              </div>
              {/* Window Content */}
              <div className="relative bg-[#050505] aspect-[16/9] flex overflow-hidden text-left font-sans select-none cursor-default">

                {/* SIDEBAR */}
                <div className="w-64 bg-[#0a0a0a] border-r border-[#262626] flex-col hidden md:flex shrink-0">
                  <div className="h-16 flex items-center px-6 border-b border-[#262626]">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-gradient-to-tr from-[#1a1a2e] to-black border border-white/10 flex items-center justify-center text-red-500 font-bold text-[10px] shadow-[0_0_10px_rgba(239,68,68,0.2)]">GK</div>
                      <span className="font-bold text-sm tracking-tight text-white">GK_<span className="text-red-500">Digital</span></span>
                    </div>
                  </div>
                  <div className="p-4 space-y-1">
                    <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-white text-xs font-semibold flex items-center gap-3 border-l-2 border-l-red-500">Dashboard</div>
                    <div className="px-3 py-2 rounded-lg hover:bg-white/5 text-[#a1a1aa] text-xs font-medium flex items-center gap-3 transition-colors">Klienci</div>
                    <div className="px-3 py-2 rounded-lg hover:bg-white/5 text-[#a1a1aa] text-xs font-medium flex items-center gap-3 transition-colors">Zgłoszenia</div>
                    <div className="px-3 py-2 rounded-lg hover:bg-white/5 text-[#a1a1aa] text-xs font-medium flex items-center gap-3 transition-colors">Kalendarz</div>
                  </div>
                  <div className="mt-auto p-4 border-t border-[#262626] bg-[#0f0f0f]">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-bold text-amber-500">STANDARD</span>
                      <div className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[10px] font-bold border border-emerald-500/20 flex items-center gap-1">
                        <Wifi className="w-2 h-2" /> ONLINE
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-[10px] text-[#71717a] mb-1"><span>Środowisko</span><span>2.4GB / 5GB</span></div>
                        <div className="h-1 w-full bg-[#27272a] rounded-full overflow-hidden"><div className="h-full bg-blue-500 w-[48%]"></div></div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[10px] text-[#71717a] mb-1"><span>AI Tokens</span><span>12k / 500k</span></div>
                        <div className="h-1 w-full bg-[#27272a] rounded-full overflow-hidden"><div className="h-full bg-purple-500 w-[3%]"></div></div>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-2 px-3 py-2 rounded border border-[#27272a] bg-[#18181b] hover:bg-[#27272a] transition-colors cursor-pointer group">
                      <UserPlus className="w-3 h-3 text-[#a1a1aa] group-hover:text-white" />
                      <span className="text-[10px] font-bold text-[#a1a1aa] group-hover:text-white">Zaproś Klienta</span>
                    </div>
                  </div>
                </div>

                {/* MAIN CONTENT */}
                <div className="flex-1 bg-[#050505] flex flex-col relative overflow-hidden">
                  <div className="h-16 border-b border-[#262626] flex items-center justify-between px-6 bg-[#050505]/80 backdrop-blur-md">
                    <h2 className="text-sm font-bold text-white">Panel Agencji</h2>
                    <div className="flex items-center gap-4">
                      <div className="text-right hidden sm:block">
                        <div className="text-[11px] font-bold text-white">Jan Kowalski</div>
                        <div className="text-[9px] text-[#71717a] uppercase tracking-wider font-semibold">Administrator</div>
                      </div>
                      <div className="w-8 h-8 rounded bg-red-500 hover:bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-500/20 transition-all transform hover:scale-105 cursor-pointer">
                        <Plus className="w-4 h-4" />
                      </div>
                    </div>
                  </div>

                  <div className="p-6 overflow-y-hidden h-full flex flex-col gap-6">
                    {/* KPI Row */}
                    <div className="grid grid-cols-4 gap-4">
                      {[
                        { label: "Krytyczne", value: "0", sub: "Wymagają natychmiastowej uwagi", icon: AlertCircle, iconColor: "text-[#71717a]" },
                        { label: "Otwarte", value: "12", sub: "Wszystkie aktywne zadania", icon: Clock, iconColor: "text-blue-400" },
                        { label: "Klienci", value: "24", sub: "Firmy z otwartymi zgłoszeniami", icon: Users, iconColor: "text-purple-400" },
                        { label: "Przychód (Msc)", value: "45 200 PLN", sub: "Na podstawie zamkniętych zadań", icon: TrendingUp, iconColor: "text-emerald-400", valueColor: "text-emerald-500" },
                      ].map((card, i) => (
                        <div key={i} className="bg-[#0a0a0a] border border-[#262626] rounded-xl p-4 group hover:border-[#3f3f46] transition-colors">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-[10px] font-bold text-[#71717a] uppercase tracking-wider">{card.label}</span>
                            <div className={`p-1 rounded bg-[#27272a] ${card.iconColor}`}><card.icon className="w-3 h-3" /></div>
                          </div>
                          <div className={`text-2xl font-bold mb-1 ${card.valueColor || "text-white"}`}>{card.value}</div>
                          <div className="text-[10px] text-[#52525b]">{card.sub}</div>
                        </div>
                      ))}
                    </div>

                    {/* Middle Row */}
                    <div className="grid grid-cols-3 gap-6 flex-1 min-h-0">
                      <div className="col-span-2 bg-[#0a0a0a] border border-[#262626] rounded-xl p-5 flex flex-col">
                        <div className="flex items-center gap-2 mb-6">
                          <Activity className="w-4 h-4 text-white" />
                          <span className="text-sm font-bold text-white">Ostatnia Aktywność</span>
                        </div>
                        <div className="space-y-3">
                          {[
                            { initials: "TC", color: "bg-blue-500/10 text-blue-500", name: "TechCorp sp. z o.o.", desc: 'Dodano nowe zgłoszenie: "Awaria Checkoutu"', time: "12 min temu" },
                            { initials: "L2", color: "bg-purple-500/10 text-purple-500", name: "Logistyka24", desc: "Opłacono fakturę FV/2024/05/22", time: "2h temu" },
                            { initials: "S", color: "bg-emerald-500/10 text-emerald-500", name: "Studio 44", desc: 'Zaakceptowano wycenę "Redesign Logo"', time: "5h temu" },
                          ].map((item, i) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-[#18181b] border border-[#27272a] hover:border-red-500/30 transition-colors group">
                              <div className="flex items-center gap-4">
                                <div className={`w-8 h-8 rounded ${item.color} font-bold text-xs flex items-center justify-center`}>{item.initials}</div>
                                <div>
                                  <div className="text-xs font-bold text-white group-hover:text-red-500 transition-colors">{item.name}</div>
                                  <div className="text-[10px] text-[#71717a]">{item.desc}</div>
                                </div>
                              </div>
                              <div className="text-[10px] font-mono text-[#52525b]">{item.time}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-[#0a0a0a] border border-[#262626] rounded-xl p-5 flex flex-col relative overflow-hidden text-right">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <BarChart2 className="w-4 h-4 text-emerald-500" />
                            <span className="text-sm font-bold text-white">Przychody</span>
                          </div>
                          <div className="flex gap-1">
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#27272a] text-[#71717a]">3M</span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500 text-black font-bold">6M</span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#27272a] text-[#71717a]">1R</span>
                          </div>
                        </div>
                        <div className="mb-4">
                          <div className="text-3xl font-bold text-emerald-500">45 200 PLN</div>
                          <div className="text-[10px] text-[#52525b]">Suma z wybranego okresu</div>
                        </div>
                        <div className="flex items-end justify-between gap-1 flex-1 mt-auto h-24">
                          {[
                            { h: "40%", label: "STY", val: "12k" },
                            { h: "55%", label: "LUT", val: "18k" },
                            { h: "35%", label: "MAR", val: "10k" },
                            { h: "70%", label: "KWI", val: "28k" },
                            { h: "60%", label: "MAJ", val: "22k" },
                            { h: "90%", label: "CZE", val: "45k", active: true },
                          ].map((bar, i) => (
                            <div key={i} className={`w-full rounded-t-sm hover:bg-emerald-500/20 transition-colors relative group ${bar.active ? "bg-emerald-900/40 border-t-2 border-emerald-500" : "bg-[#18181b]"}`} style={{ height: bar.h }}>
                              <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] text-white opacity-0 group-hover:opacity-100 transition-opacity">{bar.val}</div>
                              <div className={`text-center text-[8px] absolute -bottom-4 w-full ${bar.active ? "text-emerald-500 font-bold" : "text-[#52525b]"}`}>{bar.label}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Floating AI Button */}
                  <div className="absolute bottom-6 right-6 w-10 h-10 rounded-full bg-purple-600 hover:bg-purple-500 flex items-center justify-center text-white shadow-xl shadow-purple-600/30 cursor-pointer transition-transform hover:scale-110 z-10">
                    <Sparkles className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* HORIZONTAL OPINIONS CAROUSEL */}
      <section className="py-16 relative z-20 overflow-hidden">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="max-w-[1200px] mx-auto px-6 text-center mb-10">
          <p className="text-xs font-medium text-white/50 uppercase tracking-widest">Co mówią o nas freelancerzy tacy jak Ty</p>
        </motion.div>

        <div className="relative w-full overflow-hidden marquee-container group">
          <div className="absolute inset-y-0 left-0 w-40 bg-gradient-to-r from-[#050505] to-transparent z-20 pointer-events-none"></div>
          <div className="absolute inset-y-0 right-0 w-40 bg-gradient-to-l from-[#050505] to-transparent z-20 pointer-events-none"></div>

          <div className="marquee-track gap-6 py-2">
            {[...reviews, ...reviews, ...reviews, ...reviews].map((review, i) => (
              <div key={i} className="glass-panel-light p-6 rounded-2xl w-80 shrink-0 border border-white/5 flex flex-col justify-between hover:-translate-y-1 transition-transform relative z-30 hover:z-40 hover:bg-white/10 mx-3">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-full ${review.color} flex items-center justify-center font-bold`}>{review.name[0]}</div>
                  <div className="text-left"><div className="text-sm font-bold text-white">{review.name}</div><div className="text-[10px] text-slate-500">{review.role}</div></div>
                </div>
                <p className="text-xs text-slate-400 italic">{review.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROBLEM AGITATION */}
      <section className="py-24 relative">
        {/* Ambient glows behind problem cards */}
        <div className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-1/4 w-[900px] h-[900px] pointer-events-none" style={{ background: 'radial-gradient(circle at center, rgba(239,68,68,0.08) 0%, rgba(239,68,68,0.02) 40%, transparent 70%)' }}></div>
        <div className="absolute top-1/3 right-0 translate-x-1/4 w-[500px] h-[500px] pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.05) 0%, transparent 60%)' }}></div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.5 }} variants={stagger} className="max-w-[1200px] mx-auto px-6 text-center relative z-10">
          <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">Czujesz, że <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-500">toniesz w mailach</span>, Messengerze i&nbsp;Excelu?</motion.h2>
          <motion.p variants={fadeUp} className="text-lg lg:text-xl text-slate-400 max-w-4xl mx-auto mb-16 leading-relaxed font-light">
            Rozproszone wiadomości od klientów. Niezapisane wyceny za &quot;drobne poprawki&quot;. Dziesiątki otwartych zakładek.
            Kiedy <strong className="text-white">Ty tracisz czas</strong> na szukanie ustaleń w historii chatu na WhatsAppie, Twój portfel chudnie.
          </motion.p>

          <div className="grid sm:grid-cols-2 gap-6 text-left">
            {[
              { icon: MailWarning, title: "Rozproszony kontakt", desc: "Klienci piszą na maila, WhatsApp i Messengera. Przebicie się przez szum informacyjny, by ustalić co jest zrobione, a co wymaga Twojej uwagi, zajmuje wieczność. Z nami masz wszystko w jednym wątku." },
              { icon: MessageSquareDashed, title: "Brak autorytetu i zaufania", desc: 'Twój klient nie wie, na jakim etapie jest zlecenie i ciągle dopytuje "czy to już?". Zamiast projektować, tracisz czas na ciągłe uspokajanie go. Daj mu wgląd w postępy i odzyskaj profesjonalny wizerunek.' },
            ].map((card, i) => (
              <motion.div key={i} variants={i === 0 ? slideLeft : slideRight} custom={i} className="glass-panel-light glass-shine p-10 lg:p-12 rounded-3xl flex gap-6 items-start hover:border-red-500/30 transition-all hover:-translate-y-1 duration-300 group">
                <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center shrink-0 mt-1 group-hover:scale-110 group-hover:border-red-500/30 transition-all">
                  <card.icon className="text-red-500 w-7 h-7" />
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-2 text-white">{card.title}</h4>
                  <p className="text-sm text-slate-400 leading-relaxed">{card.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* HOW IT WORKS (STEPS) */}
      <section id="process" className="py-24 relative">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.5 }} variants={stagger} className="max-w-[1200px] mx-auto px-6 relative z-10">
          <motion.div variants={fadeUp} className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-[10px] font-semibold text-red-500 mb-6 uppercase tracking-wider">
              Banalnie Proste
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">Transformacja w 3 prostych krokach</h2>
            <p className="text-slate-400 text-base max-w-2xl mx-auto">Zacznij działać profesjonalnie w mniej niż 10 minut.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-12 relative">
            <div className="hidden md:block absolute top-[28px] left-[16%] right-[16%] h-[2px] bg-gradient-to-r from-transparent via-red-500/30 to-transparent"></div>

            {[
              { num: "1", icon: Settings, title: "Zacznij w kilka minut", desc: "Wybierz pakiet i załóż konto. Błyskawiczna konfiguracja sprawia, że system jest gotowy do pracy niemal natychmiast." },
              { num: "2", icon: UserPlus, title: "Załóż konta swoim klientom", desc: "Od teraz sami zgłaszają poprawki i nowe taski bezpośrednio w panelu. Widzą postęp prac w czasie rzeczywistym." },
              { num: "3", icon: Rocket, title: "Odzyskaj radość z rzemiosła", desc: "Ty zajmujesz się tworzeniem wartości, a system automatycznie zbiera wytyczne i pilnuje, by każde zadanie było dowiezione na czas." },
            ].map((step, i) => (
              <motion.div key={i} variants={scaleIn} custom={i} className="relative text-center z-10">
                <div className="w-14 h-14 mx-auto bg-gradient-to-br from-red-500 to-red-700 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-red-500/20">
                  <span className="text-2xl font-black text-white">{step.num}</span>
                </div>
                <h3 className="text-lg font-bold mb-3 text-white">{step.title}</h3>
                <p className="text-slate-400 text-xs leading-relaxed max-w-xs mx-auto">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* FEATURES GRID */}
      <section id="features" className="py-24 relative">
        {/* Ambient glows BEHIND the cards — makes glass visible */}
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[500px] pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(239,68,68,0.06) 0%, transparent 60%)' }}></div>
        <div className="absolute top-1/3 right-1/4 -translate-y-1/2 w-[400px] h-[400px] pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.05) 0%, transparent 60%)' }}></div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] pointer-events-none" style={{ background: 'radial-gradient(ellipse, rgba(239,68,68,0.04) 0%, transparent 60%)' }}></div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.5 }} variants={stagger} className="max-w-[1200px] mx-auto px-6 relative z-10">
          <motion.div variants={fadeUp} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">Wszystko dla freelancera i małego teamu</h2>
            <p className="text-slate-400 text-lg max-w-3xl mx-auto font-light">Zintegrowane narzędzia z wbudowaną sztuczną inteligencją. Oszczędzaj czas, buduj autorytet i podnoś stawki.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Users, title: "Twój Własny Portal", desc: "Dedykowany panel dla Twoich klientów. Przestaną pytać o poprawki na mailu. Sami dodają zgłoszenia, śledzą postęp prac i zyskują podziw do Twojego profesjonalizmu." },
              { icon: Bot, title: "Twój osobisty Asystent AI", desc: "AI automatycznie tworzy zgłoszenia z chaotycznych wiadomości, pomaga w ich wycenie i sugeruje rozwiązania. Działa w oparciu o Twoją bazę wiedzy." },
              { icon: ShieldCheck, title: "Izolacja i Bezpieczeństwo Danych", desc: "Każdy Twój klient otrzymuje bezpieczną, odizolowaną instancję bazy danych. Twoje pliki, umowy i ustalenia są przechowywane w zaszyfrowanym środowisku." },
            ].map((feat, i) => (
              <motion.div key={i} variants={scaleIn} custom={i} className="glass-panel-light glass-shine p-8 lg:p-10 rounded-3xl hover:border-red-500/40 transition-all hover:-translate-y-2 duration-300 group relative">
                <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/10 shadow-lg flex items-center justify-center mb-8 group-hover:scale-110 group-hover:border-red-500/30 transition-all">
                  <feat.icon className="text-red-500 w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-white relative z-10">{feat.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed relative z-10">{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-24 relative">

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.5 }} variants={stagger} className="max-w-[1200px] mx-auto px-6">
          <motion.div variants={fadeUp} className="text-center mb-16 relative z-10">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">Wymień chaos na święty spokój</h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-10 font-light">Wystarczy godzina oszczędności w miesiącu, by system się zwrócił.</p>

            {/* Toggle */}
            <div className="flex items-center justify-center gap-4">
              <span className={"font-semibold transition-colors" + (isYearly ? " text-slate-500" : " text-white")}>Miesięcznie</span>
              <button className={"w-14 h-7 rounded-full relative transition-all duration-300 cursor-pointer" + (isYearly ? " bg-emerald-500" : " bg-[#3f3f46] border border-[#52525b]")} onClick={() => setIsYearly(!isYearly)}>
                <div className={"absolute top-[3px] left-[3px] w-[20px] h-[20px] bg-white rounded-full transition-all duration-300 shadow-md" + (isYearly ? " translate-x-[28px]" : "")}></div>
              </button>
              <span className={"font-semibold flex items-center gap-2 transition-colors" + (isYearly ? " text-white" : " text-slate-500")}>Rocznie <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full border border-emerald-500/20">2 M-CE GRATIS</span></span>
            </div>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 relative z-10 w-full">
            {plans.map((plan, idx) => {
              const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
              const oldPrice = isYearly ? plan.monthlyPrice : null;

              if (plan.featured) {
                return (
                  <motion.div key={idx} variants={fadeUp} custom={idx} className="animated-border-box transform lg:-translate-y-4 shadow-[0_20px_50px_-15px_rgba(239,68,68,0.4)]">
                    <div className="bg-[#0a0a0a]/90 h-full w-full rounded-[calc(1.5rem-2px)] p-6 lg:p-8 flex flex-col relative z-20 backdrop-blur-xl">
                      {plan.badge && <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[9px] font-bold px-4 py-1.5 rounded-b-xl uppercase tracking-widest w-max shadow-lg shadow-red-500/50">{plan.badge}</div>}
                      <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-500 mb-2 mt-4">{plan.name}</h3>
                      <div className="flex items-end gap-2 mb-1">
                        <div className="text-4xl lg:text-5xl font-black text-white tracking-tight">{price}<span className="text-xl"> zł</span></div>
                        {oldPrice && <div className="text-base text-slate-500 line-through font-bold mb-1.5">{oldPrice} zł</div>}
                      </div>
                      <div className="text-[10px] text-slate-400 mb-4 font-medium uppercase tracking-wider">/msc</div>
                      <p className="text-xs text-slate-300 mb-6 pb-4 border-b border-white/10">{plan.desc}</p>
                      <ul className="space-y-3 mb-6 flex-1">
                        {plan.features.map((f, fi) => (
                          <li key={fi} className="flex items-start gap-3 text-white">
                            <f.icon className={`w-4 h-4 shrink-0 mt-0.5 ${f.purple ? "text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" : f.highlight ? "text-red-500" : "text-emerald-500"}`} />
                            <span className="text-[11px]">{f.text}</span>
                          </li>
                        ))}
                      </ul>
                      <a href={plan.href} className="btn btn-premium btn-md w-full text-base mt-auto">{plan.cta}</a>
                    </div>
                  </motion.div>
                );
              }
              return (
                <motion.div key={idx} variants={fadeUp} custom={idx} className="glass-panel-light p-6 lg:p-8 rounded-3xl border border-white/5 flex flex-col relative transition-all hover:bg-white/[0.04] hover:-translate-y-1">
                  <h3 className="text-lg font-bold text-white mb-2">{plan.name}</h3>
                  <div className="flex items-end gap-2 mb-1">
                    <div className="text-3xl lg:text-4xl font-black text-white tracking-tight">{price}<span className="text-lg"> zł</span></div>
                    {oldPrice && <div className="text-sm text-slate-500 line-through font-bold mb-1">{oldPrice} zł</div>}
                  </div>
                  <div className="text-[10px] text-slate-500 mb-4 font-medium uppercase tracking-wider">/msc</div>
                  <p className="text-xs text-slate-400 mb-6 pb-4 border-b border-white/5">{plan.desc}</p>
                  <ul className="space-y-3 mb-6 flex-1">
                    {plan.features.map((f, fi) => (
                      <li key={fi} className="flex items-start gap-3 text-[11px] text-slate-300">
                        <f.icon className={`w-4 h-4 shrink-0 mt-0.5 ${f.purple ? "text-purple-400" : f.highlight ? "text-red-500" : "text-emerald-500"}`} />
                        <span>{f.text}</span>
                      </li>
                    ))}
                  </ul>
                  <a href={plan.href} className="btn btn-secondary btn-sm w-full">{plan.cta}</a>
                </motion.div>
              );
            })}

            {/* Enterprise */}
            <motion.div variants={fadeUp} custom={3} className="glass-panel-light p-6 lg:p-8 rounded-3xl border border-transparent bg-gradient-to-b from-white/[0.05] to-transparent flex flex-col relative transition-all">
              <h3 className="text-lg font-bold text-slate-400 mb-2">Enterprise</h3>
              <div className="text-2xl lg:text-3xl font-black text-white mb-1 mt-1 tracking-tight">Kontakt</div>
              <div className="text-[10px] text-slate-500 mb-4 font-medium uppercase tracking-wider">&nbsp;</div>
              <p className="text-xs text-slate-400 mb-6 pb-4 border-b border-white/5">Serwery dedykowane i szycie aplikacji pod Twój proces na zamówienie.</p>
              <ul className="space-y-3 mb-6 flex-1 opacity-70">
                <li className="flex items-start gap-3 text-[11px] text-slate-300"><Building className="w-4 h-4 text-slate-500 shrink-0" /> Instancja Dedykowana / On-Premise</li>
                <li className="flex items-start gap-3 text-[11px] text-slate-300"><Lock className="w-4 h-4 text-slate-500 shrink-0" /> Umowa SLA 99.9%</li>
                <li className="flex items-start gap-3 text-[11px] text-slate-300"><Code2 className="w-4 h-4 text-slate-500 shrink-0" /> Custom Integracje z bankami lub fakturowaniem (API)</li>
              </ul>
              <a href="/kontakt" className="btn btn-secondary btn-sm w-full border-slate-700 text-slate-400 hover:text-white mt-auto">Napisz do nas</a>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* FAQ SECTION */}
      <section className="py-24 relative">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.5 }} variants={stagger} className="max-w-3xl mx-auto px-6">
          <motion.div variants={fadeUp} className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 md:text-4xl">Często Zadawane Pytania</h2>
            <p className="text-slate-400 text-base">Rozwiej swoje wątpliwości i dołącz do nas z pewnością.</p>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <motion.div key={i} variants={fadeUp} custom={i} className="glass-panel rounded-2xl overflow-hidden cursor-pointer transition-all hover:bg-[#0f0f0f]/80 border border-white/5 hover:border-white/20" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <div className="p-6 flex items-center justify-between">
                  <h4 className="font-bold text-base text-white pr-8">{faq.q}</h4>
                  <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 shrink-0 ${openFaq === i ? "rotate-180" : ""}`} />
                </div>
                <div className={`overflow-hidden transition-all duration-300 ${openFaq === i ? "max-h-60 opacity-100" : "max-h-0 opacity-0"}`}>
                  <div className="px-6 pb-6 text-slate-400 text-sm leading-relaxed border-t border-white/5 pt-4">
                    {faq.a}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* FINAL CTA */}
      <section className="py-32 relative">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1200px] h-[700px] pointer-events-none" style={{ background: 'radial-gradient(ellipse at center bottom, rgba(239,68,68,0.1) 0%, rgba(239,68,68,0.03) 40%, transparent 70%)' }}></div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.5 }} variants={stagger} className="max-w-[1200px] mx-auto px-6 text-center relative z-10">
          <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-8 tracking-tight">Koniec wymówek. <br />Czas na <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-red-200 to-red-400">profesjonalizację.</span></motion.h2>
          <motion.p variants={fadeUp} custom={1} className="text-slate-400 mb-12 text-lg lg:text-xl max-w-2xl mx-auto font-light">Zarządzaj zleceniami i komunikacją sprawnie niczym potężna agencja – zachowując styl, niezależność i koszty freelancera.</motion.p>
          <motion.div variants={fadeUp} custom={2} className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <a href="/register?plan=PROFESSIONAL" className="btn btn-premium btn-lg w-full sm:w-auto shadow-[0_0_50px_rgba(239,68,68,0.4)] px-12 py-5 text-lg rounded-2xl font-bold">
              <span>Przestań Tracić Czas</span> <ArrowRight className="w-5 h-5" />
            </a>
          </motion.div>
          <motion.p variants={fadeUp} custom={3} className="mt-6 text-sm text-slate-500 flex items-center justify-center gap-2 font-medium"><ShieldCheck className="w-4 h-4 text-emerald-500" /> Gwarancja bezpieczeństwa. Anuluj w dowolnej chwili.</motion.p>
        </motion.div>
      </section>

      {/* MINIMALIST FOOTER */}
      <footer className="border-t border-white/5 py-12 text-xs relative z-20">
        <div className="max-w-[1200px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-slate-500">
            &copy; 2026 GK Digital. Wszelkie prawa zastrzeżone.
          </div>
          <div className="flex gap-6">
            <a href="#" className="text-slate-500 hover:text-white transition-colors">Regulamin</a>
            <a href="#" className="text-slate-500 hover:text-white transition-colors">Polityka Prywatności</a>
            <a href="/pomoc" className="text-slate-500 hover:text-white transition-colors">Centrum Pomocy</a>
            <a href="#" className="text-slate-500 hover:text-white transition-colors">Kontakt</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
