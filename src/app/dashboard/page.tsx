"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Ticket, TicketStatus, TicketPriority, TicketCategory, DeviceType, MarketingPlatform, Attachment, AdminSettings } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input, TextArea } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Modal, ImageViewer } from '@/components/ui/Modal';
import { Select } from '@/components/legacy/UIComponents';
import { Badge, StatusBadge, CategoryBadge, PriorityBadge } from '@/components/ui/Badge';
import { ClientSidebar } from '@/components/client/ClientSidebar';
import { AdminPortal } from '@/components/portal/AdminPortal';
import { DashboardHeader } from '@/components/admin/DashboardHeader';
import { TicketListView } from '@/components/admin/TicketListView';
import { WizardSelectionCard } from '@/components/shared/WizardSelectionCard';
import { AdminContactModal } from '@/components/modals/AdminContactModal';
import {
    Plus, Bug, Megaphone, Zap, ArrowLeft, ArrowRight,
    Paperclip, Trash2, LayoutGrid, Inbox, Users, ExternalLink, CheckCircle
} from 'lucide-react';
import { getCurrentMonthISO } from '@/utils/dateUtils';

import { useAuth } from '@/contexts/AuthContext';
import { useTickets } from '@/hooks/useTickets';
import { createTicket } from '@/actions/tickets';
import { supabase } from '@/lib/supabase';
import { backend } from '@/services/api';

