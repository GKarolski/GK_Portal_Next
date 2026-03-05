-- ============================================================================
-- GK Portal SaaS - RESET BAZY DANYCH (CZYSTY START)
-- ============================================================================
-- UWAGA: TEN SKRYPT CAŁKOWICIE I NIEODWRACALNIE USUNIE WSZYSTKIE DANE:
-- Użytkowników, organizacje, zgłoszenia, pliki, foldery i sesje pracy.
-- Używaj tylko, jeśli chcesz zresetować system do ustawień fabrycznych.
-- 
-- INSTRUKCJA: Wklej ten kod w Supabase -> SQL Editor i kliknij RUN.
-- ============================================================================

-- 1. Usunięcie wszystkich kont użytkowników z modułu Auth.
-- Dzięki relacjom CASCADE, to automatycznie usunie wszystkie powiązane z nimi wpisy w tabeli public.profiles.
DELETE FROM auth.users;

-- 2. Wyczyszczenie wszystkich głównych tabel publicznych i zresetowanie liczników (ID).
TRUNCATE TABLE 
    public.active_timers,
    public.work_sessions,
    public.tickets,
    public.sops,
    public.client_documents,
    public.folders,
    public.admin_settings,
    public.organizations 
RESTART IDENTITY CASCADE;

-- Gotowe! Baza jest absolutnie czysta.
