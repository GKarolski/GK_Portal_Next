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
    // Phase 86: Robust Folder Fetching
    const [availableFolders, setAvailableFolders] = useState<Folder[]>(contextFolders);

    useEffect(() => {
        const loadTicketFolders = async () => {
            const orgId = selectedTicket?.organization_id || selectedTicket?.organizationId;
            if (orgId) {
                try {
                    const f = await backend.getFolders(orgId);
                    setAvailableFolders(f);
                } catch (e) {
                    console.error("Failed to load ticket folders", e);
                    setAvailableFolders(contextFolders); // Fallback
                }
            } else {
                setAvailableFolders(contextFolders);
            }
        };

        loadTicketFolders();
    }, [selectedTicket?.organization_id, selectedTicket?.id]);

    if (!selectedTicket) return null;

    const handleDeleteTicket = async () => {
        if (!selectedTicket || !confirm("Czy na pewno chcesz usunąć to zgłoszenie? Tego działania nie można cofnąć.")) return;
        await backend.deleteTicket(selectedTicket.id);
        const tData = await backend.getTickets(user, currentMonth);
        onTicketsUpdated(tData);
        onClose();
    };

    const handleTicketSubmit = async (payload: any) => {
        const t = selectedTicket;

        // --- 1. Map Payloads to Backend Calls (Granular per-field) ---
        if (payload.price !== t.price) await backend.updateTicket(t.id, 'price', payload.price);
        if (payload.priority !== t.priority) await backend.updateTicket(t.id, 'priority', payload.priority);
        if (payload.status !== t.status) await backend.updateTicket(t.id, 'status', payload.status);
        if (payload.description !== t.description) await backend.updateTicket(t.id, 'description', payload.description);
        if (payload.internalNotes !== (t.internalNotes || t.internal_notes)) await backend.updateTicket(t.id, 'internalNotes', payload.internalNotes);
        if (payload.publicNotes !== (t.publicNotes || t.public_notes)) await backend.updateTicket(t.id, 'publicNotes', payload.publicNotes);

        // Dates
        const oldStart = t.adminStartDate || t.admin_start_date;
        const oldDeadline = t.adminDeadline || t.admin_deadline;
        if (payload.adminStartDate !== oldStart || payload.adminDeadline !== oldDeadline) {
            await backend.updateTicket(t.id, 'dates', { start: payload.adminStartDate, deadline: payload.adminDeadline });
        }

        // Subtasks (Full Replace)
        if (JSON.stringify(payload.subtasks) !== JSON.stringify(t.subtasks)) {
            await backend.updateTicket(t.id, 'subtasks', payload.subtasks);
        }

        // Attachments (Full Replace)
        if (JSON.stringify(payload.attachments) !== JSON.stringify(t.attachments)) {
            await backend.updateTicket(t.id, 'attachments', payload.attachments);
        }

        // Folder ID
        const oldFolderId = t.folderId || t.folder_id;
        if (payload.folderId !== oldFolderId) {
            await backend.updateTicket(t.id, 'folderId', payload.folderId);
        }

        // Billing type
        const oldBillingType = t.billingType || t.billing_type;
        if (payload.billingType !== oldBillingType) {
            await backend.updateTicket(t.id, 'billingType', payload.billingType);
        }

        // Subject
        if (payload.subject !== t.subject) {
            await backend.updateTicket(t.id, 'subject', payload.subject);
        }

        // Category-specific fields
        if (payload.url !== t.url) await backend.updateTicket(t.id, 'url', payload.url);
        if (payload.deviceType !== t.device_type) await backend.updateTicket(t.id, 'deviceType', payload.deviceType);
        if (payload.errorDate !== (t.errorDate || t.error_date)) await backend.updateTicket(t.id, 'errorDate', payload.errorDate);
        if (payload.platform !== t.platform) await backend.updateTicket(t.id, 'platform', payload.platform);
        if (payload.budget !== t.budget) await backend.updateTicket(t.id, 'budget', payload.budget);

        // --- 2. Refresh Data ---
        const tData = await backend.getTickets(user, currentMonth);
        onTicketsUpdated(tData);
        onClose();
    };

    // Resolve creator info
    const createdByName = (selectedTicket as any).createdByName || selectedTicket.clientName || 'Owner';
    const createdByAvatar = (selectedTicket as any).createdByAvatar;

    return (
        <Modal
            isOpen={!!selectedTicket}
            onClose={onClose}
            title={selectedTicket ? `Zgłoszenie #${selectedTicket.id.slice(0, 8)}` : ""}
        >
            <div className="flex items-center gap-3 mb-6 p-4 bg-white/5 rounded-2xl border border-white/10">
                {createdByAvatar ? (
                    <img src={createdByAvatar} className="w-8 h-8 rounded-full object-cover" alt="Avatar" />
                ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-[10px] text-white font-bold">
                        {(createdByName?.[0] || '?')}
                    </div>
                )}
                <div>
                    <p className="text-xs text-slate-400">Zgłoszone przez</p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-sm font-bold text-white">{selectedTicket.clientName || 'Klient'}</p>
                        <span className="text-slate-600 text-[10px] font-bold">/</span>
                        <p className="text-sm font-medium text-slate-300">{createdByName}</p>
                    </div>
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
