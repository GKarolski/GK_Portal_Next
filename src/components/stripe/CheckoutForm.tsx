"use client";

import React, { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { ShieldCheck, Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface CheckoutFormProps {
    planId: string;
}

import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export const CheckoutForm: React.FC<CheckoutFormProps> = ({ planId }) => {
    const stripe = useStripe();
    const elements = useElements();
    const searchParams = useSearchParams();
    const { user } = useAuth();

    const [message, setMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isStripeReady, setIsStripeReady] = useState(false);
    const [showCompanyFields, setShowCompanyFields] = useState(false);

    // Native form state
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: user?.email || '',
        company: user?.companyName || '',
        nip: '',
        address: '',
        city: '',
        zip: ''
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements || !user) return;

        // Basic validation for native fields
        if (!formData.firstName || !formData.lastName || !formData.email || !formData.address || !formData.city || !formData.zip) {
            setMessage("Wypełnij wszystkie wymagane pola adresowe.");
            return;
        }

        setIsLoading(true);
        setMessage(null);

        // 1. Trigger form validation and wallet collection
        const { error: submitError } = await elements.submit();
        if (submitError) {
            setMessage(submitError.message ?? "Proszę poprawić dane płatności.");
            setIsLoading(false);
            return;
        }

        try {
            // 2. Create subscription & customer on the backend
            const response = await fetch('/api/stripe/create-subscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    planId,
                    userId: user.id,
                    interval: searchParams.get('interval') || 'month',
                    upsell: searchParams.get('upsell') || 'false',
                    formData // passing the full billing details
                }),
            });

            const data = await response.json();

            if (!response.ok || data.error) {
                throw new Error(data.error || 'Błąd generowania subskrypcji.');
            }

            // 3. Confirm the payment intent using the returned clientSecret
            const returnUrl = `${window.location.origin}/provisioning?plan=${planId}`;

            const { error: confirmError } = await stripe.confirmPayment({
                elements,
                clientSecret: data.clientSecret,
                confirmParams: {
                    return_url: returnUrl,
                },
            });

            if (confirmError) {
                setMessage(confirmError.message ?? "Wystąpił błąd płatności po stronie banku.");
            }
        } catch (err: any) {
            setMessage(err.message || "Błąd komunikacji z serwerem.");
        } finally {
            setIsLoading(false);
        }
    };

    const inputClasses = "w-full bg-[#171717] border border-[#334155] rounded-lg px-3 py-2 text-[13px] text-white placeholder:text-slate-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/50 transition-all shadow-sm";
    const labelClasses = "block text-[9px] font-bold text-[#94a3b8] uppercase tracking-[0.05em] mb-1 ml-0.5";

    return (
        <form onSubmit={handleSubmit} className="space-y-2.5">

            <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-white/5 pb-1.5 mb-2">
                    <h4 className="text-white font-semibold text-xs">Adres Rozliczeniowy</h4>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className={labelClasses}>Imię *</label>
                        <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} className={inputClasses} placeholder="Jan" required />
                    </div>
                    <div>
                        <label className={labelClasses}>Nazwisko *</label>
                        <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} className={inputClasses} placeholder="Kowalski" required />
                    </div>
                </div>

                <div className="flex items-center justify-between pb-0.5 mt-0.5">
                    <button
                        type="button"
                        onClick={() => setShowCompanyFields(!showCompanyFields)}
                        className="text-[10px] text-slate-400 hover:text-white underline decoration-dashed underline-offset-4 transition-colors"
                    >
                        {showCompanyFields ? 'Odznacz fakturę na firmę (ukryj)' : 'Chcę podać dane firmy (faktura na firmę)'}
                    </button>
                </div>

                {showCompanyFields && (
                    <div className="grid grid-cols-2 gap-2 animate-[fade-in_0.3s_ease-out]">
                        <div>
                            <label className={labelClasses}>Nazwa Firmy</label>
                            <input type="text" name="company" value={formData.company} onChange={handleInputChange} className={inputClasses} placeholder="Firma Sp. z o.o." />
                        </div>
                        <div>
                            <label className={labelClasses}>NIP</label>
                            <input type="text" name="nip" value={formData.nip} onChange={handleInputChange} className={inputClasses} placeholder="0000000000" />
                        </div>
                    </div>
                )}

                <div>
                    <label className={labelClasses}>Adres (Ulica i numer) *</label>
                    <input type="text" name="address" value={formData.address} onChange={handleInputChange} className={inputClasses} placeholder="ul. Przykładowa 1/2" required />
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className={labelClasses}>Miejscowość *</label>
                        <input type="text" name="city" value={formData.city} onChange={handleInputChange} className={inputClasses} placeholder="Warszawa" required />
                    </div>
                    <div>
                        <label className={labelClasses}>Kod Pocztowy *</label>
                        <input type="text" name="zip" value={formData.zip} onChange={handleInputChange} className={inputClasses} placeholder="00-001" required />
                    </div>
                </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-white/5">
                <div className="flex items-center justify-between pb-0.5">
                    <h4 className="text-white font-semibold text-xs">Szczegóły Płatności</h4>
                </div>

                <div className="bg-black/20 p-2.5 rounded-xl border border-white/5 backdrop-blur-sm relative z-0 min-h-[220px]">
                    {!isStripeReady && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a0c]/80 z-10 rounded-xl backdrop-blur-md">
                            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-red-500 mb-1.5" />
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest animate-pulse">Ładowanie Terminala...</span>
                        </div>
                    )}
                    <PaymentElement
                        onReady={() => setIsStripeReady(true)}
                        options={{
                            layout: 'tabs',
                            fields: {
                                billingDetails: {
                                    address: {
                                        country: 'never'
                                    }
                                }
                            }
                        }}
                    />
                </div>
            </div>

            {message && (
                <div className="p-2 bg-red-500/10 text-red-500 text-xs font-medium rounded-lg border border-red-500/20 flex items-center gap-1.5">
                    <ShieldCheck size={14} />
                    {message}
                </div>
            )}

            <Button
                type="submit"
                disabled={isLoading || !stripe || !elements}
                isLoading={isLoading}
                className="w-full h-11 mt-1 text-sm shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_30px_rgba(239,68,68,0.5)] bg-accent-red hover:bg-red-500 text-white border-none rounded-xl font-bold tracking-wide transition-all"
            >
                {isLoading ? 'Przetwarzanie...' : 'Zapłać i Aktywuj'}
            </Button>
        </form>
    );
};
