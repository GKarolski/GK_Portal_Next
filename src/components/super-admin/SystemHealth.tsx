"use client";

import React from 'react';
import { Activity, Server, Database, Globe, Cpu } from 'lucide-react';
import { Card } from '@/components/ui/Card';

export default function SystemHealth() {
    const metrics = [
        { label: 'Użycie CPU', value: '14%', icon: <Cpu />, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
        { label: 'Zużycie Pamięci RAM', value: '4.2 GB / 16 GB', icon: <Server />, color: 'text-blue-400', bg: 'bg-blue-400/10' },
        { label: 'Połączenia Bazy Danych', value: '82 / 500', icon: <Database />, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
        { label: 'Ruch Sieciowy', value: '124 MB/s', icon: <Globe />, color: 'text-amber-400', bg: 'bg-amber-400/10' }
    ];

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2"><Activity size={20} className="text-accent-red" /> Kondycja Systemu</h2>
                <p className="text-slate-500 text-sm">Monitoruj kluczowe parametry infrastruktury serwerowej w czasie rzeczywistym.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
                {metrics.map((m, i) => (
                    <Card key={i} className="bg-black/40 border-white/5 p-6 border-t-2" style={{ borderTopColor: m.color.replace('text-', '') }}>
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${m.bg} ${m.color}`}>
                            {m.icon}
                        </div>
                        <h4 className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">{m.label}</h4>
                        <div className="text-2xl font-black text-white">{m.value}</div>
                    </Card>
                ))}
            </div>

            <div className="mt-8 bg-white/5 border border-white/5 rounded-3xl p-8">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-white">Logi Systemowe (Ostatnie 24h)</h3>
                    <div className="flex items-center gap-2 text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        Wszystkie systemy operacyjne
                    </div>
                </div>
                <div className="space-y-3 font-mono text-xs text-slate-400 bg-black/50 p-6 rounded-2xl h-64 overflow-y-auto">
                    {[
                        '[INFO] Auto-backup instrukcji ukończony poprawnie (czas: 14.2s)',
                        '[INFO] Skalowanie klastra bazy danych: +1 węzeł aktywny',
                        '[WARN] Zwiększone opóźnienia w API OpenAI (region: eu-west-1)',
                        '[INFO] Nowy deployment aplikacji klienckiej v2.2.14',
                        '[INFO] Wyczyszczono cache platformy (odzyskane: 2.1 GB)',
                        '[INFO] Synchronizacja Stripe Webhooks OK',
                        '[ERROR] Błąd połączenia w węźle pocztowym SMTP - Retry 1/3',
                        '[INFO] Węzeł SMTP połączony poprawnie'
                    ].map((log, idx) => (
                        <div key={idx} className={`py-1 border-b border-white/5 last:border-0 ${log.includes('[ERROR]') ? 'text-red-400 font-bold' : log.includes('[WARN]') ? 'text-amber-400' : ''}`}>
                            <span className="opacity-50 mr-2">{new Date(Date.now() - idx * 3600000).toISOString().replace('T', ' ').slice(0, 19)}</span>
                            {log}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
