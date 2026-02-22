"use client";

import React, { useState, useEffect } from 'react';
import { Modal, Input, Button, TextArea } from '@/components/legacy/UIComponents';
import { backend } from '@/services/api';
import { Save, CheckCircle, Shield, User, Lock } from 'lucide-react';
import { AdminSettings } from '@/types';

const Switch = ({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) => (
    <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        disabled={disabled}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-offset-2 focus:ring-offset-slate-900 ${checked ? 'bg-green-500' : 'bg-slate-700'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
        <span
            className={`${checked ? 'translate-x-[22px]' : 'translate-x-1'
                } inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out`}
        />
    </button>
);

export const AdminSettingsModal: React.FC<{ isOpen: boolean, onClose: () => void }> = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState<'PROFILE' | 'SYSTEM' | 'SECURITY'>('PROFILE');
    const [settings, setSettings] = useState<AdminSettings & { notifications?: any, system?: any }>({
        contactName: '',
        contactEmail: '',
        contactPhone: '',
        popupNote: '',
        avatar: '',
        notifications: {
            emailOnNewTicket: true,
            emailOnNewTicketHighPriorityOnly: false,
            emailOnReply: true
        },
        system: {
            maintenanceMode: false
        }
    });

    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [email, setEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            loadSettings();
            setIsSaved(false);
            setError(null);
            setEmail('');
            setNewPassword('');
            setConfirmPassword('');
            setAvatarPreview(null);
        }
    }, [isOpen]);

    const loadSettings = async () => {
        setIsLoading(true);
        const data = await backend.getAdminSettings();
        if (data) {
            setSettings(prev => ({ ...prev, ...data }));
            setAvatarPreview(data.avatar || null);
            setEmail(data.contactEmail || '');
        }
        setIsLoading(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        const payload = { ...settings, avatar: avatarPreview || undefined };
        await backend.updateAdminSettings(payload);
        setIsLoading(false);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    const toggleNotification = (key: string) => {
        setSettings(prev => ({
            ...prev,
            notifications: {
                ...prev.notifications,
                [key]: !prev.notifications?.[key]
            }
        }));
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Ustawienia Administratora">
            <div className="flex flex-col h-[600px]">
                <div className="flex border-b border-white/10 mb-6 space-x-1">
                    <button onClick={() => setActiveTab('PROFILE')} className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'PROFILE' ? 'border-accent-red text-white' : 'border-transparent text-slate-400 hover:text-white'}`}>Profil</button>
                    <button onClick={() => setActiveTab('SYSTEM')} className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'SYSTEM' ? 'border-accent-red text-white' : 'border-transparent text-slate-400 hover:text-white'}`}>System</button>
                    <button onClick={() => setActiveTab('SECURITY')} className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'SECURITY' ? 'border-accent-red text-white' : 'border-transparent text-slate-400 hover:text-white'}`}>Bezpieczeństwo</button>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    {activeTab === 'PROFILE' && (
                        <form onSubmit={handleSave} className="space-y-6">
                            <h3 className="text-lg font-bold text-white mb-4">Profil Administratora</h3>
                            <div className="flex justify-center mb-6">
                                <div className="relative group cursor-pointer">
                                    <input type="file" onChange={e => {
                                        if (e.target.files?.[0]) {
                                            const reader = new FileReader();
                                            reader.readAsDataURL(e.target.files[0]);
                                            reader.onload = () => setAvatarPreview(reader.result as string);
                                        }
                                    }} className="hidden" id="admin-avatar-upload" />
                                    <label htmlFor="admin-avatar-upload" className="block w-24 h-24 rounded-full bg-white/5 border-2 border-dashed border-white/20 hover:border-accent-red overflow-hidden relative transition-all shadow-xl">
                                        {avatarPreview ? <img src={avatarPreview} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-500"><User size={24} /></div>}
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity">Zmień</div>
                                    </label>
                                </div>
                            </div>
                            <Input label="Imię i Nazwisko" value={settings.contactName} onChange={e => setSettings({ ...settings, contactName: e.target.value })} />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input label="Email" value={settings.contactEmail} onChange={e => setSettings({ ...settings, contactEmail: e.target.value })} />
                                <Input label="Telefon" value={settings.contactPhone} onChange={e => setSettings({ ...settings, contactPhone: e.target.value })} />
                            </div>
                            <TextArea label="Notatka Pop-up" value={settings.popupNote} onChange={e => setSettings({ ...settings, popupNote: e.target.value })} />
                            <div className="flex justify-end pt-4 border-t border-white/10">
                                <Button type="submit" isLoading={isLoading}><Save size={16} className="mr-2" /> Zapisz Profil</Button>
                            </div>
                        </form>
                    )}

                    {activeTab === 'SYSTEM' && (
                        <div className="space-y-8">
                            <div>
                                <h3 className="text-lg font-bold text-white mb-4">Powiadomienia Email</h3>
                                <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-sm font-bold text-slate-200">Nowe Zgłoszenie</div>
                                            <div className="text-xs text-slate-500">Otrzymuj email gdy klient utworzy nowe zgłoszenie.</div>
                                        </div>
                                        <Switch checked={settings.notifications?.emailOnNewTicket !== false} onChange={() => toggleNotification('emailOnNewTicket')} />
                                    </div>
                                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                                        <div>
                                            <div className="text-sm font-bold text-slate-200">Odpowiedź Klienta</div>
                                            <div className="text-xs text-slate-500">Powiadom gdy klient doda komentarz.</div>
                                        </div>
                                        <Switch checked={settings.notifications?.emailOnReply !== false} onChange={() => toggleNotification('emailOnReply')} />
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end pt-4 border-t border-white/10">
                                <Button onClick={handleSave} isLoading={isLoading}><Save size={16} className="mr-2" /> Zapisz Ustawienia Systemowe</Button>
                            </div>
                        </div>
                    )}
                </div>

                {isSaved && (
                    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-2 rounded-full shadow-lg flex items-center animate-in fade-in slide-in-from-bottom-2 z-50">
                        <CheckCircle size={16} className="mr-2" /> Zapisano pomyślnie!
                    </div>
                )}
            </div>
        </Modal>
    );
};
