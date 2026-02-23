# GK Portal — Setup & Deployment Guide

## 1. Environment Variables

Copy `.env.example` to `.env.local` and fill in your values.

### Where to Get Each Key

| Variable | Source |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API → `anon` `public` key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API → `service_role` key (⚠️ secret!) |
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/apikey) |
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API Keys → Secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard → Developers → Webhooks → Signing secret |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard → Developers → API Keys → Publishable key |
| `RESEND_API_KEY` | [Resend Dashboard](https://resend.com/api-keys) → Create API Key |
| `RESEND_FROM_EMAIL` | Must match a verified domain/email in Resend |

---

## 2. Supabase Database Setup

1. Go to **Supabase Dashboard → SQL Editor**
2. Paste the entire contents of `supabase_setup.sql`
3. Click **Run**
4. Verify in **Table Editor** that all tables are created:
   - `organizations`, `profiles`, `folders`, `tickets`, `work_sessions`
   - `active_timers`, `sops`, `client_documents`, `admin_settings`
5. Check **Authentication → Policies** to confirm RLS is enabled on every table

---

## 3. Resend Custom SMTP for Supabase Auth

This makes Supabase auth emails (password reset, magic links, confirmations) go through Resend instead of Supabase's built-in SMTP.

### Steps:

1. **In Resend:** Go to **Settings → Domains** → Add and verify your domain (e.g. `gk-digital.pl`)
2. **In Resend:** Go to **Settings → SMTP** and note the credentials:
   - Host: `smtp.resend.com`
   - Port: `465`
   - Username: `resend`
   - Password: Your API Key (`re_...`)
3. **In Supabase Dashboard:** Go to **Project Settings → Auth → SMTP Settings**
4. Toggle **Enable Custom SMTP** ON
5. Enter:
   - **Sender email:** `noreply@your-domain.com`
   - **Sender name:** `GK Portal`
   - **Host:** `smtp.resend.com`
   - **Port:** `465`
   - **Username:** `resend`
   - **Password:** `re_your_api_key_here`
6. Click **Save**
7. Test by triggering a password reset from the login page

---

## 4. Vercel Deployment

### Initial Setup:

1. Push to GitHub (the `main` branch)
2. Go to [vercel.com](https://vercel.com) → **Import Project** → Select your GitHub repo
3. Vercel auto-detects Next.js — accept defaults
4. Add **all environment variables** from `.env.example` in **Settings → Environment Variables**
5. Deploy

### After Deployment:

- Vercel auto-deploys on every push to `main`
- Check **Deployments** tab for build logs
- Check **Functions** tab for API route logs (invite, Stripe webhooks, etc.)

### Stripe Webhook Setup for Production:

1. Go to **Stripe Dashboard → Developers → Webhooks**
2. Add endpoint: `https://your-vercel-domain.vercel.app/api/stripe/webhook`
3. Select events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
4. Copy the **Signing secret** and update `STRIPE_WEBHOOK_SECRET` in Vercel env vars
5. Redeploy

---

## 5. Quick Verification Checklist

After deployment, verify these flows:

- [ ] Landing page loads at `/` with correct pricing cards
- [ ] Registration at `/register` creates Supabase user + redirects to checkout
- [ ] Login at `/login` authenticates and redirects to `/dashboard`
- [ ] Admin can invite client → User created + email sent via Resend
- [ ] Password reset sends email via Resend SMTP
- [ ] Client can create tickets from their dashboard
- [ ] Admin can see all clients and tickets in their portal
