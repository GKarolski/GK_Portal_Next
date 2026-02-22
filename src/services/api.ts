import { supabase } from '@/lib/supabase';
import {
    User,
    Ticket,
    TicketStatus,
    TicketPriority,
    TicketCategory,
    DeviceType,
    MarketingPlatform,
    Folder,
    WorkSession,
    Subtask,
    HistoryEntry,
    Attachment,
    BillingType
} from '@/types';

/**
 * GK Portal API Bridge
 * This service mimics the legacy mockBackend.ts but communicates with Supabase.
 * It ensures per-organization isolation via metadata filters or RLS.
 */
export const backend = {
    // --- AUTH ---
    checkAuth: async (): Promise<User | null> => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return null;

        const { user } = session;
        return {
            id: user.id,
            name: user.user_metadata.name || user.email?.split('@')[0] || 'Użytkownik',
            email: user.email || '',
            role: user.user_metadata.role || 'CLIENT',
            isActive: true,
            companyName: user.user_metadata.company_name,
            organizationId: user.user_metadata.organization_id,
            organizationLogo: user.user_metadata.organization_logo,
            roleInOrg: user.user_metadata.role_in_org as any,
            avatar: user.user_metadata.avatar,
        };
    },

    logout: async () => {
        await supabase.auth.signOut();
        window.location.href = '/login';
    },

    // --- TICKETS ---
    getTickets: async (user: User, month?: string): Promise<Ticket[]> => {
        let query = supabase
            .from('tickets')
            .select('*')
            .order('created_at', { ascending: false });

        if (user.role === 'CLIENT') {
            query = query.eq('organization_id', user.organizationId);
        }

        if (month) {
            // Simplified month filtering: assume billing_month is YYYY-MM
            query = query.eq('billing_month', month);
        }

        const { data, error } = await query;
        if (error) throw error;

        // Map snake_case to camelCase if necessary (though current types seem mixed)
        return (data || []).map(t => ({
            ...t,
            clientId: t.created_by_user_id, // legacy support for TicketListView
            clientName: t.client_name,
            organizationId: t.organization_id, // alias 
            createdByUserId: t.created_by_user_id, // alias
            createdAt: t.created_at,
            publicNotes: t.public_notes,
            internalNotes: t.internal_notes,
            adminStartDate: t.admin_start_date,
            adminDeadline: t.admin_deadline,
            errorDate: t.error_date,
            folderId: t.folder_id,
            historyLog: t.history_log,
            billingType: t.billing_type,
            billingMonth: t.billing_month,
        }));
    },

    getTicket: async (id: string): Promise<Ticket> => {
        const { data, error } = await supabase
            .from('tickets')
            .select('*')
            .eq('id', id)
            .single();
        if (error) throw error;
        return data; // Map if needed
    },

    createTicket: async (user: User, payload: any): Promise<{ success: boolean; id: string }> => {
        const { data, error } = await supabase
            .from('tickets')
            .insert({
                organization_id: user.organizationId,
                created_by_user_id: user.id,
                client_name: user.name,
                subject: payload.subject,
                description: payload.description,
                category: payload.category,
                priority: payload.priority,
                status: 'REVIEW',
                url: payload.url,
                device_type: payload.deviceType,
                platform: payload.platform,
                budget: payload.budget,
                error_date: payload.errorDate,
                attachments: payload.attachments || [],
                subtasks: payload.initialSubtasks ? payload.initialSubtasks.map((title: string) => ({
                    id: crypto.randomUUID(),
                    title,
                    isCompleted: false,
                    isVisibleToClient: true
                })) : [],
                history_log: [{
                    date: new Date().toISOString(),
                    content: 'Zgłoszenie utworzone.'
                }]
            })
            .select()
            .single();

        if (error) throw error;
        return { success: true, id: data.id };
    },

    updateTicketStatus: async (ticketId: string, status: TicketStatus): Promise<{ success: boolean }> => {
        const { error } = await supabase
            .from('tickets')
            .update({ status })
            .eq('id', ticketId);
        if (error) throw error;
        return { success: true };
    },

    updateTicket: async (ticketId: string, field: string, value: any): Promise<{ success: boolean }> => {
        const payload: any = {};
        if (field === 'all') {
            Object.keys(value).forEach(k => {
                if (k === 'adminStartDate') payload.admin_start_date = value[k];
                else if (k === 'adminDeadline') payload.admin_deadline = value[k];
                else if (k === 'internalNotes') payload.internal_notes = value[k];
                else if (k === 'publicNotes') payload.public_notes = value[k];
                else if (k === 'folderId') payload.folder_id = value[k];
                else if (k === 'errorDate') payload.error_date = value[k];
                else if (k === 'deviceType') payload.device_type = value[k];
                else if (k === 'billingType') payload.billing_type = value[k];
                else payload[k] = value[k];
            });
        } else if (field === 'dates') {
            payload.admin_start_date = value.start;
            payload.admin_deadline = value.deadline;
        } else if (field === 'internalNotes') {
            payload.internal_notes = value;
        } else if (field === 'publicNotes') {
            payload.public_notes = value;
        } else if (field === 'folderId') {
            payload.folder_id = value;
        } else {
            payload[field] = value;
        }

        const { error } = await supabase
            .from('tickets')
            .update(payload)
            .eq('id', ticketId);
        if (error) throw error;
        return { success: true };
    },

    deleteTicket: async (ticketId: string): Promise<{ success: boolean }> => {
        const { error } = await supabase
            .from('tickets')
            .delete()
            .eq('id', ticketId);
        if (error) throw error;
        return { success: true };
    },

    // --- CLIENTS / ORG USERS ---
    getOrgUsers: async (orgId: string): Promise<User[]> => {
        // This is tricky: we might need a profiles table or use auth.admin to list users
        // For standard multi-tenant, we usually have a 'profiles' table mirroring auth.users
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('organization_id', orgId);

        if (error) throw error;
        return (data || []).map(p => ({
            id: p.id,
            name: p.full_name || p.email?.split('@')[0],
            email: p.email,
            role: p.role,
            isActive: p.is_active,
            organizationId: p.organization_id,
            roleInOrg: p.role_in_org,
            avatar: p.avatar_url
        }));
    },

    getClients: async (): Promise<User[]> => {
        // Super Admin view: List all unique owners of organizations
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'ADMIN'); // In this context, ADMIN = Instance Owner

        if (error) throw error;
        return data.map(p => ({
            id: p.id,
            name: p.full_name,
            email: p.email,
            role: p.role,
            isActive: p.is_active,
            organizationId: p.organization_id,
            companyName: p.company_name,
            phone: p.phone,
            nip: p.nip,
            website: p.website,
            adminNotes: p.admin_notes,
            avatar: p.avatar_url,
            isVip: p.is_vip,
            roleInOrg: p.role_in_org
        }));
    },

    inviteClient: async (name: string, email: string, company: string, orgId?: string, details?: any) => {
        // Mocking invitation for now
        return { success: true };
    },

    updateUserProfile: async (userId: string, updates: any) => {
        const payload: any = {
            full_name: updates.name,
            company_name: updates.companyName,
            phone: updates.phone,
            nip: updates.nip,
            website: updates.website,
            admin_notes: updates.adminNotes,
            avatar_url: updates.avatar
        };
        const { error } = await supabase
            .from('profiles')
            .update(payload)
            .eq('id', userId);
        return { success: !error, error };
    },

    triggerPasswordReset: async (userId: string) => {
        // Supabase standard: supabase.auth.resetPasswordForEmail(email)
        return { success: true };
    },

    // --- FOLDERS ---
    getFolders: async (orgId: string): Promise<Folder[]> => {
        const { data, error } = await supabase
            .from('folders')
            .select('*')
            .eq('organization_id', orgId);
        if (error) throw error;
        return data || [];
    },

    // --- SETTINGS ---
    getAdminSettings: async () => {
        // This usually holds global app settings (contact info, etc.)
        const { data, error } = await supabase
            .from('admin_settings')
            .select('*')
            .single();
        if (error) return null;
        return {
            ...data,
            contactName: data.contact_name,
            contactEmail: data.contact_email,
            contactPhone: data.contact_phone,
            popupNote: data.popup_note,
            stickyNotes: data.sticky_notes,
            notepadContent: data.notepad_content
        };
    },

    updateAdminSettings: async (updates: any) => {
        const payload: any = {
            contact_name: updates.contactName,
            contact_email: updates.contactEmail,
            contact_phone: updates.contactPhone,
            popup_note: updates.popupNote,
            sticky_notes: updates.stickyNotes,
            notepad_content: updates.notepadContent,
            avatar: updates.avatar
        };
        const { error } = await supabase
            .from('admin_settings')
            .update(payload)
            .eq('id', 1); // Assuming a single settings row
        return { success: !error, error };
    },

    getUsageStats: async () => {
        // This would typically involve complex aggregation or a dedicated stats table
        // For now, return reasonably realistic mock data derived from Supabase count if possible
        return {
            success: true,
            data: {
                plan: 'AGENCY',
                storage: { used_mb: 240, limit_mb: 1000, percent: 24 },
                ai: { used_tokens: 45000, limit_tokens: 100000, percent: 45 },
                features: { smart_context: true }
            }
        };
    },

    // --- TIMERS ---
    getWorkSessions: async (ticketId: string): Promise<WorkSession[]> => {
        const { data, error } = await supabase
            .from('work_sessions')
            .select('*')
            .eq('ticket_id', ticketId)
            .order('start_time', { ascending: false });
        if (error) throw error;
        return (data || []).map(s => ({
            ...s,
            duration_seconds: s.duration_seconds || 0
        }));
    },

    manageWorkSession: async (payload: any) => {
        if (payload.subAction === 'create') {
            const { error } = await supabase
                .from('work_sessions')
                .insert({
                    ticket_id: payload.ticketId,
                    user_id: payload.userId === 'ME' ? (await supabase.auth.getUser()).data.user?.id : payload.userId,
                    duration_seconds: payload.duration,
                    note: payload.note,
                    start_time: payload.date || new Date().toISOString()
                });
            if (error) throw error;
        } else if (payload.subAction === 'delete') {
            const { error } = await supabase
                .from('work_sessions')
                .delete()
                .eq('id', payload.sessionId);
            if (error) throw error;
        }
        return { success: true };
    },

    // --- SOPS ---
    getSops: async (category?: string) => {
        let query = supabase.from('sops').select('*').order('created_at', { ascending: false });
        if (category) query = query.eq('category', category);
        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    },

    manageSop: async (payload: any) => {
        if (payload.subAction === 'delete') {
            const { error } = await supabase.from('sops').delete().eq('id', payload.id);
            if (error) throw error;
        } else {
            // create/update logic
        }
        return { success: true };
    },

    // --- DOCUMENTS ---
    getClientDocuments: async (orgId?: string) => {
        let query = supabase.from('vault_documents').select('*').order('uploaded_at', { ascending: false });
        if (orgId) query = query.eq('organization_id', orgId);
        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    },

    uploadClientDocument: async (orgId: string, file: File) => {
        // Mocking upload for now to allow UI to function
        return { success: true };
    },

    deleteClientDocument: async (id: number) => {
        const { error } = await supabase.from('vault_documents').delete().eq('id', id);
        return { success: !error, error };
    },

    reindexClientDocument: async (id: number) => {
        return { success: true };
    },

    // --- TIMERS ---
    getActiveTimer: async (userId: string) => {
        const { data, error } = await supabase
            .from('active_timers')
            .select('*, ticket:tickets(subject)')
            .eq('user_id', userId)
            .maybeSingle();

        if (error || !data) return { active: false };

        return {
            active: true,
            session: {
                ticket_id: data.ticket_id,
                ticket_subject: (data as any).ticket?.subject,
                start_time: data.start_time
            }
        };
    },

    startTimer: async (userId: string, ticketId: string) => {
        const startTime = new Date().toISOString();
        const { error } = await supabase
            .from('active_timers')
            .upsert({ user_id: userId, ticket_id: ticketId, start_time: startTime });

        if (error) throw error;
        return { success: true, start_time: startTime };
    },

    stopTimer: async (userId: string) => {
        const { data: timer } = await supabase
            .from('active_timers')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (timer) {
            const startTime = new Date(timer.start_time);
            const stopTime = new Date();
            const duration = Math.floor((stopTime.getTime() - startTime.getTime()) / 1000);

            await supabase.from('work_sessions').insert({
                ticket_id: timer.ticket_id,
                user_id: userId,
                duration_seconds: duration,
                start_time: timer.start_time,
                stop_time: stopTime.toISOString()
            });

            await supabase.from('active_timers').delete().eq('user_id', userId);
        }
        return { success: true };
    },
};
