"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { User, Ticket, Folder, TicketStatus, TicketCategory } from '@/types';
import { backend } from '@/services/api';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { DashboardHeader } from '@/components/admin/DashboardHeader';
import { TicketListView } from '@/components/admin/TicketListView';
import { AISidebar } from '@/components/AISidebar';
import { AdminDashboardOverview } from '@/components/admin/AdminDashboardOverview';
import { TicketDetailModal } from '@/components/admin/modals/TicketDetailModal';
import { AdminSettingsModal } from '@/components/admin/modals/AdminSettingsModal';
import { FolderManagerModal } from '@/components/admin/modals/FolderManagerModal';
import { InviteClientModal, EditClientModal, ClientCardModal } from '@/components/admin/modals/ClientManagementModals';
import { InvoiceGeneratorModal } from '@/components/admin/modals/InvoiceGeneratorModal';
import { TicketForm } from '@/components/TicketForm';
import { Modal } from '@/components/legacy/UIComponents';
import { KnowledgeBase } from '@/components/KnowledgeBase';

interface AdminPortalProps {
    user: User;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ user }) => {
    // Basic UI State
    const [viewMode, setViewMode] = useState<'dashboard' | 'list' | 'board' | 'calendar' | 'finance' | 'timeline' | 'knowledge'>('dashboard');
    const [selectedClientId, setSelectedClientId] = useState<string>('ALL');
    const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
    const [categoryFilter, setCategoryFilter] = useState<'ALL' | TicketCategory>('ALL');
    const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7));
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(false);
    const [sortMode, setSortMode] = useState<'DATE' | 'PRIORITY' | 'STATUS'>('DATE');

    // Data State
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [clients, setClients] = useState<User[]>([]);
    const [folders, setFolders] = useState<Folder[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Modal States
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isFolderManagerOpen, setIsFolderManagerOpen] = useState(false);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [isEditClientOpen, setIsEditClientOpen] = useState<User | null>(null);
    const [isClientCardOpen, setIsClientCardOpen] = useState<User | null>(null);
    const [isCreateTicketOpen, setIsCreateTicketOpen] = useState(false);
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

    useEffect(() => {
        loadInitialData();
    }, [user, currentMonth]);

    const loadInitialData = async () => {
        setIsLoading(true);
        try {
            const [tData, cData] = await Promise.all([
                backend.getTickets(user, currentMonth),
                backend.getClients(user.organizationId!)
            ]);
            setTickets(tData);
            setClients(cData);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (selectedClientId !== 'ALL') {
            backend.getFolders(selectedClientId).then(setFolders).catch(console.error);
            // Don't auto-switch viewMode here to allow users to stay in dashboard if they want
            // Actually, legacy auto-switches to 'list'
            if (viewMode === 'dashboard') setViewMode('list');
        } else {
            setFolders([]);
            setActiveFolderId(null);
            setViewMode('dashboard');
        }
    }, [selectedClientId]);

    const filteredTickets = useMemo(() => {
        let filtered = tickets;
        if (selectedClientId !== 'ALL') {
            filtered = filtered.filter(t => t.organization_id === selectedClientId || t.clientId === selectedClientId);
        }
        if (activeFolderId) {
            filtered = filtered.filter(t => t.folder_id === activeFolderId);
        }
        if (categoryFilter !== 'ALL') {
            filtered = filtered.filter(t => t.category === categoryFilter);
        }
        return filtered;
    }, [tickets, selectedClientId, activeFolderId, categoryFilter]);

    const handleStatusUpdate = async (ticketId: string, status: TicketStatus) => {
        await backend.updateTicketStatus(ticketId, status);
        const tData = await backend.getTickets(user, currentMonth);
        setTickets(tData);
    };

    const handleCreateTicket = async (payload: any, clientId: string) => {
        const client = clients.find(c => c.id === clientId);
        if (!client) return;
        await backend.createTicket(client, payload);
        const tData = await backend.getTickets(user, currentMonth);
        setTickets(tData);
        setIsCreateTicketOpen(false);
    };

    return (
        <div className="flex h-screen bg-gk-950 text-slate-200 font-sans overflow-hidden selection:bg-accent-red/20 selection:text-accent-red">
            {/* Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/10 rounded-full blur-[120px]" />
            </div>

            <AdminSidebar
                clients={clients}
                selectedClientId={selectedClientId}
                setSelectedClientId={setSelectedClientId}
                folders={folders}
                activeFolderId={activeFolderId}
                setActiveFolderId={setActiveFolderId}
                onManageFolders={() => setIsFolderManagerOpen(true)}
                onAddFolder={() => setIsFolderManagerOpen(true)}
                onEditFolder={(id) => { setActiveFolderId(id); setIsFolderManagerOpen(true); }}
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen}
                onInviteClient={() => setIsInviteModalOpen(true)}
                onOpenSettings={() => setIsSettingsOpen(true)}
                onAddMember={(orgId, companyName) => { }}
                onOpenClientCard={(client) => setIsClientCardOpen(client)}
                onEditClient={(client) => setIsEditClientOpen(client)}
                onDeleteClient={async (id) => { if (confirm("Usunąć klienta?")) await backend.deleteTicket(id); loadInitialData(); }}
            />

            {/* Main Layout Container - Flex Row to support Side-by-Side AI */}
            <div className="flex-1 flex relative z-10 overflow-hidden">

                {/* Content Column */}
                <div className="flex-1 flex flex-col overflow-hidden min-w-0 transition-all duration-300">
                    <DashboardHeader
                        selectedClientId={selectedClientId}
                        clients={clients}
                        isSidebarOpen={isSidebarOpen}
                        setIsSidebarOpen={setIsSidebarOpen}
                        currentMonth={currentMonth}
                        setCurrentMonth={setCurrentMonth}
                        sortMode={sortMode}
                        setSortMode={setSortMode}
                        viewMode={viewMode}
                        setViewMode={setViewMode}
                        onOpenCreateModal={() => setIsCreateTicketOpen(true)}
                        categoryFilter={categoryFilter}
                        setCategoryFilter={setCategoryFilter as any}
                        isAdmin={true}
                        onToggleAi={() => setIsAiSidebarOpen(!isAiSidebarOpen)}
                        isAiSidebarOpen={isAiSidebarOpen}
                    />

                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                        {viewMode === 'knowledge' ? (
                            <KnowledgeBase user={user} clients={clients} selectedClientId={selectedClientId} />
                        ) : selectedClientId === 'ALL' && viewMode === 'dashboard' ? (
                            <AdminDashboardOverview
                                tickets={tickets}
                                clients={clients}
                                onNavigateToClient={(clientId) => { setSelectedClientId(clientId); setViewMode('list'); }}
                                onOpenTicket={(ticket) => setSelectedTicket(ticket)}
                            />
                        ) : (
                            <TicketListView
                                viewMode={viewMode as any}
                                selectedClientId={selectedClientId}
                                clients={clients}
                                activeFolderId={activeFolderId}
                                setActiveFolderId={setActiveFolderId}
                                folders={folders}
                                setIsFolderManagerOpen={setIsFolderManagerOpen}
                                setEditingFolder={() => { }}
                                categoryFilter={categoryFilter}
                                setCategoryFilter={setCategoryFilter as any}
                                filteredTickets={filteredTickets}
                                ticketsForFinance={tickets}
                                user={user}
                                currentMonth={currentMonth}
                                onTicketsUpdated={setTickets}
                                onOpenTicketDetail={setSelectedTicket}
                                onStatusUpdate={handleStatusUpdate}
                                onOpenInvoiceGenerator={() => setIsInvoiceModalOpen(true)}
                            />
                        )}
                    </div>
                </div>

                {/* AI Sidebar - Push Mode */}
                <AISidebar
                    isOpen={isAiSidebarOpen}
                    onClose={() => setIsAiSidebarOpen(false)}
                    variant="push"
                    contextData={{
                        tickets: tickets,
                        clients: clients,
                        revenue: tickets.filter(t => t.status === TicketStatus.DONE).reduce((acc, t) => acc + Number(t.price || 0), 0),
                        month: currentMonth,
                        selectedTicket: selectedTicket,
                        activeClientId: selectedClientId
                    }}
                    onAction={(action) => {
                        if (action.type === 'REFRESH_DATA') loadInitialData();
                    }}
                />
            </div>

            {/* MODALS */}
            <TicketDetailModal
                selectedTicket={selectedTicket}
                onClose={() => setSelectedTicket(null)}
                user={user}
                currentMonth={currentMonth}
                clients={clients}
                folders={folders}
                onTicketsUpdated={setTickets}
            />

            <AdminSettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
            />

            <FolderManagerModal
                isOpen={isFolderManagerOpen}
                onClose={() => setIsFolderManagerOpen(false)}
                selectedClientId={selectedClientId}
                folders={folders}
                setFolders={setFolders}
                clients={clients}
            />

            <InviteClientModal
                isOpen={isInviteModalOpen}
                onClose={() => setIsInviteModalOpen(false)}
                inviteOrganizationId={selectedClientId === 'ALL' ? null : selectedClientId}
                inviteCompany={clients.find(c => c.id === selectedClientId)?.companyName || ''}
            />

            <EditClientModal
                client={isEditClientOpen}
                onClose={() => setIsEditClientOpen(null)}
                onSave={loadInitialData}
            />

            <ClientCardModal
                client={isClientCardOpen}
                onClose={() => setIsClientCardOpen(null)}
                allClients={clients}
                onEdit={setIsEditClientOpen}
                onDelete={async (id) => { /* handle delete */ }}
            />

            <InvoiceGeneratorModal
                tickets={filteredTickets.filter(t => t.status === TicketStatus.DONE)}
                isOpen={isInvoiceModalOpen}
                onClose={() => setIsInvoiceModalOpen(false)}
            />

            <Modal
                isOpen={isCreateTicketOpen}
                onClose={() => setIsCreateTicketOpen(false)}
                title="Nowe Zgłoszenie"
            >
                <TicketForm
                    mode="create"
                    clients={clients}
                    users={[]}
                    onClose={() => setIsCreateTicketOpen(false)}
                    onSubmit={handleCreateTicket}
                    folders={folders}
                />
            </Modal>
        </div>
    );
};
