import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Ticket, TicketStatus, TicketPriority, TicketCategory, DeviceType, MarketingPlatform } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input, TextArea } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Modal, ImageViewer } from '@/components/ui/Modal';
import { Badge, StatusBadge, CategoryBadge, PriorityBadge } from '@/components/ui/Badge';
import { ClientSidebar } from '@/components/client/ClientSidebar';
import { DashboardHeader } from '@/components/admin/DashboardHeader';
import { TicketListView } from '@/components/admin/TicketListView';
import { WizardSelectionCard } from '@/components/shared/WizardSelectionCard';
import {
    Plus, Bug, Megaphone, Zap, ArrowLeft, ArrowRight,
    Paperclip, Trash2, LayoutGrid, Inbox, Users
} from 'lucide-react';
import { getCurrentMonthISO } from '@/utils/dateUtils';

import { useAuth } from '@/contexts/AuthContext';
import { useTickets } from '@/hooks/useTickets';
import { createTicket } from '@/actions/tickets';

export default function ClientDashboardPage() {
    const { user, isLoading: isAuthLoading } = useAuth();
    const { tickets, isLoading: isTicketsLoading, updateTicketStatus, fetchTickets } = useTickets(user?.organizationId);

    // UI State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [viewMode, setViewMode] = useState<string>('list');
    const [sortMode, setSortMode] = useState<string>('DATE');
    const [currentMonth, setCurrentMonth] = useState<string>(getCurrentMonthISO());
    const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

    // Sidebar & Team
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

    // Wizard
    const [wizardStep, setWizardStep] = useState(1);
    const [selectedCategory, setSelectedCategory] = useState<TicketCategory | null>(null);

    // Form
    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<TicketPriority>(TicketPriority.NORMAL);
    const [isCreating, setIsCreating] = useState(false);

    const resetForm = () => {
        setWizardStep(1);
        setSelectedCategory(null);
        setSubject('');
        setDescription('');
        setPriority(TicketPriority.NORMAL);
        setIsModalOpen(false);
    };

    const handleCreateTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !user.organizationId || !selectedCategory) return;

        setIsCreating(true);
        try {
            const result = await createTicket({
                userId: user.id,
                organizationId: user.organizationId,
                clientName: user.name,
                subject,
                category: selectedCategory,
                description,
                priority,
            });

            if (result.success) {
                resetForm();
                fetchTickets();
            } else {
                alert("Błąd: " + result.error);
            }
        } finally {
            setIsCreating(false);
        }
    };

    const filteredTickets = tickets.filter(t => {
        if (categoryFilter !== 'ALL' && t.category !== categoryFilter) return false;
        // TODO: Add month filtering logic if tickets have a billingMonth field
        return true;
    });

    const isLoading = isAuthLoading || isTicketsLoading;

    useEffect(() => {
        if (!isAuthLoading && user && !user.organizationId) {
            router.push('/checkout');
        }
    }, [user, isAuthLoading, router]);

    if (isAuthLoading) return (
        <div className="h-screen bg-gk-950 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-accent-red"></div>
        </div>
    );

    if (!user) return (
        <div className="h-screen bg-gk-950 flex items-center justify-center text-slate-400">
            Przekierowywanie do logowania...
        </div>
    );

    return (
        <div className="flex bg-gk-950 overflow-hidden h-screen text-slate-100 selection:bg-accent-red/30">
            <ClientSidebar
                orgName={user.companyName || 'Twoja Firma'}
                orgUsers={[]}
                selectedMemberId={selectedMemberId}
                setSelectedMemberId={setSelectedMemberId}
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen}
                logo={undefined}
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
                    isAdmin={user.role === 'ADMIN'}
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
                            onTicketsUpdated={() => { }}
                            onOpenTicketDetail={(t) => { setSelectedTicket(t); setIsDetailOpen(true); }}
                            onStatusUpdate={() => { }}
                            onOpenInvoiceGenerator={() => { }}
                            isAdmin={user.role === 'ADMIN'}
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

                        <Input label="Temat Zgłoszenia" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Krótki, opisowy tytuł..." required />

                        <TextArea label="Opis Szczegółowy" rows={5} value={description} onChange={e => setDescription(e.target.value)} placeholder="Opisz dokładnie co trzeba zrobić..." required />

                        <div className="flex justify-end pt-4 border-t border-white/10">
                            <Button type="submit" isLoading={isCreating} className="h-12 px-10">Wyślij Zgłoszenie</Button>
                        </div>
                    </form>
                )}
            </Modal>
        </div>
    );
}
