"use client";

import React, { useState, useEffect } from 'react';
import {
    User,
    Ticket,
    DeviceType,
    TicketPriority,
    TicketCategory,
    MarketingPlatform,
    TicketStatus,
    Attachment,
    AdminSettings,
    NewTicketPayload
} from '@/types';
import { backend } from '@/services/api';
import {
    Button,
    Input,
    TextArea,
    Select,
    Card,
    StatusBadge,
    Modal,
    PriorityBadge,
    CategoryBadge,
    ImageViewer
} from '@/components/legacy/UIComponents';
import {
    Plus,
    LayoutGrid,
    List as ListIcon,
    Bug,
    Megaphone,
    Zap,
    ArrowLeft,
    ArrowRight,
    History,
    LayoutList,
    CheckCircle,
    Paperclip,
    ExternalLink,
    X,
    Trash2,
    Calendar,
    Menu,
    Inbox,
    Users
} from 'lucide-react';
import { getCurrentMonthISO } from '@/utils/dateUtils';
import { DashboardHeader } from '@/components/admin/DashboardHeader';
import { TicketListView } from '@/components/admin/TicketListView';
import { WizardSelectionCard } from '@/components/shared/WizardSelectionCard';
import { ClientSidebar } from '@/components/client/ClientSidebar';

interface ClientPortalProps {
    user: User;
}

