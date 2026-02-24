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

    // Profile State
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

    // Security State
    const [email, setEmail] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
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
            setCurrentPassword('');
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

    const handleSaveSecurity = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (newPassword && newPassword !== confirmPassword) {
            setError("Nowe hasła nie są identyczne.");
            return;
        }
        setIsLoading(true);
        try {
            // Use Supabase auth to update email/password
            const { createClient } = await import('@supabase/supabase-js');
            const supabase = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            );
            const updateData: any = {};
            if (email !== settings.contactEmail) updateData.email = email;
            if (newPassword) updateData.password = newPassword;

            if (Object.keys(updateData).length > 0) {
                const { error: updateError } = await supabase.auth.updateUser(updateData);
                if (updateError) throw updateError;
            }

            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 2000);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            setError(err.message || "Błąd aktualizacji zabezpieczeń.");
        }
        setIsLoading(false);
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

    const toggleSystem = (key: string) => {
        setSettings(prev => ({
            ...prev,
            system: {
                ...prev.system,
                [key]: !prev.system?.[key]
            }
        }));
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Ustawienia Administratora">
            <div className="flex flex-col h-[650px]">
                {/* Tabs */}
                <div className="flex border-b border-white/10 mb-6 space-x-1">
                    <button onClick={() => setActiveTab('PROFILE')} className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'PROFILE' ? 'border-accent-blue text-white' : 'border-transparent text-slate-400 hover:text-white'}`}>Profil</button>
                    <button onClick={() => setActiveTab('SYSTEM')} className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'SYSTEM' ? 'border-accent-blue text-white' : 'border-transparent text-slate-400 hover:text-white'}`}>System & Powiadomienia</button>
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
                                    <label htmlFor="admin-avatar-upload" className="block w-24 h-24 rounded-full bg-white/5 border-2 border-dashed border-white/20 hover:border-accent-blue hover:bg-white/10 overflow-hidden relative transition-all shadow-xl">
                                        {avatarPreview ? (
                                            <img src={avatarPreview} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-500"><User size={24} /></div>
                                        )}
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity">Zmień</div>
                                    </label>
                                </div>
                            </div>

                            <Input label="Imię i Nazwisko (Widoczne dla Klienta)" value={settings.contactName} onChange={e => setSettings({ ...settings, contactName: e.target.value })} />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input label="Email Kontaktowy" value={settings.contactEmail} onChange={e => setSettings({ ...settings, contactEmail: e.target.value })} type="email" />
                                <Input label="Telefon" value={settings.contactPhone} onChange={e => setSettings({ ...settings, contactPhone: e.target.value })} />
                            </div>
                            <TextArea label="Treść Powiadomienia w Pop-upie (Dla Klienta)" value={settings.popupNote} onChange={e => setSettings({ ...settings, popupNote: e.target.value })} placeholder="np. W dniach 1-3 maja biuro nieczynne." />
                            <div className="flex justify-end pt-4 border-t border-white/10">
                                <Button type="submit" isLoading={isLoading}><Save size={16} className="mr-2" /> Zapisz Profil</Button>
                            </div>
                        </form>
                    )}

                    {activeTab === 'SYSTEM' && (
                        <div className="space-y-8">
                            {/* Powiadomienia */}
                            <div>
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><div className="w-1 h-6 bg-accent-blue rounded-full"></div> Powiadomienia Email</h3>
                                <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-sm font-bold text-slate-200">Nowe Zgłoszenie</div>
                                            <div className="text-xs text-slate-500">Otrzymuj email gdy klient utworzy nowe zgłoszenie.</div>
                                        </div>
                                        <Switch
                                            checked={settings.notifications?.emailOnNewTicket !== false}
                                            onChange={() => toggleNotification('emailOnNewTicket')}
                                        />
                                    </div>

                                    {settings.notifications?.emailOnNewTicket !== false && (
                                        <div className="flex items-center justify-between pl-4 border-l-2 border-white/10">
                                            <div>
                                                <div className="text-sm font-bold text-slate-200">Tylko Pilne (HIGH / URGENT)</div>
                                                <div className="text-xs text-slate-500">Ignoruj zgłoszenia o niższym priorytecie.</div>
                                            </div>
                                            <Switch
                                                checked={settings.notifications?.emailOnNewTicketHighPriorityOnly === true}
                                                onChange={() => toggleNotification('emailOnNewTicketHighPriorityOnly')}
                                            />
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                        <div>
                                            <div className="text-sm font-bold text-slate-200">Odpowiedź Klienta (Komentarz)</div>
                                            <div className="text-xs text-slate-500">Powiadom gdy klient doda komentarz do zgłoszenia.</div>
                                        </div>
                                        <Switch
                                            checked={settings.notifications?.emailOnReply !== false}
                                            onChange={() => toggleNotification('emailOnReply')}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* System */}
                            <div>
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><div className="w-1 h-6 bg-purple-500 rounded-full"></div> Konfiguracja Systemu</h3>
                                <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-4">
                                    <div className="flex items-center justify-between opacity-50 cursor-not-allowed" title="Funkcja planowana">
                                        <div>
                                            <div className="text-sm font-bold text-slate-200">Tryb Konserwacji (Maintenance)</div>
                                            <div className="text-xs text-slate-500">Zablokuj dostęp dla klientów (tylko Admin widzi portal).</div>
                                        </div>
                                        <Switch
                                            checked={settings.system?.maintenanceMode === true}
                                            onChange={() => { }}
                                            disabled={true}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-white/5 opacity-50 cursor-not-allowed">
                                        <div>
                                            <div className="text-sm font-bold text-slate-200">Kopie Zapasowe</div>
                                            <div className="text-xs text-slate-500">Automatyczne daily backup bazy danych.</div>
                                        </div>
                                        <div className="text-xs text-purple-400 font-bold border border-purple-500/30 px-2 py-1 rounded">Wkrótce</div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4 border-t border-white/10">
                                <Button onClick={handleSave} isLoading={isLoading}><Save size={16} className="mr-2" /> Zapisz Ustawienia Systemowe</Button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'SECURITY' && (
                        <form onSubmit={handleSaveSecurity} className="space-y-8">
                            <div>
                                <h3 className="text-lg font-bold text-accent-red mb-4 flex items-center gap-2"><div className="w-1 h-6 bg-accent-red rounded-full"></div> Zmiana Danych Logowania</h3>
                                <div className="bg-red-500/5 p-6 rounded-xl border border-red-500/10 space-y-6">
                                    <Input label="Aktualne Hasło (Wymagane do zmian)" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} type="password" required className="bg-slate-900/50 border-red-900/30 focus:border-red-500" />

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-red-500/10">
                                        <Input label="Nowy Email Login (Opcjonalnie)" value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="Zostaw puste jeśli bez zmian" />
                                        <div className="space-y-4">
                                            <Input label="Nowe Hasło" value={newPassword} onChange={e => setNewPassword(e.target.value)} type="password" placeholder="Zostaw puste jeśli bez zmian" />
                                            <Input label="Potwierdź Nowe Hasło" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} type="password" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {error && <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-lg text-sm font-bold text-center animate-pulse">{error}</div>}

                            <div className="flex justify-end pt-4 border-t border-white/10">
                                <Button type="submit" variant="primary" isLoading={isLoading} className="w-full md:w-auto hover:bg-red-600 bg-red-500 border-none"><Lock size={16} className="mr-2" /> Zaktualizuj Bezpieczeństwo</Button>
                            </div>
                        </form>
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
