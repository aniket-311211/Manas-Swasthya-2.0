# ManasSwasthya — Redesign & Production-Hardening Design

Date: 2026-07-13 · Status: approved direction, spec under user review

## Goal

Turn nexus-mind-care (ManasSwasthya) into a portfolio-grade, production-ready mental wellness platform: full visual redesign, all features working end-to-end, secure architecture, deployable to Vercel.

## Audit findings (2026-07-13)

Working: Gemini API key valid (gemini-2.5-flash), Neon Postgres live with all 13 tables, Clerk key present, Vite build succeeds.

Broken / risky:

1. Prisma 7 breaking change — `url = env("DATABASE_URL")` in schema.prisma is no longer supported; `prisma generate` fails, so the entire Express backend cannot reach the DB.
2. Hardcoded `http://localhost:3001/api` in `src/lib/api.ts` and `CommunityContext.tsx` — breaks on any deployment.
3. `VITE_GEMINI_API_KEY` is bundled into browser JS — key theft risk. All Gemini calls must move server-side.
4. Duplicate Express routes: `/api/community/groups` ×2; `/api/chat/rooms/:clerkId` collides with `/api/chat/rooms/:roomId`.
5. 1.1 MB main JS bundle — no route-level code splitting.
6. 33 ESLint errors (mostly `any`), two chat contexts (`ChatContext.tsx`, `chat-context.tsx`), five overlapping assessment components, `!important`-heavy CSS.

## Approved decisions

- Architecture: keep React 18 + Vite; convert Express `server.js` into Vercel serverless functions under `api/`; deploy on Vercel with Neon + Clerk + Gemini.
- Consolidation: one adaptive assessment flow, one chat context; delete dead variants.
- Visual direction: "Calm premium wellness".
  - Landing page: dark aurora theme — deep forest-slate (#141A18) canvas, drifting blurred aurora blobs (sage #7C9A83, lavender #A99BC7, clay #D9A886), twinkling particles, shimmer gradient headline, glowing pill CTAs, floating glass cards, scroll-reveal + parallax via `motion`.
  - App pages (dashboard, chat, journal, assessment, community, booking, resources): calm cream (#F6F2E9) canvas, frosted glass cards, sage/lavender accents, soft layered shadows.
  - Typography: Fraunces (display) + Inter (body/UI), self-hosted via @fontsource.
  - Dark mode toggle site-wide via next-themes (app pages get a slate-dark variant).

## Architecture

### Frontend (React + Vite)

- `src/styles/` — new token-based design system: CSS custom properties (colors, radii, shadows, blur) + Tailwind theme extension. Remove `!important` hacks from index.css.
- `src/lib/api.ts` — base URL from `import.meta.env.VITE_API_URL ?? '/api'`; typed request helpers; zod-validated responses; central error handling.
- Route-level code splitting with `React.lazy` + Suspense skeletons for all pages.
- Error boundary per route; toast-based error surface; loading skeletons and empty states on all data views.
- Crisis detection: keyword check client-side for instant helpline display (KIRAN, iCall), plus server-side classification as backup.

### Backend (Vercel serverless, `api/`)

- Handlers under `api/` as Vercel functions; shared code in `api/_lib/` (prisma client singleton, zod schemas, gemini client, auth guard reading Clerk JWT).
- Prisma 7 fix: `prisma.config.ts` + `@prisma/adapter-pg` driver adapter; regenerate client; keep schema models unchanged.
- Endpoints (deduped, validated):
  - `users` (upsert on sign-in), `assessments` (save/list), `mood` (save/list), `journal` (CRUD), `medicine` (save/history)
  - `chat/rooms` + `chat/rooms/[roomId]/messages` (single canonical shape; user-scoped listing via query param, not colliding path params)
  - `community/groups`, `community/join`, `events`, `events/[id]/register`, `mentors`
  - `ai/chat`, `ai/assessment` (next-question generation + scoring), `ai/medicine`, `ai/analyze` — all Gemini calls server-side with `GEMINI_API_KEY`; per-user rate limiting; no AI key in client bundle.
- Local dev: thin `server.js` Express wrapper importing the same handler functions (single source of truth); port 3001 preserved. `vercel dev` also works but is not required.

### Data

- Prisma schema unchanged except Prisma 7 config migration. Existing Neon data preserved.
- Seed script for demo data (mentors, events, community groups) so the deployed portfolio site looks alive.

## Page-by-page

1. Landing — dark aurora hero, feature cards, stats band, how-it-works, testimonials, CTA, footer.
2. Dashboard — greeting + streak, mood trend chart, wellness score, quick actions, recent activity.
3. Chat — glass chat surface, typing indicator, crisis banner, suggested prompts, history via DB.
4. Assessment — single adaptive flow (consolidating 5 variants): intro → adaptive questions (6 domains) → animated score reveal → full report (downloadable) → saved to DB.
5. Journal — editor + mood picker, calendar view, streaks, insights.
6. Community — groups, events with registration, mentors; peer forum.
7. Booking — counselor booking flow with confirmation state.
8. Resources — curated hub, search/filter.
9. About + NotFound — reskinned.
10. Remove `/test-ai` dev page from production routes.

## Cleanup list

Delete/merge: `TestAIAssessment.tsx`, `TestAI.tsx` page, `SmartAssessment.tsx`, `Assessment.tsx` (component), `TakeAssessment.tsx`, `DynamicAssessment.tsx` → one `assessment/` module built on `AIAssessmentEngine` + `DynamicScoringEngine` (typed, server-backed). `chat-context.tsx` merged into `ChatContext.tsx`. Fix all ESLint errors; type all `any`s.

## Production polish

- `vercel.json` (SPA rewrites + function config), env var docs, `.env.example` updated.
- SEO/OG meta, favicon set, PWA manifest verified, sitemap.
- README: hero screenshot, feature list, architecture diagram, local setup, deploy guide.

## Verification

- `vite build` clean, `eslint` zero errors, `prisma generate` + DB smoke test green.
- API smoke tests against all endpoints (local).
- Browser walkthrough with screenshots of every route (light + dark), mobile viewport check.
- Bundle check: main chunk < 400 kB gzip total via code splitting.

## Out of scope

Next.js migration, native mobile app, real payment/telehealth integrations, mentor admin portal redesign beyond reskin.
