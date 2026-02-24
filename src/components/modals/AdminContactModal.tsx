"use client";

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { AdminSettings } from '@/types';
import { Inbox, Users, Megaphone } from 'lucide-react';

interface AdminContactModalProps {
    isOpen: boolean;
    onClose: () => void;
    settings: AdminSettings | null;
}

export const AdminContactModal: React.FC<AdminContactModalProps> = ({ isOpen, onClose, settings }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Wizytówka Administratora">
            <div className="space-y-6 text-center py-6 px-4">
                <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-b from-accent-red/20 to-transparent blur-3xl rounded-full w-32 h-32 mx-auto -z-10" />
                    {settings?.avatar ? (
                        <div className="w-28 h-28 rounded-full mx-auto mb-6 shadow-2xl shadow-accent-red/30 overflow-hidden border-4 border-gk-900 ring-2 ring-white/10">
                            <img src={settings.avatar} className="w-full h-full object-cover" alt="Admin Avatar" />
                        </div>
                    ) : (
                        <div className="w-24 h-24 bg-gradient-to-br from-accent-red to-purple-600 rounded-full mx-auto flex items-center justify-center mb-6 shadow-xl shadow-accent-red/20 border-2 border-white/10">
                            <span className="text-3xl font-black text-white">GK</span>
                        </div>
                    )}
                </div>

                <div className="space-y-1">
                    <h2 className="text-2xl font-black text-white tracking-tight">{settings?.contactName || 'Grzegorz Karola'}</h2>
                    <p className="text-accent-red text-xs font-bold uppercase tracking-[0.2em] opacity-80">Główny Administrator</p>
                </div>

                {settings?.popupNote && (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-2xl text-yellow-200 text-sm mb-6 flex items-start gap-3 text-left">
                        <Megaphone className="shrink-0 mt-0.5" size={16} />
                        <p className="leading-relaxed">{settings.popupNote}</p>
                    </div>
                )}

                <div className="space-y-3 pt-4">
                    <a href={`mailto:${settings?.contactEmail}`} className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all group">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                            <Inbox size={20} />
                        </div>
                        <div className="text-left">
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Email</p>
                            <p className="text-slate-200 font-bold break-all">{settings?.contactEmail || 'kontakt@gkdigital.pl'}</p>
                        </div>
                    </a>

                    <a href={`tel:${settings?.contactPhone}`} className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all group">
                        <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-400 group-hover:scale-110 transition-transform">
                            <Users size={20} />
                        </div>
                        <div className="text-left">
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Telefon</p>
                            <p className="text-slate-200 font-bold">{settings?.contactPhone || '+48 000 000 000'}</p>
                        </div>
                    </a>
                </div>

                <Button variant="secondary" onClick={onClose} className="mt-8 w-full justify-center h-12 rounded-2xl font-bold uppercase tracking-widest text-xs border border-white/5">Zamknij Wizytówkę</Button>
            </div>
        </Modal>
    );
};
