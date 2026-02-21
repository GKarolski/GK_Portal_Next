import { supabaseAdmin } from './supabaseServer';

export async function getAIContext(organizationId: string, activeTicketId?: string) {
    const month = new Date().toISOString().slice(0, 7);

    // 1. Fetch Tickets
    const { data: tickets } = await supabaseAdmin
        .from('tickets')
        .select(`
            id, subject, status, price, priority, billing_month, category, client_id,
            work_sessions(duration_seconds)
        `)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(15);

    const ticketsStr = tickets?.map(t => {
        const totalDuration = (t.work_sessions as any[])?.reduce((acc, s) => acc + (s.duration_seconds || 0), 0) || 0;
        const priceStr = t.price > 0 ? `${t.price} PLN` : "Brak wyceny";
        const durStr = (totalDuration / 3600).toFixed(2) + "h";
        return `- [ID: ${t.id}] [${t.status}] [${t.category}] ${t.subject} (${priceStr}, Time: ${durStr})`;
    }).join('\n') || 'Brak zadań.';

    // 2. Fetch Active Ticket Context
    let activeTicketStr = "BRAK (User jest na Dashboardzie)";
    if (activeTicketId) {
        const { data: at } = await supabaseAdmin
            .from('tickets')
            .select('*')
            .eq('id', activeTicketId)
            .single();

        if (at) {
            const totalDuration = 0; // TODO: Fetch specifically if needed
            activeTicketStr = `ID: ${at.id} | Temat: ${at.subject} | Status: ${at.status} | Kategoria: ${at.category} | Priorytet: ${at.priority} | Budżet: ${at.budget} | Urządzenie: ${at.device_type} | Platforma: ${at.platform} | Opis: ${at.description}`;
        }
    }

    // 3. Fetch SOPs
    const { data: sops } = await supabaseAdmin
        .from('sops')
        .select('title, content')
        .eq('organization_id', organizationId);

    let sopContext = "";
    if (sops && sops.length > 0) {
        sopContext = "\n\n### AKTUALNE PROCEDURY (SOP):\n";
        sops.forEach(sop => {
            sopContext += `- **${sop.title}**:\n${sop.content}\n\n`;
        });
    }

    // 4. Fetch Vault Documents
    const { data: docs } = await supabaseAdmin
        .from('client_documents')
        .select('filename, parsed_content')
        .eq('organization_id', organizationId)
        .limit(10);

    let vaultContext = "";
    if (docs && docs.length > 0) {
        vaultContext = "\n\n### PLIKI W CONTEXT VAULT:\n";
        docs.forEach(doc => {
            const snippet = doc.parsed_content?.substring(0, 5000) || "Brak treści.";
            vaultContext += `- **${doc.filename}**:\n${snippet}\n\n`;
        });
    }

    return {
        ticketsStr,
        activeTicketStr,
        sopContext,
        vaultContext
    };
}
