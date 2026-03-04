"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Building2, Mail, Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
    const { user } = useAuth();
    const router = useRouter();

    // Redirect if already fully registered and active
    React.useEffect(() => {
        if (user && user.organizationId && user.isActive) {
            router.push('/dashboard');
        }
    }, [user, router]);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [fullName, setFullName] = useState('');
    const [company, setCompany] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    company_name: company,
                    role: 'ADMIN',
                },
            },
        });

        if (error) {
            setError(error.message);
            setIsLoading(false);
        } else {
            // Get selected plan and interval from URL
            const params = new URLSearchParams(window.location.search);
            const plan = params.get('plan');
            const interval = params.get('interval');

            if (plan) {
                // If plan is explicitly passed (from landing page click), redirect to choice anyway to trigger potential upsells
                let nextUrl = `/choose-plan?plan=${plan}`;
                if (interval) nextUrl += `&interval=${interval}`;
                router.push(nextUrl);
            } else {
                // Default flow: direct to the new selection page with upsells
                router.push(`/choose-plan`);
            }
        }
    };

    return (
        <div className="w-full h-full flex items-center justify-center p-6">
            <div className="w-full max-w-[480px] relative z-10">
                <Card className="p-8 md:p-10 border-white/5 bg-white/2 backdrop-blur-2xl">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-white mb-2">Rozpocznij tutaj.</h1>
                        <p className="text-sm text-slate-500">Krok 1: Skonfiguruj dane Twojego konta.</p>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-5">
                        <div className="relative">
                            <Input
                                label="Imię i Nazwisko"
                                required
                                placeholder="Jan Kowalski"
                                className="pl-10"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                            />
                            <ShieldCheck className="absolute left-3 bottom-3 w-4 h-4 text-slate-500" />
                        </div>

                        <div className="relative">
                            <Input
                                label="Nazwa Organizacji"
                                required
                                placeholder="np. GK Digital Sp. z o.o."
                                className="pl-10"
                                value={company}
                                onChange={(e) => setCompany(e.target.value)}
                            />
                            <Building2 className="absolute left-3 bottom-3 w-4 h-4 text-slate-500" />
                        </div>

                        <div className="relative">
                            <Input
                                label="Email Administratora"
                                type="email"
                                required
                                placeholder="jan@twoja-firma.pl"
                                className="pl-10"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                            <Mail className="absolute left-3 bottom-3 w-4 h-4 text-slate-500" />
                        </div>

                        <div className="relative">
                            <Input
                                label="Hasło"
                                type="password"
                                required
                                placeholder="••••••••"
                                className="pl-10"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <Lock className="absolute left-3 bottom-3 w-4 h-4 text-slate-500" />
                        </div>

                        {error && (
                            <div className="p-3 rounded-lg text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20 text-center animate-in fade-in zoom-in-95">
                                {error}
                            </div>
                        )}

                        <Button type="submit" isLoading={isLoading} className="w-full h-12 mt-4">
                            Zarejestruj się <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-white/5 text-center">
                        <p className="text-xs text-slate-600">
                            Masz już konto? {' '}
                            <Link href="/login" className="text-white hover:text-accent-red transition-colors font-medium">Zaloguj się</Link>
                        </p>
                    </div>
                </Card>
            </div>
        </div>
    );
}
