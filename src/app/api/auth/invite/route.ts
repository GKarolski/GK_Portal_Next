import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
    try {
        console.log('--- Invitation API Call Started ---');
        console.log('[DEBUG] Server Environment - Key Prefix:', process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 4) || 'NONE');

        if (!process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY === 'placeholder') {
            console.error('[INVITE] Missing SUPABASE_SERVICE_ROLE_KEY in environment');
            return NextResponse.json({
                error: 'Błąd konfiguracji serwera: Brak SUPABASE_SERVICE_ROLE_KEY. Jeśli używasz Vercel, dodaj ten klucz w ustawieniach (Settings -> Environment Variables).'
            }, { status: 500 });
        }

        // 1. Verify Authorization
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            console.error('[INVITE] Missing Authorization header');
            return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');

        const authClient = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const { data: { user }, error: authError } = await authClient.auth.getUser(token);

        if (authError || !user) {
            console.error('[INVITE] Auth verification failed:', authError);
            return NextResponse.json({ error: 'Nieprawidłowa sesja' }, { status: 401 });
        }

        console.log('[INVITE] User verified:', user.email, 'ID:', user.id);

        // 2. Check Admin Role (with Metadata Fallback)
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        let isAdmin = profile?.role === 'ADMIN';

        if (profileError || !isAdmin) {
            console.warn('[INVITE] Profile check failed or not admin, trying metadata. Error:', profileError);
            if (user.user_metadata?.role === 'ADMIN') {
                console.log('[INVITE] Admin role found in metadata fallback');
                isAdmin = true;
            }
        }

        if (!isAdmin) {
            console.error('[INVITE] Access denied: User is not an admin.');
            return NextResponse.json({ error: 'Brak uprawnień administratora' }, { status: 403 });
        }

        console.log('[INVITE] Admin check passed');

        // 3. Process Invitation
        const body = await req.json();
        const { name, email, company, orgId, details } = body;
        console.log('[INVITE] Payload:', { name, email, company, orgId });

        if (!email || !company || !name) {
            console.error('[INVITE] Missing required fields');
            return NextResponse.json({ error: 'Brak wymaganych danych (email, firma, nazwa)' }, { status: 400 });
        }

        let targetOrgId = orgId;

        // Create new organization if none provided
        if (!targetOrgId) {
            console.log('[INVITE] Creating new organization:', company);
            const { data: newOrg, error: orgError } = await supabaseAdmin
                .from('organizations')
                .insert({ name: company })
                .select()
                .single();

            if (orgError) {
                console.error('[INVITE] Org Creation Error:', orgError);
                return NextResponse.json({ error: 'Błąd podczas tworzenia organizacji' }, { status: 500 });
            }
            targetOrgId = newOrg.id;
            console.log('[INVITE] New Org Created ID:', targetOrgId);
        }

        // 4. Invite User with Metadata
        console.log('[INVITE] Sending Supabase Invitation to:', email);
        const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
            data: {
                name: name,
                company_name: company,
                organization_id: targetOrgId,
                role: 'CLIENT',
                phone: details?.phone,
                nip: details?.nip,
                website: details?.website,
                admin_notes: details?.adminNotes,
                avatar_url: details?.avatar,
                role_in_org: orgId ? 'MEMBER' : 'OWNER'
            },
            redirectTo: `${new URL(req.url).origin}/login`
        });

        if (inviteError) {
            console.error('[INVITE] Supabase Auth Error:', inviteError);
            return NextResponse.json({ error: 'Błąd Supabase Auth: ' + inviteError.message }, { status: 500 });
        }

        console.log('[INVITE] Invitation successful for:', email, 'User ID:', inviteData.user.id);

        return NextResponse.json({
            success: true,
            orgId: targetOrgId,
            userId: inviteData.user.id
        });

    } catch (error: any) {
        console.error('[INVITE] Server Internal Error Catch:', error);
        return NextResponse.json({ error: 'Wystąpił błąd serwera: ' + error.message }, { status: 500 });
    }
}
