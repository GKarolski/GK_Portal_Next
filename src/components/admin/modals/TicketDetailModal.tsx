"use client";

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/legacy/UIComponents';
import { TicketForm } from '@/components/TicketForm';
import { Ticket, User, Folder, TicketStatus } from '@/types';
import { backend } from '@/services/api';

interface TicketDetailModalProps {
    selectedTicket: Ticket | null;
    onClose: () => void;
    user: User;
    currentMonth: string;
    clients: User[];
    folders: Folder[];
    onTicketsUpdated: (tickets: Ticket[]) => void;
}

export const TicketDetailModal: React.FC<TicketDetailModalProps> = ({
    selectedTicket,
    onClose,
    user,
    currentMonth,
    clients,
    folders: contextFolders,
    onTicketsUpdated
}) => {
    const [availableFolders, setAvailableFolders] = useState<Folder[]>(contextFolders);

    useEffect(() => {
        const loadTicketFolders = async () => {
            if (selectedTicket?.organization_id) {
                try {
                    const f = await backend.getFolders(selectedTicket.organization_id);
                    setAvailableFolders(f);
                } catch (e) {
                    console.error("Failed to load ticket folders", e);
                    setAvailableFolders(contextFolders);
                }
            } else {
                setAvailableFolders(contextFolders);
            }
        };
        loadTicketFolders();
    }, [selectedTicket?.organization_id, selectedTicket?.id, contextFolders]);

    if (!selectedTicket) return null;

    const handleDeleteTicket = async () => {
        if (!confirm("Czy na pewno chcesz usunąć to zgłoszenie?")) return;
        await backend.deleteTicket(selectedTicket.id);
        const tData = await backend.getTickets(user, currentMonth);
        onTicketsUpdated(tData);
        onClose();
    };

    const handleTicketSubmit = async (payload: any) => {
        // Map payload to backend calls
        // In local mock this was multiple calls, in Supabase we can do one update
        await backend.updateTicket(selectedTicket.id, 'all', payload);
        // Note: I need to ensure backend.updateTicket can handle 'all' or mapped fields
        const tData = await backend.getTickets(user, currentMonth);
        onTicketsUpdated(tData);
        onClose();
    };

    return (
        <Modal
            isOpen={!!selectedTicket}
            onClose={onClose}
            title={`Zgłoszenie #${selectedTicket.id.slice(0, 8)}`}
        >
            <div className="flex items-center gap-3 mb-6 p-4 bg-white/5 rounded-2xl border border-white/10">
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-[10px] text-white font-bold">
                    {selectedTicket.clientName?.[0] || '?'}
                </div>
                <div>
                    <p className="text-xs text-slate-400">Klient</p>
                    <p className="text-sm font-bold text-white">{selectedTicket.clientName}</p>
                </div>
            </div>

            <TicketForm
                mode="edit"
                initialData={selectedTicket}
                clients={clients}
                users={[]}
                folders={availableFolders}
                onClose={onClose}
                onDelete={handleDeleteTicket}
                onSubmit={handleTicketSubmit}
            />
        </Modal>
    );
};