const ClientPortal: React.FC<ClientPortalProps> = ({ user }) => {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState<string>('list');
    const [sortMode, setSortMode] = useState<string>('DATE');
    const [currentMonth, setCurrentMonth] = useState<string>(getCurrentMonthISO());
    const [networkError, setNetworkError] = useState<string | null>(null);

    // SIDEBAR & TEAM STATE
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [orgUsers, setOrgUsers] = useState<User[]>([]);
    const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

    // WIZARD STATE
    const [wizardStep, setWizardStep] = useState(1);
    const [selectedCategory, setSelectedCategory] = useState<TicketCategory | null>(null);
    const [categoryFilter, setCategoryFilter] = useState<'ALL' | TicketCategory>('ALL');

    // FORM FIELDS
    const [subject, setSubject] = useState('');
    const [url, setUrl] = useState('');
    const [featureLink, setFeatureLink] = useState('');
    const [errorDate, setErrorDate] = useState('');
    const [device, setDevice] = useState<DeviceType>(DeviceType.DESKTOP);
    const [platform, setPlatform] = useState<MarketingPlatform>(MarketingPlatform.META);
    const [budget, setBudget] = useState('');
    const [priority, setPriority] = useState<TicketPriority>(TicketPriority.NORMAL);
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Files
    const [files, setFiles] = useState<File[]>([]);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    // Header Popup
    const [isContactPopupOpen, setIsContactPopupOpen] = useState(false);
    const [adminSettings, setAdminSettings] = useState<AdminSettings | null>(null);

    useEffect(() => {
        loadData();
    }, [currentMonth]);

    const loadData = async (silent = false) => {
        if (!silent) setIsLoading(true);
        setNetworkError(null);
        try {
            const settings = await backend.getAdminSettings();
            setAdminSettings(settings);
            const [tData, uData] = await Promise.all([
                backend.getTickets(user, currentMonth),
                user.organizationId ? backend.getOrgUsers(user.organizationId) : Promise.resolve([])
            ]);
            setTickets(tData);
            setOrgUsers(uData);
        } catch (e) {
            console.error("Failed to load data", e);
            setNetworkError("Nie udało się pobrać danych.");
        } finally {
            setIsLoading(false);
        }
    };

    const openTicketDetail = (ticket: Ticket) => {
        setSelectedTicket(ticket);
        setIsDetailOpen(true);
    };

    const resetForm = () => {
        setWizardStep(1);
        setSelectedCategory(null);
        setSubject('');
        setUrl('');
        setFeatureLink('');
        setErrorDate('');
        setDescription('');
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
        if (!selectedCategory) return;
        setIsSubmitting(true);
        try {
            // TODO: Implementation of file upload via Supabase Storage
            const attachments: Attachment[] = [];

            const payload: NewTicketPayload = {
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
            await backend.createTicket(user, payload);
            await loadData(true);
            resetForm();
        } catch (e) {
            console.error("Failed to create ticket", e);
            alert("Wystąpił błąd.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredTickets = tickets.filter(t => {
        if (categoryFilter !== 'ALL' && t.category !== categoryFilter) return false;
        if (selectedMemberId && (t as any).created_by_user_id !== selectedMemberId) return false;
        return true;
    }).sort((a, b) => {
        if (sortMode === 'PRIORITY') {
            const map = { [TicketPriority.URGENT]: 4, [TicketPriority.HIGH]: 3, [TicketPriority.NORMAL]: 2, [TicketPriority.LOW]: 1 };
            return (map[b.priority] || 2) - (map[a.priority] || 2);
        }
        if (sortMode === 'STATUS') return a.status.localeCompare(b.status);
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return (
        <div className="flex bg-gk-950 overflow-hidden h-screen w-full">
            <ClientSidebar
                orgName={user.companyName || 'Twoja Firma'}
                orgUsers={orgUsers.filter(u => u.id !== user.id)}
                selectedMemberId={selectedMemberId}
                setSelectedMemberId={setSelectedMemberId}
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen}
                onOpenProfile={() => setIsContactPopupOpen(true)}
                logo={user.organizationLogo}
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
                    setCategoryFilter={setCategoryFilter as any}
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
                            {networkError ? (
                                <>
                                    <h3 className="text-xl font-bold text-red-400 mb-2">Błąd połączenia</h3>
                                    <p className="text-slate-400 mb-4">{networkError}</p>
                                    <Button onClick={() => loadData()}>Spróbuj ponownie</Button>
                                </>
                            ) : (
                                <>
                                    <h3 className="text-xl font-bold text-white mb-2">Brak pasujących zgłoszeń</h3>
                                    <p className="text-slate-400 mb-4 text-sm">Zmień filtry lub dodaj nowe zadanie.</p>
                                    <Button onClick={() => setIsModalOpen(true)}>Dodaj nowe zadanie</Button>
                                </>
                            )}
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
                            setCategoryFilter={setCategoryFilter as any}
                            filteredTickets={filteredTickets}
                            user={user}
                            currentMonth={currentMonth}
                            onTicketsUpdated={(t) => setTickets(t as any)}
                            onOpenTicketDetail={openTicketDetail}
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
                        <WizardSelectionCard icon={Bug} title="Błąd / Awaria" desc="Naprawa błędu" active={selectedCategory === TicketCategory.BUG} onClick={() => setSelectedCategory(TicketCategory.BUG)} />
                        <WizardSelectionCard icon={Megaphone} title="Marketing" desc="Kampania / Ads" active={selectedCategory === TicketCategory.MARKETING} onClick={() => setSelectedCategory(TicketCategory.MARKETING)} />
                        <WizardSelectionCard icon={Zap} title="Modyfikacja" desc="Rozwój strony" active={selectedCategory === TicketCategory.FEATURE} onClick={() => setSelectedCategory(TicketCategory.FEATURE)} />
                        <div className="md:col-span-3 flex justify-end mt-6">
                            <Button disabled={!selectedCategory} onClick={() => setWizardStep(2)}>
                                Dalej <ArrowRight size={16} className="ml-2" />
                            </Button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleCreateTicket} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="flex items-center gap-2 mb-4">
                            <button type="button" onClick={() => setWizardStep(1)} className="text-slate-500 hover:text-white text-sm flex items-center gap-1">
                                <ArrowLeft size={14} /> Wróć
                            </button>
                            <CategoryBadge category={selectedCategory!} />
                        </div>

                        <Input label="Temat Zgłoszenia" value={subject} onChange={e => setSubject(e.target.value)} required />

                        {selectedCategory === TicketCategory.BUG && (
                            <div className="space-y-4 bg-white/5 p-4 rounded-xl border border-white/5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Input label="Link do strony z błędem" value={url} onChange={e => setUrl(e.target.value)} required />
                                    <Select
                                        label="Urządzenie"
                                        value={device}
                                        onChange={e => setDevice(e.target.value as DeviceType)}
                                        options={[
                                            ...Object.values(DeviceType).map(t => ({ value: t, label: t })),
                                            { value: 'ALL', label: 'Wszystkie / Nie dotyczy' }
                                        ]}
                                    />
                                </div>
                                <Input type="datetime-local" label="Kiedy zauważono błąd?" value={errorDate} onChange={e => setErrorDate(e.target.value)} />
                            </div>
                        )}

                        {selectedCategory === TicketCategory.MARKETING && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/5 p-4 rounded-xl border border-white/5">
                                <Select
                                    label="Platforma"
                                    value={platform}
                                    onChange={e => setPlatform(e.target.value as MarketingPlatform)}
                                    options={Object.values(MarketingPlatform).map(t => ({ value: t, label: t }))}
                                />
                                <Input
                                    label="Budżet (Opcjonalnie)"
                                    value={budget}
                                    onChange={e => { const val = e.target.value; if (/^\d*\.?\d*$/.test(val)) setBudget(val); }}
                                    placeholder="Np. 5000"
                                />
                            </div>
                        )}

                        {selectedCategory === TicketCategory.FEATURE && (
                            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                <Input label="Link (Inspiracja / Przykład)" value={featureLink} onChange={e => setFeatureLink(e.target.value)} placeholder="https://..." />
                            </div>
                        )}

                        <Select label="Priorytet" value={priority} onChange={e => setPriority(e.target.value as TicketPriority)} options={[{ value: TicketPriority.LOW, label: 'Niski' }, { value: TicketPriority.NORMAL, label: 'Normalny' }, { value: TicketPriority.HIGH, label: 'Wysoki' }, { value: TicketPriority.URGENT, label: 'PILNY' }]} />
                        <TextArea label="Opis Szczegółowy" rows={5} value={description} onChange={e => setDescription(e.target.value)} required />

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
                                                <img src={URL.createObjectURL(file)} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={() => setPreviewImage(URL.createObjectURL(file))} />
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
                            <Button type="submit" isLoading={isSubmitting}>Wyślij Zgłoszenie</Button>
                        </div>
                    </form>
                )}
            </Modal>

            {/* DETAIL MODAL */}
            <Modal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} title={selectedTicket ? `Szczegóły: ${selectedTicket.subject}` : 'Szczegóły'}>
                {selectedTicket && (
                    <div className="space-y-6">
                        <div className="bg-white/5 p-4 rounded-xl border border-white/5 mb-6 space-y-4 opacity-80">
                            <div className="flex justify-between">
                                <CategoryBadge category={selectedTicket.category} />
                                <StatusBadge status={selectedTicket.status} />
                            </div>
                            <Input label="Temat" value={selectedTicket.subject} disabled />
                            {selectedTicket.url && <Input label="Link" value={selectedTicket.url} disabled />}
                            {selectedTicket.platform && <Input label="Platforma" value={selectedTicket.platform} disabled />}
                            {Number(selectedTicket.price) > 0 && (
                                <div className="mt-2 pt-2 border-t border-white/10 text-right">
                                    <span className="text-xs text-slate-400 uppercase tracking-widest mr-2">Wycena:</span>
                                    <span className="text-xl font-bold text-emerald-400">{selectedTicket.price} PLN</span>
                                </div>
                            )}
                        </div>

                        {selectedTicket.public_notes && (
                            <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 p-5 rounded-2xl border border-indigo-500/30 mb-6 shadow-lg shadow-indigo-500/10">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] text-white font-bold">GK</div>
                                    <span className="text-xs font-bold text-indigo-300 uppercase tracking-widest">Wiadomość od Administracji</span>
                                </div>
                                <p className="text-white text-sm whitespace-pre-wrap leading-relaxed italic">{selectedTicket.public_notes}</p>
                            </div>
                        )}

                        <div className="bg-white/5 p-5 rounded-2xl border border-white/5 space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block">Opis zgłoszenia</label>
                            <p className="text-slate-200 text-sm whitespace-pre-wrap leading-relaxed">{selectedTicket.description}</p>
                        </div>

                        {selectedTicket.attachments && selectedTicket.attachments.length > 0 && (
                            <div className="bg-blue-900/10 p-4 rounded-xl border border-blue-500/10 mt-4">
                                <h4 className="text-xs font-bold text-blue-300 mb-2 flex gap-2"><Paperclip size={14} /> Załączniki</h4>
                                <div className="flex flex-wrap gap-2">
                                    {selectedTicket.attachments.map((f, i) => (
                                        <div key={i} onClick={() => { if (f.url.match(/\.(jpeg|jpg|gif|png|webp)$/i)) setPreviewImage(f.url); else window.open(f.url, '_blank'); }} className="text-xs bg-black/40 px-3 py-1.5 rounded hover:text-white text-blue-200 flex items-center gap-1 cursor-pointer hover:bg-white/10 transition-colors">
                                            <ExternalLink size={10} /> {f.name}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {selectedTicket.subtasks && selectedTicket.subtasks.length > 0 && (
                            <div className="mt-4">
                                <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2"><CheckCircle size={16} className="text-emerald-500" /> Postęp prac</h3>
                                <div className="bg-gk-900 rounded-xl border border-white/10 p-2 space-y-1">
                                    {selectedTicket.subtasks.map(s => (
                                        <div key={s.id} className="flex items-center gap-3 p-2">
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

            {/* Contact Info Modal */}
            <Modal isOpen={isContactPopupOpen} onClose={() => setIsContactPopupOpen(false)} title="Wizytówka Administratora">
                <div className="space-y-6 text-center py-6 px-4">
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-b from-accent-red/20 to-transparent blur-3xl rounded-full w-32 h-32 mx-auto -z-10" />
                        {adminSettings?.avatar ? (
                            <div className="w-28 h-28 rounded-full mx-auto mb-6 shadow-2xl shadow-accent-red/30 overflow-hidden border-4 border-gk-900 ring-2 ring-white/10">
                                <img src={adminSettings.avatar} className="w-full h-full object-cover" />
                            </div>
                        ) : (
                            <div className="w-24 h-24 bg-gradient-to-br from-accent-red to-purple-600 rounded-full mx-auto flex items-center justify-center mb-6 shadow-xl shadow-accent-red/20 border-2 border-white/10">
                                <span className="text-3xl font-black text-white">GK</span>
                            </div>
                        )}
                    </div>

                    <div className="space-y-1">
                        <h2 className="text-2xl font-black text-white tracking-tight">{adminSettings?.contactName || 'Grzegorz Karola'}</h2>
                        <p className="text-accent-red text-xs font-bold uppercase tracking-[0.2em] opacity-80">Główny Administrator</p>
                    </div>

                    {adminSettings?.popupNote && (
                        <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-2xl text-yellow-200 text-sm mb-6 flex items-start gap-3 text-left">
                            <Megaphone className="shrink-0 mt-0.5" size={16} />
                            <p className="leading-relaxed">{adminSettings.popupNote}</p>
                        </div>
                    )}

                    <div className="space-y-3 pt-4">
                        <a href={`mailto:${adminSettings?.contactEmail}`} className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all group">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                                <Inbox size={20} />
                            </div>
                            <div className="text-left">
                                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Email</p>
                                <p className="text-slate-200 font-bold break-all">{adminSettings?.contactEmail || 'kontakt@gkdigital.pl'}</p>
                            </div>
                        </a>

                        <a href={`tel:${adminSettings?.contactPhone}`} className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all group">
                            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-400 group-hover:scale-110 transition-transform">
                                <Users size={20} />
                            </div>
                            <div className="text-left">
                                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Telefon</p>
                                <p className="text-slate-200 font-bold">{adminSettings?.contactPhone || '+48 000 000 000'}</p>
                            </div>
                        </a>
                    </div>

                    <Button variant="secondary" onClick={() => setIsContactPopupOpen(false)} className="mt-8 w-full justify-center h-12 rounded-2xl font-bold uppercase tracking-widest text-xs border border-white/5">
                        Zamknij Wizytówkę
                    </Button>
                </div>
            </Modal>

            {previewImage && <ImageViewer src={previewImage} onClose={() => setPreviewImage(null)} />}
        </div>
    );
};

export default ClientPortal;
