"use client";

import React, { useState } from 'react';
import { ShieldCheck, Users, Activity, Megaphone, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import TenantsList from '@/components/super-admin/TenantsList';
import SystemHealth from '@/components/super-admin/SystemHealth';
import Broadcasts from '@/components/super-admin/Broadcasts';
import { Button } from '@/components/ui/Button';

export default function SuperAdminPage() {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'tenants' | 'health' | 'broadcasts'>('dashboard');
    const router = useRouter();

    const tabs = [
        { id: 'dashboard', label: 'Przegląd', icon: <ShieldCheck size={18} /> },
        { id: 'tenants', label: 'Lista Najemców (Instancje)', icon: <Users size={18} /> },
        { id: 'health', label: 'Kondycja Systemu', icon: <Activity size={18} /> },
        { id: 'broadcasts', label: 'Powiadomienia Masowe', icon: <Megaphone size={18} /> },
    ] as const;

    return (
        <div className="min-h-screen bg-black text-slate-200 font-sans flex flex-col pt-6 pb-12 px-8 overflow-y-auto w-full selection:bg-accent-red/20">
            <div className="max-w-7xl mx-auto w-full space-y-8 animate-in fade-in duration-500">
                <div className="flex items-center justify-between border-b border-white/10 pb-6 mb-8 mt-2">
                    <div>
                        <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
                            <span className="p-2 bg-accent-red/10 rounded-xl text-accent-red"><ShieldCheck size={32} /></span>
                            Super Admin <span className="text-accent-red">Centrum</span>
                        </h1>
                        <p className="text-slate-500 font-mono mt-2 ml-14">Główna konsola zarządzania infrastrukturą GK_Portal</p>
                    </div>
                    <Button variant="secondary" onClick={() => router.push('/dashboard')} className="flex items-center gap-2">
                        <ArrowLeft size={16} /> Powrót do aplikacji
                    </Button>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Navigation Sidebar */}
                    <div className="w-full lg:w-64 space-y-2 shrink-0">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-bold tracking-wider text-sm ${activeTab === tab.id
                                        ? 'bg-accent-red/10 text-accent-red border border-accent-red/20 shadow-inner'
                                        : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'
                                    }`}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 min-w-0">
                        <div className="bg-white/5 border border-white/5 rounded-3xl p-8 shadow-2xl backdrop-blur-3xl min-h-[600px]">
                            {activeTab === 'dashboard' && (
                                <div className="space-y-6">
                                    <h2 className="text-2xl font-bold text-white mb-6">Witaj w konsoli nadrzędnej</h2>
                                    <p className="text-slate-400">
                                        Moduł Super Admin pozwala zarządzać globalnymi instancjami, planami subskrypcji oraz kondycją chmury.
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                                        <div className="bg-black/40 p-6 rounded-2xl border border-white/5 text-center">
                                            <div className="text-4xl font-black text-emerald-400 mb-2">12</div>
                                            <div className="text-xs uppercase tracking-widest font-bold text-slate-500">Aktywnych Instancji</div>
                                        </div>
                                        <div className="bg-black/40 p-6 rounded-2xl border border-white/5 text-center">
                                            <div className="text-4xl font-black text-amber-400 mb-2">99.9%</div>
                                            <div className="text-xs uppercase tracking-widest font-bold text-slate-500">Uptime Systemu</div>
                                        </div>
                                        <div className="bg-black/40 p-6 rounded-2xl border border-white/5 text-center">
                                            <div className="text-4xl font-black text-blue-400 mb-2">142k</div>
                                            <div className="text-xs uppercase tracking-widest font-bold text-slate-500">Przetworzone Tokeny AI</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'tenants' && <TenantsList />}
                            {activeTab === 'health' && <SystemHealth />}
                            {activeTab === 'broadcasts' && <Broadcasts />}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
