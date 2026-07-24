# 0001: Next.js, Supabase, Native Telegram API, and TWA Stack

## Context & Decision
We are building a single-user internal Digital Rental Back Office for Anya's mom (~10 flats) replacing a physical notebook via Telegram Bot and Telegram Web App (TWA).

We decided to build the system as a Next.js (App Router) application deployed to Vercel's free serverless infrastructure:
- **Backend & Database**: Supabase (PostgreSQL + File Storage) accessed directly via `@supabase/supabase-js` without Prisma ORM to keep Vercel serverless builds and cold-starts zero-overhead.
- **Telegram Bot Integration**: Native Telegram Bot API (`fetch` calls inside Next.js Webhook route handler `/api/telegram/webhook`) rather than `grammy` or heavy bot frameworks.
- **Telegram Web App (TWA)**: Next.js React frontend integrated with `@twa-dev/sdk` for native Telegram theme matching, haptics, and `initData` authentication.
- **Access Control**: Telegram User ID whitelist verification and cryptographic HMAC `initData` validation on all API requests.
- **Multimodal AI Parsing (100% Free Tier)**: Google Gemini 1.5 Flash Free Tier (`@google/generative-ai`) to parse forwarded receipt screenshots, utility meter photos, lease contract photos, and transcribe Telegram voice notes into structured JSON.

## Rationale & Considered Options
- **Vercel Serverless vs. Local SQLite**: Local SQLite files (`dev.db`) do not persist across Vercel serverless lambda restarts. Supabase provides a 100% free Postgres database AND file storage for receipt photos/contracts in a single service.
- **Direct Supabase SDK vs. Prisma**: `@supabase/supabase-js` handles both DB queries and file storage uploads without the ~30MB engine bundle overhead of Prisma.
- **Native TG Fetch vs. Bot Frameworks**: Native Web API `fetch` in Next.js route handlers minimizes dependencies while handling webhook updates efficiently.
- **Multimodal AI Parsing**: Gemini 1.5 Flash provides a 100% free API tier (1,500 requests/day) supporting vision, document OCR, and voice audio transcription natively in a single free SDK.
