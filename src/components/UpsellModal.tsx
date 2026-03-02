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

    const content = (
        <motion.div
            initial={{ opacity: 0, scale: inline ? 0.95 : 0.9, y: inline ? 10 : 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={inline ? { opacity: 0, scale: 0.95, y: -10 } : { opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className={`relative w-full max-w-4xl mx-auto overflow-hidden ${inline ? 'mt-4' : ''}`}
        >
            <div className="relative bg-[#050505] border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl">
                {/* Premium Background Glows */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-500/10 blur-[100px] rounded-full pointer-events-none mix-blend-screen" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-red-600/5 blur-[100px] rounded-full pointer-events-none mix-blend-screen" />

                {/* Header Banner - Special Offer */}
                <div className="bg-gradient-to-r from-red-600 to-red-900 px-6 py-4 flex flex-col sm:flex-row items-center justify-between border-b border-red-500/30 relative z-10">
                    <div className="flex items-center gap-2 text-white/90">
                        <Sparkles className="w-5 h-5 text-red-200" />
                        <span className="text-sm font-bold uppercase tracking-widest text-red-100">Jednorazowa Oferta VIP</span>
                    </div>
                    {timeLeft && (
                        <div className="flex items-center gap-2 mt-2 sm:mt-0 bg-black/40 px-3 py-1.5 rounded-lg border border-white/10">
                            <Clock className="w-4 h-4 text-red-300" />
                            <div className="font-mono text-sm font-bold text-white tracking-widest">
                                {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
                            </div>
                        </div>
                    )}
                </div>

                {!inline && (
                    <button onClick={onClose} className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/40 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 backdrop-blur-md transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                )}

                <div className="p-8 md:p-12 relative z-10 grid md:grid-cols-[1fr_auto_1fr] gap-8 md:gap-12 items-center">

                    {/* Left Column: Context & Upgrade */}
                    <div className="flex flex-col text-left">
                        <h2 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight leading-tight">
                            Skaczemy<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-600">poziom wyżej?</span>
                        </h2>
                        <p className="text-slate-400 text-base md:text-lg mb-8 leading-relaxed">
                            Gratulacje wybrania pakietu <strong className="text-white">{basePlan === "STARTER" ? "Starter" : "Professional"}</strong>! Zanim sfinalizujemy Twoje konto, mamy dla Ciebie ekskluzywny rabat na potężniejszy plan <strong className="text-red-400">{targetPlanInfo.name}</strong>. Zyskaj ogromne możliwości w ułamku ceny.
                        </p>

                        <div className="space-y-4">
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Zawartość Planu {targetPlanInfo.name}:</div>
                            <ul className="grid sm:grid-cols-2 gap-4">
                                {targetPlanInfo.benefits.map((benefit, i) => (
                                    <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                                        <CheckCircle2 className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                                        <span className="leading-snug">{benefit}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Middle Divider (Desktop only) */}
                    <div className="hidden md:block w-px h-full bg-gradient-to-b from-transparent via-white/10 to-transparent" />

                    {/* Right Column: Pricing & Action */}
                    <div className="flex flex-col items-center md:items-start bg-white/[0.02] p-6 md:p-8 rounded-3xl border border-white/5 backdrop-blur-xl shrink-0 w-full md:w-auto mt-4 md:mt-0">
                        <div className="text-center md:text-left w-full mb-6">
                            <div className="text-slate-400 font-medium text-sm mb-2 uppercase tracking-wide">Inwestycja z rabatem</div>
                            <div className="flex items-end justify-center md:justify-start gap-3 mb-2">
                                <span className="text-6xl font-black text-white tracking-tighter">{discountedPrice}<span className="text-2xl text-slate-500 ml-1">zł</span></span>
                            </div>
                            <div className="flex items-center justify-center md:justify-start gap-2">
                                <span className="text-slate-500 line-through decoration-red-500/50 decoration-2 text-lg font-bold">{targetPlanInfo.originalPrice} zł</span>
                                <span className="bg-red-500/20 text-red-400 text-xs font-bold px-2 py-1 rounded border border-red-500/20 uppercase tracking-wider">-{discountPercent}% Na zawsze</span>
                            </div>
                        </div>

                        <div className="w-full flex-col gap-4 flex mt-4">
                            <button
                                onClick={handleAccept}
                                className="w-full h-14 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_30px_rgba(239,68,68,0.3)] hover:shadow-[0_0_40px_rgba(239,68,68,0.5)] transform hover:-translate-y-0.5"
                            >
                                <span className="text-lg">Aktywuj {targetPlanInfo.name}</span>
                                <ArrowRight className="w-5 h-5" />
                            </button>
                            <button
                                onClick={handleDecline}
                                className="w-full h-12 bg-transparent text-slate-400 hover:text-white font-medium text-sm transition-colors rounded-xl border border-transparent hover:border-white/10 hover:bg-white/5"
                            >
                                Odrzuć ofertę, wybieram {basePlan === "STARTER" ? "Starter" : "Professional"}
                            </button>
                        </div>
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
