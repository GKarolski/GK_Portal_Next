"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { ShieldCheck, Mail, Lock, ArrowRight, Send, AlertTriangle, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [view, setView] = useState<'login' | 'reset'>('login');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const { user } = useAuth();
    const router = useRouter();

    // Redirect if already logged in
    React.useEffect(() => {
        if (user) router.push('/dashboard');
    }, [user, router]);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
            setIsLoading(false);
        } else {
            router.push('/dashboard');
        }
    };

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuccess(null);

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/callback`,
        });

        if (error) {
            setError(error.message);
        } else {
            setSuccess("Link resetujący został wysłany na Twój email.");
        }
        setIsLoading(false);
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
                        {view === 'login' ? 'Witaj ponownie' : 'Odzyskiwanie Konta'}
                    </h1>
                    <p className="text-slate-500">
                        {view === 'login' ? 'Zaloguj się do swojego panelu zarządzania.' : 'Podaj email, aby otrzymać link resetujący.'}
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

                    {view === 'login' ? (
                        <form onSubmit={handleLogin} className="space-y-5">
                            <div className="relative">
                                <Input label="Email" type="email" required placeholder="name@company.com" className="pl-10" value={email}
                                    onChange={(e) => setEmail(e.target.value)} />
                                <Mail className="absolute left-3 bottom-3 w-4 h-4 text-slate-600" />
                            </div>

                            <div className="relative">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Hasło</label>
                                    <button type="button" onClick={() => setView('reset')} className="text-accent-red hover:text-accent-red-hover text-xs transition-colors">Zapomniałeś hasła?</button>
                                </div>
                                <div className="relative">
                                    <Input type="password" required placeholder="••••••••" className="pl-10" value={password}
                                        onChange={(e) => setPassword(e.target.value)} />
                                    <Lock className="absolute left-3 bottom-3 w-4 h-4 text-slate-600" />
                                </div>
                            </div>

                            <div className="flex items-center mt-4">
                                <div
                                    className="flex items-center gap-2 cursor-pointer group"
                                    onClick={() => setRememberMe(!rememberMe)}
                                >
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${rememberMe ? 'bg-accent-red border-accent-red' : 'bg-black/40 border-white/20 group-hover:border-white/40'}`}>
                                        {rememberMe && <CheckCircle className="w-3 h-3 text-white" />}
                                    </div>
                                    <span className={`text-[12px] font-medium tracking-wide select-none ${rememberMe ? 'text-white' : 'text-slate-500 group-hover:text-slate-400'}`}>
                                        Zapamiętaj mnie
                                    </span>
                                </div>
                            </div>

                            <Button type="submit" isLoading={isLoading} className="w-full h-12 mt-6">
                                Zaloguj się <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </form>
                    ) : (
                        <form onSubmit={handleReset} className="space-y-5">
                            <div className="relative">
                                <Input label="Email" type="email" required placeholder="name@company.com" className="pl-10" value={email}
                                    onChange={(e) => setEmail(e.target.value)} />
                                <Mail className="absolute left-3 bottom-3 w-4 h-4 text-slate-600" />
                            </div>

                            <Button type="submit" isLoading={isLoading} className="w-full h-12 mt-2">
                                Wyślij Link <Send className="w-4 h-4 ml-2" />
                            </Button>

                            <button type="button" onClick={() => setView('login')} className="w-full text-center text-xs text-slate-500 hover:text-white mt-4 transition-colors">
                                Wróć do logowania
                            </button>
                        </form>
                    )}

                    {view === 'login' && (
                        <div className="mt-8 text-center">
                            <p className="text-sm text-slate-500">
                                Nie masz konta? {' '}
                                <Link href="/register" className="text-white hover:text-accent-red font-medium transition-colors">Utwórz konto</Link>
                            </p>
                        </div>
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
