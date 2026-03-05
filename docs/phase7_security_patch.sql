-- ============================================================================
-- GK Portal SaaS - Phase 7 RLS Security Patch (Strict Tenant Isolation)
-- ============================================================================
-- WARNING: This script overwrites the unsafe permissive RLS policies
-- currently applied to the database. It removes the global `public.is_admin()` 
-- bypass which allowed any tenant Admin to view data across all organizations.
-- 
-- INSTRUCTIONS: Run this script ONCE in the Supabase SQL Editor.
-- ============================================================================

-- Function 1: Check if the user is an admin WITHIN their own organization
-- Note: We redefine what "is_admin" means contextually: It no longer means "superadmin", 
-- but rather "I have the ADMIN role in my own organization". It is still used, but paired
-- with the organization_id check.
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
    OR
    (auth.jwt()->'user_metadata'->>'role') = 'ADMIN'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function 2: Helper to get the current user's organization UUID
CREATE OR REPLACE FUNCTION public.user_org_id() RETURNS UUID AS $$
BEGIN
  RETURN (SELECT organization_id FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================================
-- POLICIES PATCHING (Drop & Replace)
-- ============================================================================

-- ==================
-- 1. ORGANIZATIONS
-- ==================
-- An organization record can only be viewed by its members.
-- Note: This locks down the tenant space.
DROP POLICY IF EXISTS "Organizations read" ON public.organizations;
CREATE POLICY "Organizations read" ON public.organizations FOR SELECT
USING (id = public.user_org_id());

DROP POLICY IF EXISTS "Organizations admin manage" ON public.organizations;
CREATE POLICY "Organizations admin manage" ON public.organizations FOR UPDATE
USING (id = public.user_org_id() AND public.is_admin());

-- (Optional: allow authenticated users to potentially create if during signup flow handled via edge functions or triggers, so we don't block new tenant creation abruptly if done client-side. The trigger handles org creation, so we leave INSERT locked out for clients).


-- ==================
-- 2. PROFILES
-- ==================
-- Everyone should see themselves. 
-- You should also be able to see everyone else who shares the same organization_id.
DROP POLICY IF EXISTS "Profiles read" ON public.profiles;
CREATE POLICY "Profiles read" ON public.profiles FOR SELECT
USING (auth.uid() = id OR organization_id = public.user_org_id());

-- Only you can update your own profile initially (or Admins updating folks IN THEIR OWN org)
DROP POLICY IF EXISTS "Profiles update own" ON public.profiles;
CREATE POLICY "Profiles update own" ON public.profiles FOR UPDATE
USING (auth.uid() = id OR (organization_id = public.user_org_id() AND public.is_admin()));

-- The edge function / trigger handles insert, but if an admin invites a member, they must be inserting them into THEIR org.
DROP POLICY IF EXISTS "Profiles admin insert" ON public.profiles;
CREATE POLICY "Profiles admin insert" ON public.profiles FOR INSERT
WITH CHECK ((organization_id = public.user_org_id() AND public.is_admin()) OR auth.uid() = id);


-- ==================
-- 3. TICKETS
-- ==================
-- STRICT TENANT ISOLATION: A user or admin can ONLY see/create/edit tickets belonging to their organization.
DROP POLICY IF EXISTS "Tickets isolation" ON public.tickets;

-- Select
CREATE POLICY "Tickets select isolation" ON public.tickets FOR SELECT
USING (organization_id = public.user_org_id());

-- Insert
CREATE POLICY "Tickets insert isolation" ON public.tickets FOR INSERT
WITH CHECK (organization_id = public.user_org_id());

-- Update
CREATE POLICY "Tickets update isolation" ON public.tickets FOR UPDATE
USING (organization_id = public.user_org_id());

-- Delete
CREATE POLICY "Tickets delete isolation" ON public.tickets FOR DELETE
USING (organization_id = public.user_org_id() AND public.is_admin());


-- ==================
-- 4. FOLDERS
-- ==================
DROP POLICY IF EXISTS "Folders isolation" ON public.folders;

CREATE POLICY "Folders select isolation" ON public.folders FOR SELECT
USING (organization_id = public.user_org_id());

CREATE POLICY "Folders manage isolation" ON public.folders FOR ALL
USING (organization_id = public.user_org_id() AND public.is_admin());


-- ==================
-- 5. CLIENT DOCUMENTS
-- ==================
DROP POLICY IF EXISTS "Documents isolation" ON public.client_documents;

CREATE POLICY "Documents select isolation" ON public.client_documents FOR SELECT
USING (organization_id = public.user_org_id());

CREATE POLICY "Documents insert isolation" ON public.client_documents FOR INSERT
WITH CHECK (organization_id = public.user_org_id());

CREATE POLICY "Documents manage isolation" ON public.client_documents FOR ALL
USING (organization_id = public.user_org_id() AND public.is_admin());


-- ==================
-- 6. SOPS
-- ==================
DROP POLICY IF EXISTS "SOPs isolation" ON public.sops;

CREATE POLICY "SOPs select isolation" ON public.sops FOR SELECT
USING (organization_id = public.user_org_id());

CREATE POLICY "SOPs manage isolation" ON public.sops FOR ALL
USING (organization_id = public.user_org_id() AND public.is_admin());


-- ==================
-- 7. ADMIN SETTINGS
-- ==================
DROP POLICY IF EXISTS "Admin settings isolation" ON public.admin_settings;

CREATE POLICY "Admin settings select isolation" ON public.admin_settings FOR SELECT
USING (organization_id = public.user_org_id());

CREATE POLICY "Admin settings manage isolation" ON public.admin_settings FOR ALL
USING (organization_id = public.user_org_id() AND public.is_admin());


-- ==================
-- 8. WORK SESSIONS & TIMERS
-- ==================
-- A work session belongs to a ticket. Ergo, it can only be seen if the user has access to that ticket.
DROP POLICY IF EXISTS "Work sessions isolation" ON public.work_sessions;

CREATE POLICY "Work sessions select isolation" ON public.work_sessions FOR SELECT
USING (ticket_id IN (SELECT id FROM public.tickets WHERE organization_id = public.user_org_id()));

CREATE POLICY "Work sessions manage isolation" ON public.work_sessions FOR ALL
USING (ticket_id IN (SELECT id FROM public.tickets WHERE organization_id = public.user_org_id()));

--
-- Active Timers (user specific)
--
DROP POLICY IF EXISTS "Active timers user" ON public.active_timers;

CREATE POLICY "Active timers user isolation" ON public.active_timers FOR ALL
USING (user_id = auth.uid());
