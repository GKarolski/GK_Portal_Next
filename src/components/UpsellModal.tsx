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
            className={`relative w-full max-w-4xl mx-auto overflow-hidden ${inline
                ? 'bg-transparent mt-4'
                : 'bg-[#0a0a0a] border border-red-500/30 rounded-3xl shadow-[0_0_50px_rgba(239,68,68,0.15)]'
                }`}
        >
            {!inline && (
                <>
                    {/* Decorative background for popup */}
                    <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-red-500/20 to-purple-500/20 pointer-events-none" />
                    <div className="absolute top-0 right-0 p-4 z-20">
                        <button onClick={onClose} className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </>
            )}

            <div className={`relative z-10 flex flex-col items-center text-center ${inline ? 'p-2' : 'p-8 md:p-10 mt-4'}`}>
                {/* Header Section */}
                {inline ? (
                    <div className="mb-10">
                        <motion.div
                            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500 text-xs font-bold text-white mb-6 uppercase tracking-widest shadow-[0_0_20px_rgba(239,68,68,0.4)]"
                        >
                            <Sparkles className="w-4 h-4" /> Oferta Specjalna
                        </motion.div>
                        <h2 className="text-3xl lg:text-5xl font-extrabold text-white mb-4 tracking-tight">Odbierz więcej. Płać mniej.</h2>
                        <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
                            Gratulacje! Twój bazowy pakiet <span className="text-white font-medium">{basePlan === "STARTER" ? "Starter" : "Professional"}</span> jest gotowy.
                            Tylko teraz, przez najbliższe 24 godziny, możesz ulepszyć go do poziomu <span className="text-red-400 font-bold">{targetPlanInfo.name}</span> ze stałym rabatem.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white mb-6 shadow-lg shadow-red-500/30">
                            <Sparkles className="w-8 h-8" />
                        </div>
                        <h2 className="text-3xl font-extrabold text-white mb-3">Zaraz, zaraz... Mamy dla Ciebie ofertę!</h2>
                        <p className="text-slate-400 mb-8 max-w-md mx-auto text-sm leading-relaxed">
                            Zauważyliśmy, że wybrałeś pakiet <strong>{basePlan === "STARTER" ? "Starter" : "Professional"}</strong>. Jako nowy klient masz u nas unikalną okazję odblokować funkcje pakietu <strong>{targetPlanInfo.name}</strong> ze stałym rabatem.
                        </p>
                    </>
                )}

                {/* Offer Box (Inline looks like a premium pricing card) */}
                <div className={`w-full max-w-2xl mx-auto flex flex-col ${inline ? 'animated-border-box my-4 shadow-[0_20px_50px_-15px_rgba(239,68,68,0.4)] p-1' : 'bg-white/[0.03] border border-white/10 rounded-2xl p-6 mb-8 md:flex-row gap-6'}`}>
                    <div className={`${inline ? 'bg-[#0a0a0a]/90 backdrop-blur-xl rounded-[calc(1.5rem-2px)] p-8 lg:p-10 flex flex-col relative z-20' : 'flex-1 text-left space-y-3'}`}>
                        {inline && (
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[10px] font-bold px-6 py-1.5 rounded-b-xl uppercase tracking-widest w-max shadow-lg shadow-red-500/50">
                                Ekskluzywny Upgrade
                            </div>
                        )}

                        {!inline && <h3 className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-500 text-lg uppercase tracking-wider">{targetPlanInfo.name}</h3>}

                        <div className={`flex ${inline ? 'flex-col sm:flex-row justify-between items-start sm:items-center mt-6 mb-8 border-b border-white/10 pb-8 gap-6' : 'flex-col items-center justify-center min-w-[140px] border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6'}`}>
                            {inline && (
                                <div className="text-left">
                                    <h3 className="text-2xl font-bold text-white mb-2">{targetPlanInfo.name}</h3>
                                    <div className="text-sm text-slate-400">Płacisz <span className="text-white font-medium">{discountedPrice} zł</span> zamiast <span className="line-through">{targetPlanInfo.originalPrice} zł</span> co {isYearly ? 'rok' : 'miesiąc'}.</div>
                                </div>
                            )}

                            <div className={`flex flex-col ${inline ? 'items-end' : 'items-center justify-center'}`}>
                                {!inline && <div className="text-[10px] text-red-400 font-bold uppercase tracking-widest mb-1">Teraz Tylko</div>}
                                <div className="flex items-end gap-2 mb-1">
                                    <div className={`font-black text-white ${inline ? 'text-4xl lg:text-5xl' : 'text-4xl'}`}>{discountedPrice} <span className="text-xl">zł</span></div>
                                    <span className="text-slate-500 line-through text-lg mb-1.5 ml-1">{targetPlanInfo.originalPrice} zł</span>
                                </div>
                                <div className="text-[10px] text-red-400 font-bold uppercase tracking-widest bg-red-500/10 px-3 py-1 rounded border border-red-500/20">
                                    Oszczędzasz {discountPercent}% na zawsze!
                                </div>
                            </div>
                        </div>

                        <div className={inline ? 'mt-2 text-left' : ''}>
                            {inline && <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Co zyskujesz:</div>}
                            <ul className={`space-y-3 ${inline ? 'grid sm:grid-cols-2 gap-x-4 gap-y-3' : 'space-y-2'}`}>
                                {targetPlanInfo.benefits.map((benefit, i) => (
                                    <li key={i} className="flex items-center gap-3 text-sm text-slate-300">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                        <span>{benefit}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Timer */}
                {timeLeft && (
                    <div className={`flex items-center justify-center gap-3 ${inline ? 'my-8' : 'mb-8'}`}>
                        <Clock className="w-5 h-5 text-red-500 animate-pulse" />
                        <div className="flex items-center gap-2 font-mono text-lg font-bold text-white">
                            <span className="bg-[#18181b] px-3 py-1.5 rounded-lg border border-[#27272a] shadow-inner">{String(timeLeft.hours).padStart(2, '0')}</span>
                            :
                            <span className="bg-[#18181b] px-3 py-1.5 rounded-lg border border-[#27272a] shadow-inner">{String(timeLeft.minutes).padStart(2, '0')}</span>
                            :
                            <span className="bg-[#18181b] px-3 py-1.5 rounded-lg border border-[#27272a] text-red-400 shadow-inner">{String(timeLeft.seconds).padStart(2, '0')}</span>
                        </div>
                        <span className="text-xs text-slate-500 font-medium ml-2">do końca promocji</span>
                    </div>
                )}

                {/* Actions */}
                <div className={`flex flex-col sm:flex-row w-full gap-4 ${inline ? 'max-w-2xl' : ''}`}>
                    <button
                        onClick={handleDecline}
                        className={`btn btn-secondary flex-1 font-semibold transition-colors ${inline ? 'py-5 text-base' : 'py-4 text-sm'}`}
                    >
                        Nie, zostaję przy {basePlan === "STARTER" ? "Starter" : "Professional"}
                    </button>
                    <button
                        onClick={handleAccept}
                        className={`btn btn-premium flex-1 font-bold flex items-center justify-center gap-2 transition-all ${inline ? 'py-5 text-base' : 'py-4 text-sm'}`}
                    >
                        <span>Aktywuj {targetPlanInfo.name} z Rabatem</span>
                        <ArrowRight className="w-5 h-5" />
                    </button>
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
