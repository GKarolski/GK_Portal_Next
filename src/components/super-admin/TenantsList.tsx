"use client";

import React, { useState, useEffect } from 'react';
import { backend } from '@/services/api';
import { User } from '@/types';
import { Layers, Search, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/Input';

export default function TenantsList() {
    const [tenants, setTenants] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const fetchTenants = async () => {
            try {
                // Fetch all clients (which serve as orgs/tenants in this mock architecture)
                const data = await backend.getClients();
                setTenants(data);
            } catch (err) {
                console.error("Failed to load tenants", err);
            } finally {
                setLoading(false);
            }
        };
        fetchTenants();
    }, []);

    const filtered = tenants.filter(t =>
        t.companyName?.toLowerCase().includes(search.toLowerCase()) ||
        t.name.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return <div className="text-slate-400 p-8 text-center animate-pulse">Ładowanie najemców...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2"><Layers size={20} className="text-accent-red" /> Lista Najemców</h2>
                    <p className="text-slate-500 text-sm">Zarządzaj wszystkimi organizacjami w systemie.</p>
                </div>
                <div className="w-64">
                    <Input
                        placeholder="Szukaj firmy..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-black/20 border border-white/5 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-sm text-slate-300">
                    <thead className="bg-white/5 text-xs uppercase font-bold text-slate-500 tracking-wider">
                        <tr>
                            <th className="px-6 py-4">Firma</th>
                            <th className="px-6 py-4">Właściciel</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Akcje</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filtered.map(tenant => (
                            <tr key={tenant.id} className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4 font-bold text-white flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs">
                                        {tenant.companyName?.[0] || tenant.name[0]}
                                    </div>
                                    {tenant.companyName || 'Brak nazwy'}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-slate-200">{tenant.name}</div>
                                    <div className="text-xs text-slate-500">{tenant.email}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] uppercase font-bold tracking-widest">
                                        Aktywny
                                    </span>
                                </td>
                                <td className="px-6 py-4 flex justify-end gap-2 text-slate-500">
                                    <button className="p-2 hover:bg-white/10 hover:text-white rounded-lg transition-colors"><Edit2 size={16} /></button>
                                    <button className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-colors"><Trash2 size={16} /></button>
                                </td>
                            </tr>
                        ))}
                        {filtered.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                                    Nie znaleziono najemców.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
