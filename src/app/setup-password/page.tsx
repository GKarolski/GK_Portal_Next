"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { ShieldCheck, Lock, ArrowRight, AlertTriangle, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

function SetupPasswordContent() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const { user } = useAuth();

    useEffect(() => {
        if (!token) {
            setError("Brak tokena weryfikacyjnego. Link może być nieprawidłowy lub wygasł.");
        }
    }, [token]);

    const handleSetup = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError("Hasła nie są identyczne.");
            return;
        }

        if (password.length < 8) {
            setError("Hasło musi mieć co najmniej 8 znaków.");
            return;
        }

        if (!token) {
            setError("Brak tokena weryfikacyjnego.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setSuccess(null);

        try {
            // 1. Weryfikacja tokena OTP (Loguje użytkownika)
            const { error: verifyError, data } = await supabase.auth.verifyOtp({
                token_hash: token,
                type: 'invite'
            });

            if (verifyError) {
                // Spróbuj jako recovery (w razie gdyby to był reset hasła w przyszłości)
                const { error: recoveryError } = await supabase.auth.verifyOtp({
                    token_hash: token,
                    type: 'recovery'
                });
                if (recoveryError) {
                    throw new Error("Link wygasł lub jest nieprawidłowy. Poproś o nowe zaproszenie.");
                }
            }

            // 2. Skoro jesteśmy zalogowani (sesja w przeglądarce), zmieniamy hasło
            const { error: updateError } = await supabase.auth.updateUser({
                password: password
            });

            if (updateError) {
                throw new Error("Udało się zweryfikować link, ale wystąpił błąd przy zapisie hasła: " + updateError.message);
            }

            setSuccess("Hasło zostało ustawione pomyślnie! Trwa logowanie...");

            // Przekieruj po 1.5 sekundy
            setTimeout(() => {
                router.push('/dashboard');
            }, 1500);

        } catch (err: any) {
            setError(err.message || "Wystąpił nieoczekiwany błąd.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4 bg-gk-950">
            {/* Background Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent-red/5 blur-[120px] rounded-full"></div>
            </div>

            <div className="w-full max-w-md relative z-10">
                <div className="text-center mb-10">
                    <Link href="/" className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#0a0a0a] border border-white/5 mb-6 text-accent-red shadow-2xl hover:scale-105 transition-transform">
                        <ShieldCheck className="w-8 h-8" />
                    </Link>
                    <h1 className="text-3xl font-bold tracking-tight mb-2 text-white">
                        Ustaw Hasło
                    </h1>
                    <p className="text-slate-500">
                        Witaj w GK Portal. Utwórz mocne hasło do swojego konta.
                    </p>
                </div>

                <Card className="p-8 border-white/10 bg-[#0a0a0a]/90 backdrop-blur-3xl shadow-2xl">
                    {error && (
                        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 animate-in fade-in slide-in-from-top-1">
                            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                            <div>
                                <h3 className="text-sm font-bold text-red-400">Błąd</h3>
                                <p className="text-xs text-red-500/80 mt-1">{error}</p>
                            </div>
                        </div>
                    )}

                    {success && (
                        <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20 flex items-start gap-3 animate-in fade-in slide-in-from-top-1">
                            <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                            <div>
                                <h3 className="text-sm font-bold text-green-400">Sukces</h3>
                                <p className="text-xs text-green-500/80 mt-1">{success}</p>
                            </div>
                        </div>
                    )}

                    {!success && (
                        <form onSubmit={handleSetup} className="space-y-5">
                            <div className="relative">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1 mb-2 block">Nowe Hasło</label>
                                <div className="relative">
                                    <Input type="password" required placeholder="••••••••" className="pl-10" value={password}
                                        onChange={(e) => setPassword(e.target.value)} disabled={!token || isLoading} />
                                    <Lock className="absolute left-3 bottom-3 w-4 h-4 text-slate-600" />
                                </div>
                            </div>

                            <div className="relative pt-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1 mb-2 block">Powtórz Hasło</label>
                                <div className="relative">
                                    <Input type="password" required placeholder="••••••••" className="pl-10" value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)} disabled={!token || isLoading} />
                                    <Lock className="absolute left-3 bottom-3 w-4 h-4 text-slate-600" />
                                </div>
                            </div>

                            <Button type="submit" isLoading={isLoading} disabled={!token} className="w-full h-12 mt-6">
                                Zapisz i Wejdź <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </form>
                    )}
                </Card>

                <div className="mt-8 flex flex-col items-center gap-2 text-center">
                    <div className="text-slate-500/80 text-[11px] font-mono flex items-center justify-center gap-2 bg-[#050505] py-2 px-4 rounded-full border border-white/5 shadow-inner">
                        <ShieldCheck className="w-3.5 h-3.5" /> Secured by GK_Digital Infrastructure
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function SetupPasswordPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-gk-950 flex items-center justify-center text-white">Ładowanie...</div>}>
            <SetupPasswordContent />
        </Suspense>
    );
}
