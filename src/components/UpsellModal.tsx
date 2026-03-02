"use client";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, X, Clock, CheckCircle2 } from "lucide-react";

interface UpsellModalProps {
    basePlan: string;
    isYearly: boolean;
    onClose: () => void;
}

const UPSELL_DURATION_HOURS = 24;
const UPSELL_DURATION_MS = UPSELL_DURATION_HOURS * 60 * 60 * 1000;

export default function UpsellModal({ basePlan, isYearly, onClose }: UpsellModalProps) {
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
        window.location.href = `/api/checkout?plan=${targetPlan}&interval=${interval}&upsell=true&base=${basePlan}`;
    };

    const handleDecline = () => {
        // Proceed with original chosen plan
        const interval = isYearly ? 'year' : 'month';
        window.location.href = `/api/checkout?plan=${basePlan}&interval=${interval}`;
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-2xl bg-[#0a0a0a] border border-red-500/30 rounded-3xl shadow-[0_0_50px_rgba(239,68,68,0.15)] overflow-hidden"
            >
                {/* Decorative background */}
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-red-500/20 to-purple-500/20 pointer-events-none" />
                <div className="absolute top-0 right-0 p-4 z-20">
                    <button onClick={onClose} className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-8 md:p-10 relative z-10 flex flex-col items-center text-center mt-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white mb-6 shadow-lg shadow-red-500/30">
                        <Sparkles className="w-8 h-8" />
                    </div>

                    <h2 className="text-3xl font-extrabold text-white mb-3">Zaraz, zaraz... Mamy dla Ciebie ofertę!</h2>
                    <p className="text-slate-400 mb-8 max-w-md mx-auto text-sm leading-relaxed">
                        Zauważyliśmy, że wybrałeś pakiet <strong>{basePlan === "STARTER" ? "Starter" : "Professional"}</strong>. Jako nowy klient masz u nas unikalną okazję odblokować funkcje pakietu <strong>{targetPlanInfo.name}</strong> ze stałym rabatem.
                    </p>

                    {/* Offer Box */}
                    <div className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-6 mb-8 flex flex-col md:flex-row items-center gap-6">
                        <div className="flex-1 text-left space-y-3">
                            <h3 className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-500 text-lg uppercase tracking-wider">{targetPlanInfo.name}</h3>
                            <ul className="space-y-2">
                                {targetPlanInfo.benefits.map((benefit, i) => (
                                    <li key={i} className="flex items-center gap-2 text-xs text-slate-300">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                        <span>{benefit}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="shrink-0 flex flex-col items-center justify-center min-w-[140px] border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6">
                            <div className="text-[10px] text-red-400 font-bold uppercase tracking-widest mb-1">Teraz Tylko</div>
                            <div className="flex items-end gap-2 mb-1">
                                <div className="text-4xl font-black text-white">{discountedPrice} <span className="text-lg">zł</span></div>
                            </div>
                            <div className="text-xs text-slate-500 line-through">Zamiast {targetPlanInfo.originalPrice} zł</div>
                            <div className="mt-2 text-[10px] bg-red-500/10 text-red-500 px-2 py-1 rounded-md border border-red-500/20">
                                -{discountPercent}% RABATU
                            </div>
                        </div>
                    </div>

                    {/* Timer */}
                    {timeLeft && (
                        <div className="mb-8 flex items-center justify-center gap-3">
                            <Clock className="w-5 h-5 text-red-500 animate-pulse" />
                            <div className="flex items-center gap-2 font-mono text-lg font-bold text-white">
                                <span className="bg-[#18181b] px-3 py-1.5 rounded-lg border border-[#27272a]">{String(timeLeft.hours).padStart(2, '0')}</span>
                                :
                                <span className="bg-[#18181b] px-3 py-1.5 rounded-lg border border-[#27272a]">{String(timeLeft.minutes).padStart(2, '0')}</span>
                                :
                                <span className="bg-[#18181b] px-3 py-1.5 rounded-lg border border-[#27272a] text-red-400">{String(timeLeft.seconds).padStart(2, '0')}</span>
                            </div>
                            <span className="text-xs text-slate-500 font-medium ml-2">do końca promocji</span>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row w-full gap-4">
                        <button
                            onClick={handleDecline}
                            className="btn btn-secondary flex-1 py-4 text-sm font-semibold hover:bg-white/5 order-2 sm:order-1"
                        >
                            Nie, dziękuję. Zostaję przy {basePlan === "STARTER" ? "Starter" : "Professional"}
                        </button>
                        <button
                            onClick={handleAccept}
                            className="btn bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white flex-1 py-4 text-sm font-bold shadow-[0_0_20px_rgba(239,68,68,0.4)] order-1 sm:order-2 flex items-center justify-center gap-2"
                        >
                            <span>Odbieram {targetPlanInfo.name} z Rabatem</span>
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
