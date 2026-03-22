# The Lean Brain

A behavior intelligence system for real-world fat loss. AI-powered coaching, habit tracking, and macro estimation.

**Production**: https://theleanbrain.projectlean.app

## Tech Stack

- Vite + React + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (Auth, PostgreSQL, Edge Functions, Storage)
- Gemini 2.5 Flash (AI coaching + meal analysis)
- Vercel (deployment)
- Sentry (error tracking)
- Resend (transactional email)
- Stripe (payments)

## Local Development

```sh
git clone https://github.com/hshslm/ProjectLean.git
cd ProjectLean
npm install
npm run dev
```

Runs on `http://localhost:8080`.

## Environment Variables

Copy `.env.example` to `.env` and fill in:
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` — Supabase anon key
- `VITE_SUPABASE_PROJECT_ID` — Supabase project ID

## Deployment

Push to `main` — Vercel auto-deploys. Edge functions deploy via `npx supabase functions deploy --project-ref <ref>`.

## Project Structure

```
src/
  components/    # React components
  pages/         # Route pages
  hooks/         # Custom hooks (auth, subscription)
  integrations/  # Supabase client config
supabase/
  functions/     # Edge functions (AI, email, auth)
  _shared/       # Shared modules (CORS)
public/          # Static assets, PWA icons, manifest
```
