"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Users } from 'lucide-react';
import { backend } from '@/services/api';

const UsageWidget: React.FC = () => {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchStats = useCallback(async () => {
        try {
            const res = await backend.getUsageStats();
            if (res.success) setStats(res.data);
            setLoading(false);
        } catch (error) {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 30000);
        return () => clearInterval(interval);
    }, [fetchStats]);

    if (loading) return <div className="w-full px-4 py-2 text-[10px] text-slate-600 animate-pulse text-center">Ładowanie limitów...</div>;
    if (!stats) return null;

    const { plan, storage, ai, features } = stats;
    const isCrisis = storage.percent > 90 || ai.percent > 90;

    return (
        <div className="w-full bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col gap-2">
            <div className="flex justify-between items-center">
                <span className={`text-[10px] uppercase font-bold tracking-wider ${plan === 'STARTER' ? 'text-slate-500' : 'text-amber-500'}`}>
                    Plan: {plan}
                </span>
                <div className={`text-[10px] flex items-center gap-1 font-medium ${features.smart_context ? 'text-emerald-400' : 'text-slate-600'}`}>
                    <Users size={12} />
                    <span>{features.smart_context ? 'Context: ON' : 'Context: OFF'}</span>
                </div>
            </div>

            <div className="space-y-1">
                <div className="flex justify-between text-[9px] text-slate-400 font-medium">
                    <span>Środowisko</span>
                    <span>{storage.used_mb}MB / {storage.limit_mb}MB</span>
                </div>
                <div className="h-1 w-full bg-black/40 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-500 ${storage.percent > 90 ? 'bg-red-500' : 'bg-emerald-500'}`}
                        style={{ width: `${Math.min(storage.percent, 100)}%` }}
                    />
                </div>
            </div>

            <div className="space-y-1">
                <div className="flex justify-between text-[9px] text-slate-400 font-medium">
                    <span>AI Tokens</span>
                    <span>{ai.used_tokens > 1000 ? (ai.used_tokens / 1000).toFixed(1) + 'k' : ai.used_tokens} / {(ai.limit_tokens / 1000).toFixed(0)}k</span>
                </div>
                <div className="h-1 w-full bg-black/40 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-500 ${ai.percent > 90 ? 'bg-red-500' : 'bg-purple-500'}`}
                        style={{ width: `${Math.min(ai.percent, 100)}%` }}
                    />
                </div>
            </div>

            {isCrisis && (
                <button className="w-full py-1 mt-1 text-[9px] font-bold text-white bg-red-600 hover:bg-red-500 rounded uppercase tracking-wide transition-colors">
                    Zwiększ limit
                </button>
            )}
        </div>
    );
};

export default UsageWidget;
