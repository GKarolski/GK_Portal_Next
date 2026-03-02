"use client";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, X, Clock, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface UpsellModalProps {
    basePlan: string;
    isYearly: boolean;
    onClose: () => void;
    inline?: boolean;
}

const UPSELL_DURATION_HOURS = 24;
const UPSELL_DURATION_MS = UPSELL_DURATION_HOURS * 60 * 60 * 1000;

export default function UpsellModal({ basePlan, isYearly, onClose, inline = false }: UpsellModalProps) {
    const router = useRouter();
    const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);

    // Determine target plan for upsell
    const targetPlan = basePlan === "STARTER" ? "PROFESSIONAL" : "EXPERT";
    const discountPercent = basePlan === "STARTER" ? 15 : 10;

    // Hardcoded plan info for upsell modal clarity
    const targetPlanInfo = targetPlan === "PROFESSIONAL"
        ? {
            name: "Professional",
            benefits: ["Nielimitowany AI Asystent", "6 Użytkowników", "Nielimitowani Klienci", "25 GB Dysku"],
            originalPrice: isYearly ? 207 : 249,
        }
        : {
            name: "Expert",
            benefits: ["Customowe Modele AI", "100 GB Dysku", "Priorytetowy Support 24/7", "Nielimitowani Pracownicy"],
            originalPrice: isYearly ? 499 : 599,
        };

    const discountedPrice = Math.floor(targetPlanInfo.originalPrice * (1 - discountPercent / 100));

    useEffect(() => {
        // Handle countdown timer with localStorage
        const timerKey = `upsell_timer_${basePlan}`;
        let endTimeStr = localStorage.getItem(timerKey);
        let endTime: number;

        if (!endTimeStr) {
            // First time seeing this offer, set timer for 24h
            endTime = Date.now() + UPSELL_DURATION_MS;
            localStorage.setItem(timerKey, endTime.toString());
        } else {
            endTime = parseInt(endTimeStr, 10);

            // If timer expired, reset it (as per requirements "wygasa na 24h, cykl się powtarza")
            // In a real scenario, you might want to hide it completely, but the task says "po 24h cykl się powtarza"
            if (Date.now() > endTime) {
                endTime = Date.now() + UPSELL_DURATION_MS;
                localStorage.setItem(timerKey, endTime.toString());
            }
        }

        const updateTimer = () => {
            const now = Date.now();
            const distance = endTime - now;

            if (distance < 0) {
                setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
                return;
            }

            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            setTimeLeft({ hours, minutes, seconds });
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, [basePlan]);

    const handleAccept = () => {
        // Apply upsell plan logic here (e.g., specific price ID with discount)
        const interval = isYearly ? 'year' : 'month';
        router.push(`/checkout?plan=${targetPlan}&interval=${interval}&upsell=true&base=${basePlan}`);
    };

    const handleDecline = () => {
        // Proceed with original chosen plan
        const interval = isYearly ? 'year' : 'month';
        router.push(`/checkout?plan=${basePlan}&interval=${interval}`);
    };

    // Get full plan objects to display feature lists correctly
    const { pricingPlans } = require('@/config/pricing');
    const basePlanObj = pricingPlans[basePlan as keyof typeof pricingPlans];
    const targetPlanObj = pricingPlans[targetPlan as keyof typeof pricingPlans];

    const content = (
        <motion.div
            initial={{ opacity: 0, scale: inline ? 0.95 : 0.9, y: inline ? 10 : 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={inline ? { opacity: 0, scale: 0.95, y: -10 } : { opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className={`relative w-full max-w-5xl mx-auto ${inline ? 'mt-8' : ''}`}
        >
            <div className="text-center mb-10 w-full flex flex-col items-center">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-xs font-bold text-red-400 mb-6 uppercase tracking-widest shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                    <Sparkles className="w-4 h-4" /> Jednorazowa Oferta VIP
                </div>
                <h2 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight leading-tight">
                    Skaczemy poziom wyżej?
                </h2>
                <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
                    Zanim sfinalizujemy Twoje konto, mamy dla Ciebie ekskluzywny rabat na plan <strong className="text-red-400">{targetPlanInfo.name}</strong>. Zyskaj ogromne możliwości w ułamku ceny.
                </p>

                {timeLeft && (
                    <div className="flex items-center gap-2 mt-6 bg-black/40 px-4 py-2 rounded-xl border border-white/10 shadow-inner">
                        <Clock className="w-4 h-4 text-red-400 animate-pulse" />
                        <span className="text-xs text-slate-400 uppercase tracking-widest font-bold mr-2">Oferta wygasa z:</span>
                        <div className="font-mono text-base font-bold text-white tracking-widest">
                            {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
                        </div>
                    </div>
                )}
            </div>

            <div className="grid md:grid-cols-2 gap-6 lg:gap-8 relative z-10 w-full">
                {/* ACTUALLY CHOSEN PLAN (Base) */}
                <div className="glass-panel-light p-6 lg:p-8 rounded-[2rem] border border-white/5 flex flex-col relative transition-all opacity-70 hover:opacity-100 bg-[#0a0a0a]/50">
                    <div className="absolute top-4 right-6 text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-white/5 px-3 py-1 rounded-full border border-white/5">
                        Aktualny Wybór
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{basePlanObj.name}</h3>
                    <div className="flex items-end gap-2 mb-1">
                        <div className="text-4xl font-black text-slate-300 tracking-tight">{isYearly ? basePlanObj.yearlyPrice : basePlanObj.monthlyPrice}<span className="text-xl text-slate-500"> zł</span></div>
                    </div>
                    <div className="text-[10px] text-slate-500 mb-4 font-medium uppercase tracking-wider">/{isYearly ? 'rok' : 'msc'}</div>
                    <p className="text-xs text-slate-400 mb-6 pb-4 border-b border-white/5">{basePlanObj.desc}</p>

                    <ul className="space-y-3 mb-8 flex-1">
                        {basePlanObj.features.map((f: any, fi: number) => (
                            <li key={fi} className="flex items-start gap-3 text-sm text-slate-400">
                                <CheckCircle2 className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                                <span>{f.text}</span>
                            </li>
                        ))}
                    </ul>

                    <button onClick={handleDecline} className="w-full h-12 bg-transparent text-slate-400 hover:text-white font-medium text-sm transition-colors rounded-xl border border-white/5 hover:border-white/20 hover:bg-white/5">
                        Zostaję przy {basePlanObj.name}
                    </button>
                </div>

                {/* UPSELL OFFER PLAN (Target) */}
                <div className="relative group p-[1px] rounded-[2rem] overflow-hidden shadow-[0_20px_50px_-15px_rgba(239,68,68,0.4)] md:scale-[1.03] origin-left">
                    <div
                        className="absolute inset-[-100%] z-0 pointer-events-none"
                        style={{
                            background: 'conic-gradient(from 0deg, transparent 70%, #ef4444 100%)',
                            animation: 'spin 4s linear infinite'
                        }}
                    />
                    <div className="bg-[#050505] h-full w-full rounded-[calc(2rem-1px)] p-6 lg:p-8 flex flex-col relative z-10">
                        {/* Highlights */}
                        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-red-500/10 blur-[80px] rounded-full pointer-events-none mix-blend-screen" />
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-gradient-to-r from-red-600 to-red-500 text-white text-[10px] font-bold px-6 py-1.5 rounded-b-xl uppercase tracking-widest w-max shadow-lg shadow-red-500/50">
                            Zalecany Upgrade (-{discountPercent}%)
                        </div>

                        <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-500 mb-2 mt-4">{targetPlanInfo.name}</h3>

                        <div className="flex flex-col gap-1 mb-1">
                            <div className="flex items-center gap-2">
                                <span className="text-slate-500 line-through decoration-red-500/50 decoration-2 text-lg font-bold">{targetPlanInfo.originalPrice} zł</span>
                                <span className="bg-red-500/10 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded border border-red-500/20 uppercase tracking-widest">Zniżka Na Zawsze</span>
                            </div>
                            <div className="text-5xl font-black text-white tracking-tighter">{discountedPrice}<span className="text-2xl text-slate-400 font-bold ml-1">zł</span></div>
                        </div>

                        <div className="text-[10px] text-red-400/80 mb-4 font-bold uppercase tracking-wider">/{isYearly ? 'rok' : 'msc'}</div>
                        <p className="text-xs text-slate-300 mb-6 pb-4 border-b border-white/10">{targetPlanObj.desc}</p>

                        <div className="text-xs font-bold text-white uppercase tracking-widest mb-4">Wszystko co w {basePlanObj.name}, plus:</div>
                        <ul className="space-y-3 mb-8 flex-1">
                            {targetPlanInfo.benefits.map((benefit, i) => (
                                <li key={i} className="flex items-start gap-3 text-sm text-white">
                                    <div className="mt-0.5 rounded-full bg-red-500/20 p-0.5 border border-red-500/30">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-red-400 shrink-0" />
                                    </div>
                                    <span className="font-medium">{benefit}</span>
                                </li>
                            ))}
                        </ul>

                        <button onClick={handleAccept} className="w-full h-14 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_30px_rgba(239,68,68,0.3)] hover:shadow-[0_0_40px_rgba(239,68,68,0.5)] transform hover:-translate-y-0.5">
                            <span>Aktywuj {targetPlanInfo.name}</span>
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );

    if (inline) {
        return content;
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            {content}
        </div>
    );
}
