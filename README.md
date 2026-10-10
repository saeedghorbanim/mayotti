# mayotti

A calm, friendly AI expense tracker for iOS. Log spending by typing, speaking or snapping a receipt; mayotti keeps track, warns you gently before you overspend, and suggests small ways to save.

## Stack

- **App:** React + TypeScript + Vite + Tailwind (shadcn/ui), wrapped for iOS with Capacitor
- **Data:** stays on the device (localStorage)
- **Subscriptions:** RevenueCat (`premium` entitlement, hosted paywall)
- **Backend:** Supabase Edge Functions that check the subscription, enforce a monthly AI quota and call OpenAI
  - `chat` — expense parsing and budget chat
  - `analyze-receipt` — reads receipt photos
  - `transcribe` — voice notes (Whisper)

## Run locally

```bash
cp .env.example .env   # fill in your Supabase URL/key and RevenueCat iOS key
npm install
npm run dev            # http://localhost:8080 (AI features need a native build)
```

## Run on iPhone

```bash
npm run build
npx cap sync ios
npx cap open ios       # then Run in Xcode
```

## Deploy the backend

```bash
supabase login
supabase link --project-ref <your-project-ref>
supabase secrets set OPENAI_API_KEY=sk-... REVENUECAT_SECRET_KEY=sk_...
supabase db push
supabase functions deploy chat analyze-receipt transcribe
```

See `CLAUDE.md` for architecture details.