export default function ClientDashboardPage() {
    const router = useRouter();
    const { user, isLoading: isAuthLoading } = useAuth();
    const { tickets, setTickets, isLoading: isTicketsLoading, fetchTickets } = useTickets(user?.organizationId);

    // UI State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [viewMode, setViewMode] = useState<string>('list');
    const [sortMode, setSortMode] = useState<string>('DATE');
    const [currentMonth, setCurrentMonth] = useState<string>(getCurrentMonthISO());
    const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    // Sidebar & Team
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
    const [orgUsers, setOrgUsers] = useState<User[]>([]);

    // Admin Contact
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);
    const [adminSettings, setAdminSettings] = useState<AdminSettings | null>(null);

    // Wizard
    const [wizardStep, setWizardStep] = useState(1);
    const [selectedCategory, setSelectedCategory] = useState<TicketCategory | null>(null);

    // Form
    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');
    const [url, setUrl] = useState('');
    const [featureLink, setFeatureLink] = useState('');
    const [errorDate, setErrorDate] = useState('');
    const [device, setDevice] = useState<DeviceType>(DeviceType.DESKTOP);
    const [platform, setPlatform] = useState<MarketingPlatform>(MarketingPlatform.META);
    const [budget, setBudget] = useState('');
    const [priority, setPriority] = useState<TicketPriority>(TicketPriority.NORMAL);
    const [files, setFiles] = useState<File[]>([]);
    const [isCreating, setIsCreating] = useState(false);

    // Load Data (Polling + Initial)
    const loadTeamData = async () => {
        if (user?.organizationId) {
            try {
                const [uData, settings] = await Promise.all([
                    backend.getOrgUsers(user.organizationId),
                    backend.getAdminSettings()
                ]);
                setOrgUsers(uData);
                setAdminSettings(settings);
            } catch (e) {
                console.error("Failed to load team/settings", e);
            }
        }
    };

    useEffect(() => {
        loadTeamData();
    }, [user?.organizationId]);

    // Polling for tickets (30s)
    useEffect(() => {
        const interval = setInterval(() => {
            if (user?.organizationId) fetchTickets();
        }, 30 * 1000);
        return () => clearInterval(interval);
    }, [user?.organizationId]);

    const resetForm = () => {
        setWizardStep(1);
        setSelectedCategory(null);
        setSubject('');
        setDescription('');
        setUrl('');
        setFeatureLink('');
        setErrorDate('');
        setDevice(DeviceType.DESKTOP);
        setPlatform(MarketingPlatform.META);
        setBudget('');
        setPriority(TicketPriority.NORMAL);
        setFiles([]);
        setIsModalOpen(false);
    };

    const handleRemoveFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleCreateTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !user.organizationId || !selectedCategory) return;

        setIsCreating(true);
        try {
            // Upload files first if any
            let attachments: Attachment[] = [];
            for (const file of files) {
                // Simplified upload logic - in production this would use a real storage bucket
                // For now we'll simulate it or use a base64 approach if storage isn't ready
                // Assuming backend.uploadClientDocument might work or similar
                try {
                    const { data: uploadData, error: uploadError } = await supabase.storage
                        .from('ticket-attachments')
                        .upload(`${user.organizationId}/${Date.now()}_${file.name}`, file);

                    if (!uploadError) {
                        const { data: { publicUrl } } = supabase.storage
                            .from('ticket-attachments')
                            .getPublicUrl(uploadData.path);

                        attachments.push({ name: file.name, url: publicUrl });
                    }
                } catch (err) {
                    console.error("File upload failed", err);
                }
            }

            const payload = {
                category: selectedCategory,
                subject,
                description,
                priority,
                url: selectedCategory === TicketCategory.BUG ? url : (selectedCategory === TicketCategory.FEATURE ? featureLink : undefined),
                errorDate: selectedCategory === TicketCategory.BUG ? errorDate : undefined,
                deviceType: selectedCategory === TicketCategory.BUG ? device : undefined,
                platform: selectedCategory === TicketCategory.MARKETING ? platform : undefined,
                budget: selectedCategory === TicketCategory.MARKETING ? budget : undefined,
                attachments
            };

            const result = await backend.createTicket(user, payload);

            if (result.success) {
                resetForm();
                fetchTickets();
            } else {
                alert("Błąd dodawania zgłoszenia");
            }
        } catch (err) {
            console.error("Failed to create ticket", err);
            alert("Wystąpił błąd");
        } finally {
            setIsCreating(false);
        }
    };

    const filteredTickets = tickets.filter(t => {
        if (categoryFilter !== 'ALL' && t.category !== categoryFilter) return false;
        if (selectedMemberId && t.clientId !== selectedMemberId) return false;
        return true;
    });

    const isLoading = isAuthLoading || isTicketsLoading;

    // Guard: Redirect to checkout if no organization
    const [isCheckingOrg, setIsCheckingOrg] = useState(false);

    useEffect(() => {
        const checkOrgStatus = async () => {
            if (!isAuthLoading && user && !user.organizationId) {
                setIsCheckingOrg(true);
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('organization_id')
                    .eq('id', user.id)
                    .single();

                if (profile?.organization_id) {
                    window.location.reload();
                    return;
                }
                router.push('/checkout');
            }
        };
        checkOrgStatus();
    }, [user, isAuthLoading, router]);

    if (isAuthLoading || isCheckingOrg) return (
        <div className="h-screen bg-gk-950 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-accent-red"></div>
        </div>
    );

    if (!user) return (
        <div className="h-screen bg-gk-950 flex items-center justify-center text-slate-400">
            Przekierowywanie do logowania...
        </div>
    );

    if (user.role === 'ADMIN') {
        return <AdminPortal user={user} />;
    }

    return (
        <div className="flex bg-gk-950 overflow-hidden h-screen text-slate-100 selection:bg-accent-red/30">
            <ClientSidebar
                orgName={user.companyName || 'Twoja Firma'}
                orgUsers={orgUsers.filter(u => u.id !== user.id)}
                selectedMemberId={selectedMemberId}
                setSelectedMemberId={setSelectedMemberId}
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen}
                onOpenProfile={() => setIsContactModalOpen(true)}
                logo={user.organizationLogo || orgUsers.find(u => u.roleInOrg === 'OWNER')?.avatar}
            />

            <div className="flex-1 flex flex-col min-w-0">
                <DashboardHeader
                    selectedClientId={user.id}
                    clients={[user]}
                    isSidebarOpen={isSidebarOpen}
                    setIsSidebarOpen={setIsSidebarOpen}
                    currentMonth={currentMonth}
                    setCurrentMonth={setCurrentMonth}
                    sortMode={sortMode}
                    setSortMode={setSortMode}
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                    onOpenCreateModal={() => setIsModalOpen(true)}
                    categoryFilter={categoryFilter}
                    setCategoryFilter={setCategoryFilter}
                    isAdmin={false}
                    showMenuButton={true}
                />

                <div className="flex-1 overflow-hidden">
                    {isLoading ? (
                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                            {[1, 2, 3].map(i => <div key={i} className="h-64 bg-white/5 rounded-3xl" />)}
                        </div>
                    ) : filteredTickets.length === 0 ? (
                        <div className="m-8 text-center py-24 border border-dashed border-white/10 rounded-3xl bg-white/5 flex flex-col items-center">
                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 text-slate-600">
                                <LayoutGrid size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Brak aktywnych zgłoszeń</h3>
                            <p className="text-slate-400 mb-4 text-sm">Twoja lista jest pusta. Dodaj nowe zadanie, aby zacząć.</p>
                            <Button onClick={() => setIsModalOpen(true)} className="px-8 h-12">Dodaj nowe zadanie</Button>
                        </div>
                    ) : (
                        <TicketListView
                            viewMode={viewMode}
                            selectedClientId={user.id}
                            clients={[user]}
                            activeFolderId={null}
                            setActiveFolderId={() => { }}
                            folders={[]}
                            setIsFolderManagerOpen={() => { }}
                            setEditingFolder={() => { }}
                            categoryFilter={categoryFilter}
                            setCategoryFilter={setCategoryFilter}
                            filteredTickets={filteredTickets}
                            user={user}
                            currentMonth={currentMonth}
                            onTicketsUpdated={(t) => setTickets(t)}
                            onOpenTicketDetail={(t) => { setSelectedTicket(t); setIsDetailOpen(true); }}
                            onStatusUpdate={() => { }}
                            onOpenInvoiceGenerator={() => { }}
                            isAdmin={false}
                        />
                    )}
                </div>
            </div>

            {/* CREATE MODAL */}
            <Modal isOpen={isModalOpen} onClose={resetForm} title={wizardStep === 1 ? "Wybierz Typ Zgłoszenia" : "Szczegóły Zadania"}>
                {wizardStep === 1 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                        <WizardSelectionCard icon={Bug} title="Błąd / Awaria" desc="Nagła usterka wymagająca naprawy" active={selectedCategory === TicketCategory.BUG} onClick={() => setSelectedCategory(TicketCategory.BUG)} />
                        <WizardSelectionCard icon={Megaphone} title="Marketing" desc="Ustawienie kampanii lub drobne zmiany" active={selectedCategory === TicketCategory.MARKETING} onClick={() => setSelectedCategory(TicketCategory.MARKETING)} />
                        <WizardSelectionCard icon={Zap} title="Modyfikacja" desc="Rozwój funkcjonalności lub zmiana wizualna" active={selectedCategory === TicketCategory.FEATURE} onClick={() => setSelectedCategory(TicketCategory.FEATURE)} />
                        <div className="md:col-span-3 flex justify-end mt-6">
                            <Button disabled={!selectedCategory} onClick={() => setWizardStep(2)} className="h-12 px-8">
                                Dalej <ArrowRight size={16} className="ml-2" />
                            </Button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleCreateTicket} className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex items-center gap-2 mb-4">
                            <button type="button" onClick={() => setWizardStep(1)} className="text-slate-500 hover:text-white text-sm flex items-center gap-1 transition-colors">
                                <ArrowLeft size={14} /> Wróć
                            </button>
                            <CategoryBadge category={selectedCategory!} />
                        </div>

                        <Input label="Temat Zgłoszenia" value={subject} onChange={e => setSubject(e.target.value)} required />

                        {selectedCategory === TicketCategory.BUG && (
                            <div className="space-y-4 bg-white/5 p-4 rounded-xl border border-white/5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Input label="Link do strony z błędem" value={url} onChange={e => setUrl(e.target.value)} required />
                                    <Select label="Urządzenie" value={device} onChange={e => setDevice(e.target.value as DeviceType)} options={Object.values(DeviceType).map(t => ({ value: t, label: t }))} />
                                </div>
                                <Input type="datetime-local" label="Kiedy zauważono błąd?" value={errorDate} onChange={e => setErrorDate(e.target.value)} />
                            </div>
                        )}

                        {selectedCategory === TicketCategory.MARKETING && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/5 p-4 rounded-xl border border-white/5">
                                <Select label="Platforma" value={platform} onChange={e => setPlatform(e.target.value as MarketingPlatform)} options={Object.values(MarketingPlatform).map(t => ({ value: t, label: t }))} />
                                <Input label="Budżet (Opcjonalnie)" value={budget} onChange={e => setBudget(e.target.value)} placeholder="Np. 5000" />
                            </div>
                        )}

                        {selectedCategory === TicketCategory.FEATURE && (
                            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                <Input label="Link (Inspiracja / Przykład)" value={featureLink} onChange={e => setFeatureLink(e.target.value)} placeholder="https://..." />
                            </div>
                        )}

                        <Select label="Priorytet" value={priority} onChange={e => setPriority(e.target.value as TicketPriority)} options={[{ value: TicketPriority.LOW, label: 'Niski' }, { value: TicketPriority.NORMAL, label: 'Normalny' }, { value: TicketPriority.HIGH, label: 'Wysoki' }, { value: TicketPriority.URGENT, label: 'PILNY' }]} />

                        <TextArea label="Opis Szczegółowy" rows={5} value={description} onChange={e => setDescription(e.target.value)} placeholder="Opisz dokładnie co trzeba zrobić..." required />

                        <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                            <label className="text-xs text-slate-400 mb-2 block font-bold uppercase flex justify-between">
                                <span>Zrzuty ekranu / Pliki (Opcjonalnie)</span>
                                <span className="text-accent-red cursor-pointer hover:underline" onClick={() => setFiles([])}>Wyczyść</span>
                            </label>
                            <input type="file" id="file-upload" multiple onChange={e => { if (e.target.files) setFiles(prev => [...prev, ...Array.from(e.target.files!)]); }} className="hidden" />
                            <label htmlFor="file-upload" className="mb-4 flex items-center justify-center w-full h-24 border-2 border-dashed border-white/10 rounded-xl cursor-pointer hover:border-white/30 hover:bg-white/5 transition-colors">
                                <div className="flex flex-col items-center gap-2 text-slate-500">
                                    <Plus size={24} />
                                    <span className="text-xs">Kliknij aby dodać pliki</span>
                                </div>
                            </label>

                            {files.length > 0 && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {files.map((file, idx) => (
                                        <div key={idx} className="relative aspect-square bg-black/40 rounded-lg overflow-hidden group border border-white/10">
                                            {file.type.startsWith('image/') ? (
                                                <img src={URL.createObjectURL(file)} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={() => setPreviewImage(URL.createObjectURL(file))} alt="Podgląd" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-500"><Paperclip size={24} /></div>
                                            )}
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <button type="button" onClick={() => handleRemoveFile(idx)} className="p-2 bg-red-500 rounded-full text-white hover:bg-red-600"><Trash2 size={16} /></button>
                                            </div>
                                            <div className="absolute bottom-0 inset-x-0 bg-black/80 px-2 py-1 text-[10px] text-slate-300 truncate">{file.name}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end pt-4 border-t border-white/10">
                            <Button type="submit" isLoading={isCreating} className="h-12 px-10">Wyślij Zgłoszenie</Button>
                        </div>
                    </form>
                )}
            </Modal>

            {/* DETAIL MODAL */}
            <Modal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} title={selectedTicket ? `Szczegóły: ${selectedTicket.subject}` : 'Szczegóły'}>
                {selectedTicket && (
                    <div className="space-y-6">
                        <div className="bg-white/5 p-4 rounded-xl border border-white/5 mb-6 space-y-4 opacity-80 shadow-inner">
                            <div className="flex justify-between items-center">
                                <CategoryBadge category={selectedTicket.category} />
                                <StatusBadge status={selectedTicket.status} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input label="Temat (Podgląd)" value={selectedTicket.subject} disabled />
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Priorytet</label>
                                    <PriorityBadge priority={selectedTicket.priority} />
                                </div>
                            </div>
                            {selectedTicket.url && <Input label="Link" value={selectedTicket.url} disabled />}
                            {selectedTicket.platform && <Input label="Platforma" value={selectedTicket.platform} disabled />}
                            {Number(selectedTicket.price) > 0 && (
                                <div className="mt-2 pt-4 border-t border-white/10 text-right">
                                    <span className="text-xs text-slate-400 uppercase tracking-widest mr-3">Wycena:</span>
                                    <span className="text-2xl font-black text-emerald-500">{selectedTicket.price} PLN</span>
                                </div>
                            )}
                        </div>

                        {selectedTicket.publicNotes && (
                            <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 p-5 rounded-2xl border border-indigo-500/30 mb-6 shadow-lg shadow-indigo-500/10">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] text-white font-bold">GK</div>
                                    <span className="text-xs font-bold text-indigo-300 uppercase tracking-widest font-mono">Wiadomość od Administracji</span>
                                </div>
                                <p className="text-white text-sm whitespace-pre-wrap leading-relaxed italic">{selectedTicket.publicNotes}</p>
                            </div>
                        )}

                        <div className="bg-white/5 p-5 rounded-2xl border border-white/5 space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block font-mono">Opis zgłoszenia</label>
                            <p className="text-slate-200 text-sm whitespace-pre-wrap leading-relaxed">{selectedTicket.description}</p>
                        </div>

                        {selectedTicket.attachments && selectedTicket.attachments.length > 0 && (
                            <div className="bg-gk-blue-900/10 p-4 rounded-xl border border-gk-blue-500/10 mt-4">
                                <h4 className="text-xs font-bold text-gk-blue-300 mb-3 flex items-center gap-2 uppercase tracking-widest font-mono"><Paperclip size={14} /> Załączniki</h4>
                                <div className="flex flex-wrap gap-2">
                                    {selectedTicket.attachments.map((f, i) => (
                                        <div key={i} onClick={() => { if (f.url.match(/\.(jpeg|jpg|gif|png|webp)$/i)) setPreviewImage(f.url); else window.open(f.url, '_blank'); }} className="text-[10px] bg-black/40 px-3 py-2 rounded-xl hover:text-white text-gk-blue-200 flex items-center gap-2 cursor-pointer hover:bg-white/10 transition-all border border-white/5">
                                            <ExternalLink size={10} /> {f.name}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {selectedTicket.subtasks && selectedTicket.subtasks.length > 0 && (
                            <div className="mt-4">
                                <h3 className="text-xs font-bold text-white mb-3 flex items-center gap-2 uppercase tracking-widest font-mono"><CheckCircle size={16} className="text-emerald-500" /> Postęp prac</h3>
                                <div className="bg-black/20 rounded-2xl border border-white/10 p-2 space-y-1">
                                    {selectedTicket.subtasks.map(s => (
                                        <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors">
                                            {s.isCompleted ? <CheckCircle size={16} className="text-emerald-500" /> : <div className="w-4 h-4 rounded-full border-2 border-slate-600" />}
                                            <span className={`text-sm ${s.isCompleted ? 'text-slate-500 line-through' : 'text-slate-300'}`}>{s.title}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            <AdminContactModal
                isOpen={isContactModalOpen}
                onClose={() => setIsContactModalOpen(false)}
                settings={adminSettings}
            />

            {previewImage && <ImageViewer src={previewImage} onClose={() => setPreviewImage(null)} />}
        </div>
    );
}
