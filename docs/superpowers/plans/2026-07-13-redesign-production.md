# ManasSwasthya Redesign & Production-Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Full visual redesign (dark-aurora landing + calm cream app), all features working end-to-end on a secure Vercel serverless architecture.

**Architecture:** React 18 + Vite SPA with route-level code splitting; Express `server.js` converted to Vercel functions under `api/` sharing handlers with a thin local Express wrapper; Prisma 7 + pg adapter to Neon; all Gemini calls server-side.

**Tech Stack:** React 18, Vite 5, TypeScript, Tailwind 3 + CSS tokens, motion, Clerk, Prisma 7 (@prisma/adapter-pg), Neon Postgres, @google/generative-ai (server only), zod, vitest.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-13-redesign-production-design.md`
- Palette: canvas cream `#F6F2E9`, dark canvas `#141A18`, sage `#7C9A83`, lavender `#A99BC7`, clay `#D9A886`, slate text `#2E3440`. Fonts: Fraunces (display), Inter (body) — self-hosted via @fontsource.
- No `VITE_GEMINI_API_KEY` usage anywhere in `src/` after Task 5. Only serverless code reads `GEMINI_API_KEY`.
- Frontend API base: `import.meta.env.VITE_API_URL ?? '/api'`. Never hardcode localhost.
- Prisma models must NOT change (existing Neon data preserved).
- All new/changed code passes `npx eslint .` with zero errors; no new `any`.
- Commit after every task with the message given in the task.
- Work happens in the user's real folder (`nexus-mind-care`); the Linux build copy at `~/nmc` is only for running installs/builds/tests. Sync before each verify: `rsync -a --exclude node_modules --exclude dist --exclude .git /sessions/youthful-laughing-lovelace/mnt/nexus-mind-care/ ~/nmc/`.

---

### Task 0: Git baseline

**Files:** none created (repo init only). Modify: `.gitignore` (ensure `dist`, `node_modules`, `.env`, `graphify-out/cache` present).

- [ ] Step 1: `git init -b main && git add -A && git commit -m "chore: baseline before redesign"` (run in project root; verify `.env` NOT staged — `.gitignore` already lists it, confirm with `git status --ignored | grep .env`).
- [ ] Step 2: `git checkout -b redesign`

### Task 1: Test infrastructure (vitest)

**Files:**
- Modify: `package.json` (add devDeps `vitest`, `@vitest/coverage-v8`; script `"test": "vitest run"`)
- Create: `vitest.config.ts`

```ts
import { defineConfig } from 'vitest/config';
import path from 'path';
export default defineConfig({
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  test: { environment: 'node', include: ['tests/**/*.test.ts'] },
});
```

- Create: `tests/smoke.test.ts`

```ts
import { describe, it, expect } from 'vitest';
describe('smoke', () => { it('runs', () => expect(1 + 1).toBe(2)); });
```

- [ ] Step 1: `npm i -D vitest @vitest/coverage-v8` (in ~/nmc), mirror into project package.json
- [ ] Step 2: `npx vitest run` → 1 passing
- [ ] Step 3: Commit `test: add vitest infrastructure`

### Task 2: Prisma 7 migration fix

**Files:**
- Create: `prisma.config.ts`

```ts
import 'dotenv/config';
import { defineConfig } from 'prisma/config';
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: { url: process.env.DATABASE_URL! },
});
```

- Modify: `prisma/schema.prisma` — remove `url = env("DATABASE_URL")` line from `datasource db` block (keep `provider = "postgresql"`). Models untouched.
- Create: `api/_lib/prisma.ts`

```ts
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

- Create: `scripts/db-check.mjs` — connects via the same adapter, runs `prisma.user.count()` and prints counts for assessments, mood_entries, journal_entries, chat_rooms, mentors, events.

**Interfaces:** Produces `prisma` singleton consumed by every `api/` handler.

- [ ] Step 1: `npm i @prisma/adapter-pg pg` (and `npm i -D @types/pg`)
- [ ] Step 2: `npx prisma generate` → succeeds (previously failed with P1012)
- [ ] Step 3: `node scripts/db-check.mjs` → prints live counts from Neon
- [ ] Step 4: Commit `fix: migrate Prisma 7 config with pg driver adapter`

### Task 3: Shared serverless lib (validation + responses + gemini)

**Files:**
- Create: `api/_lib/http.ts`

```ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ZodSchema } from 'zod';

export function ok(res: VercelResponse, data: unknown, status = 200) {
  res.status(status).json({ ok: true, data });
}
export function fail(res: VercelResponse, message: string, status = 400) {
  res.status(status).json({ ok: false, error: message });
}
export function parseBody<T>(req: VercelRequest, res: VercelResponse, schema: ZodSchema<T>): T | null {
  const r = schema.safeParse(req.body);
  if (!r.success) { fail(res, r.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; '), 422); return null; }
  return r.data;
}
export function methodGuard(req: VercelRequest, res: VercelResponse, methods: string[]): boolean {
  if (!methods.includes(req.method ?? '')) { fail(res, `Method ${req.method} not allowed`, 405); return false; }
  return true;
}
```

- Create: `api/_lib/schemas.ts` — zod schemas: `UserUpsert` (clerkId, email, firstName?, lastName?, university?), `AssessmentSave` (clerkId, overallScore number, domainScores record, responses array, riskLevel enum low|moderate|high, summary string), `MoodSave` (clerkId, mood 1–5 int, note?, date iso), `JournalSave` (clerkId, title, content, mood?, tags string[]), `MedicineSave`, `ChatMessageSave` (roomId, clerkId, content, role enum user|assistant), `RoomCreate`, `GroupJoin`, `EventRegister`, `AiChat` (clerkId, messages array of {role, content}, language?), `AiAssessmentNext` (clerkId, previousResponses array, domain?), `AiMedicine` (clerkId, medicineName or imageless description).
- Create: `api/_lib/gemini.ts`

```ts
import { GoogleGenerativeAI } from '@google/generative-ai';
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
export const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
export async function generateJSON<T>(prompt: string): Promise<T> {
  const r = await model.generateContent({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { responseMimeType: 'application/json' } });
  return JSON.parse(r.response.text()) as T;
}
export async function generateText(system: string, messages: { role: string; content: string }[]): Promise<string> {
  const contents = messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
  const r = await model.generateContent({ contents, systemInstruction: { role: 'system', parts: [{ text: system }] } });
  return r.response.text();
}
```

- Create: `api/_lib/ratelimit.ts` — in-memory sliding window per clerkId (30 req/min AI, best-effort per serverless instance):

```ts
const hits = new Map<string, number[]>();
export function allow(key: string, limit = 30, windowMs = 60_000): boolean {
  const now = Date.now();
  const arr = (hits.get(key) ?? []).filter(t => now - t < windowMs);
  if (arr.length >= limit) return false;
  arr.push(now); hits.set(key, arr); return true;
}
```

- Test: `tests/schemas.test.ts` — valid + invalid case per schema (e.g. mood 0 rejected, mood 3 accepted; missing clerkId rejected).

**Interfaces:** Produces `ok/fail/parseBody/methodGuard`, `schemas.*`, `generateJSON/generateText`, `allow` for Tasks 4–5.

- [ ] Step 1: `npm i zod @vercel/node` (zod already present; add @vercel/node types)
- [ ] Step 2: Write tests, `npx vitest run` → schema tests pass
- [ ] Step 3: Commit `feat: shared serverless lib (http, schemas, gemini, ratelimit)`

### Task 4: Serverless API routes + local dev wrapper

**Files:**
- Create (each default-exports `(req: VercelRequest, res: VercelResponse)`):
  - `api/health.ts` — GET → `{status:'ok', db:true|false}` (tries `prisma.$queryRaw\`SELECT 1\``)
  - `api/users.ts` — POST upsert by clerkId
  - `api/assessments/index.ts` — POST save; GET `?clerkId=` list (desc by createdAt, take 20)
  - `api/mood/index.ts` — POST save; GET `?clerkId=` list (last 90 days)
  - `api/journal/index.ts` — POST create; GET `?clerkId=`; PUT update by `id`; DELETE by `id`
  - `api/medicine/index.ts` — POST save analysis; GET `?clerkId=` history
  - `api/chat/rooms.ts` — GET `?clerkId=` rooms for user (canonical; kills the `:clerkId`/`:roomId` collision); POST create room
  - `api/chat/messages.ts` — GET `?roomId=`; POST save message
  - `api/community/groups.ts` — GET list (single definition; merge logic of both old duplicates: include memberCount + joined flag when `?clerkId=` given)
  - `api/community/join.ts` — POST join group
  - `api/events/index.ts` — GET list with registration counts; POST `{action:'register'|'unregister', eventId, clerkId}` (replaces old POST/DELETE pair — Vercel file routing friendly)
  - `api/mentors/index.ts` — GET list; POST `{action:'login'|'logout', ...}` preserving old mentor session logic from `server.js:351-415`
- Modify: `server.js` → delete all inline routes; becomes ~40-line Express wrapper that imports each handler via `tsx` loader and mounts it (`app.all('/api/users', wrap(usersHandler))` …) on port 3001. Add devDep `tsx`; script `"server": "tsx server.ts"` (rename file `server.ts`).
- Delete: old route bodies in `server.js` (file replaced), duplicate routes gone.
- Test: `tests/api.handlers.test.ts` — invoke handlers directly with mock req/res (helper `mockRes()` capturing status/json). Cover: health returns ok; users POST with invalid body → 422; mood POST valid → 200 and row visible via GET; events register/unregister roundtrip. Uses real Neon DB with `TEST_` prefixed clerkIds, cleaned in `afterAll`.

**Interfaces:** Consumes Task 2 `prisma`, Task 3 lib. Produces REST endpoints consumed by Task 6 client: all respond `{ok:boolean, data|error}`.

- [ ] Step 1: Write `tests/api.handlers.test.ts` for health + users + mood → run, FAIL (handlers missing)
- [ ] Step 2: Implement handlers listed above (port logic from `server.js` lines noted; validate every body with Task 3 schemas)
- [ ] Step 3: `npx vitest run` → pass; `node scripts/db-check.mjs` still green
- [ ] Step 4: Rewrite dev wrapper `server.ts`; `curl localhost:3001/api/health` → `{"ok":true,...}`
- [ ] Step 5: Commit `feat: convert Express routes to Vercel serverless handlers`

### Task 5: Server-side AI endpoints; strip Gemini key from client

**Files:**
- Create: `api/ai/chat.ts` — POST `AiChat`; rate-limited (`allow(clerkId)` else 429); system prompt: Manas persona (empathetic companion for Indian college students, never diagnoses, suggests helplines KIRAN 1800-599-0019 / iCall 9152987821 on crisis signals); returns `{reply, crisis:boolean}` — crisis flag from server-side keyword+model check.
- Create: `api/ai/assessment.ts` — POST `AiAssessmentNext` → `generateJSON` returns `{question, options[4], domain, isComplete, scores?}` porting prompt logic from `src/components/ai/AIAssessmentEngine.tsx` and `DynamicScoringEngine.tsx`.
- Create: `api/ai/medicine.ts` — POST → structured `{name, uses, dosage, warnings, interactions, disclaimer}` port of `src/components/MedicineAI.tsx` prompt.
- Create: `api/ai/analyze.ts` — POST journal/mood text → `{sentiment, themes[], gentleSuggestion}` (replaces `server.js:334` `/api/analyze`).
- Create: `src/lib/ai.ts` — typed client: `aiChat(messages, clerkId)`, `aiNextQuestion(...)`, `aiMedicine(...)`, `aiAnalyze(...)` → fetch `${API_URL}/ai/*`.
- Create: `src/lib/crisis.ts` — client-side instant keyword list (English + Hinglish terms) exported `detectCrisis(text): boolean` + `HELPLINES` const (moved out of ChatBot).
- Modify: `src/components/ChatBot.tsx`, `src/components/MedicineAI.tsx`, `src/components/ai/AIAssessmentEngine.tsx`, `src/lib/aiAdvisoryService.ts` — replace direct `@google/generative-ai` calls with `src/lib/ai.ts` calls.
- Delete: `src/lib/gemini.ts` (570 lines, browser-side key usage).
- Modify: `src/main.tsx` — drop the `VITE_GEMINI_API_KEY` setup-error branch (only Clerk key required client-side).
- Test: `tests/ai.endpoints.test.ts` — chat handler: crisis message → `crisis:true` + helpline mention; rate limit: 31st call in loop → 429; assessment: returns valid JSON matching zod shape.

**Interfaces:** Produces `aiChat/aiNextQuestion/aiMedicine/aiAnalyze` + `detectCrisis/HELPLINES` consumed by Tasks 10–14.

- [ ] Step 1: Write failing endpoint tests → run, FAIL
- [ ] Step 2: Implement the 4 endpoints + client libs; migrate components; delete `src/lib/gemini.ts`
- [ ] Step 3: `npx vitest run` pass; `grep -r "VITE_GEMINI" src/` → no results; `npx vite build` OK
- [ ] Step 4: Commit `feat: server-side AI endpoints; remove Gemini key from client bundle`

### Task 6: Typed frontend API client

**Files:**
- Rewrite: `src/lib/api.ts`

```ts
const API_URL = import.meta.env.VITE_API_URL ?? '/api';
type Envelope<T> = { ok: true; data: T } | { ok: false; error: string };
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { headers: { 'Content-Type': 'application/json' }, ...init });
  const body = (await res.json()) as Envelope<T>;
  if (!body.ok) throw new ApiError(body.error, res.status);
  return body.data;
}
export class ApiError extends Error { constructor(msg: string, public status: number) { super(msg); } }
export const api = {
  upsertUser: (u: UserUpsert) => request<User>('/users', { method: 'POST', body: JSON.stringify(u) }),
  saveAssessment: (a: AssessmentSave) => request<Assessment>('/assessments', { method: 'POST', body: JSON.stringify(a) }),
  getAssessments: (clerkId: string) => request<Assessment[]>(`/assessments?clerkId=${clerkId}`),
  saveMood: (m: MoodSave) => request<MoodEntry>('/mood', { method: 'POST', body: JSON.stringify(m) }),
  getMoodHistory: (clerkId: string) => request<MoodEntry[]>(`/mood?clerkId=${clerkId}`),
  // journal, medicine, chat rooms/messages, groups, join, events, mentors — same pattern, all typed
};
```

- Create: `src/types/api.ts` — interfaces mirroring Task 3 zod schemas (single source listed here; do not redefine in components).
- Modify: `src/contexts/CommunityContext.tsx` — remove hardcoded localhost, use `api.*`.
- Modify: consumers of old `api` (`UserDashboard.tsx`, `ChatContext.tsx`, journal/mood components) to new method names.
- Test: `tests/apiClient.test.ts` — with mocked global fetch: unwraps `{ok:true}`, throws `ApiError` with status on `{ok:false}`.

**Interfaces:** Consumes Task 4 endpoints. Produces `api.*`, `ApiError`, `src/types/api.ts` types for all UI tasks.

- [ ] Step 1: Failing client tests → implement → pass
- [ ] Step 2: `grep -rn "localhost:3001" src/` → no results; `npx vite build` OK
- [ ] Step 3: Commit `refactor: typed api client with env-based base URL`

### Task 7: Design system foundation

**Files:**
- Modify: `package.json` — `npm i @fontsource-variable/fraunces @fontsource-variable/inter`
- Create: `src/styles/tokens.css`

```css
:root {
  --canvas: #F6F2E9; --canvas-deep: #EFE9DB;
  --ink: #2E3440; --ink-soft: #6B6455; --ink-faint: #8A8271;
  --sage: #7C9A83; --sage-deep: #5F7A66; --sage-tint: rgba(124,154,131,.14);
  --lavender: #A99BC7; --lavender-tint: rgba(169,155,199,.16);
  --clay: #D9A886; --clay-tint: rgba(217,168,134,.18);
  --glass: rgba(255,255,255,.62); --glass-border: rgba(224,217,200,.8);
  --shadow-soft: 0 8px 30px -8px rgba(62,74,64,.14);
  --shadow-lift: 0 18px 40px -12px rgba(62,74,64,.25);
  --radius-card: 1rem; --radius-pill: 999px;
  --font-display: 'Fraunces Variable', serif; --font-body: 'Inter Variable', system-ui, sans-serif;
}
.dark {
  --canvas: #141A18; --canvas-deep: #0F1412;
  --ink: #F4F1EA; --ink-soft: rgba(244,241,234,.65); --ink-faint: rgba(244,241,234,.45);
  --sage: #9DBFA6; --sage-deep: #7C9A83; --sage-tint: rgba(124,154,131,.18);
  --lavender: #CFC4E4; --lavender-tint: rgba(169,155,199,.2);
  --clay: #E8CDB6; --clay-tint: rgba(217,168,134,.16);
  --glass: rgba(255,255,255,.07); --glass-border: rgba(255,255,255,.13);
  --shadow-soft: 0 8px 30px -8px rgba(0,0,0,.5); --shadow-lift: 0 18px 40px -12px rgba(0,0,0,.6);
}
```

- Rewrite: `src/index.css` — `@tailwind` directives, font imports, `@import './styles/tokens.css'`, base (`body { background: var(--canvas); color: var(--ink); font-family: var(--font-body); }`), keyframes `drift`, `floaty`, `shimmer`, `fadeUp`, `pulse-dot` (values from approved mockup), `.glass-card` utility, journal-calendar styles rewritten WITHOUT `!important` using the tokens. `App.css` deleted, contents folded in if still referenced.
- Modify: `tailwind.config.cjs` — `darkMode: 'class'`; extend colors (`canvas`, `ink`, `sage`, `lavender`, `clay` mapped to vars), fontFamily (`display`, `body`), borderRadius, boxShadow (`soft`, `lift`), animation/keyframes for the five animations.
- Create: `src/components/theme/ThemeProvider.tsx` (next-themes, attribute="class", defaultTheme="light") and `src/components/theme/ThemeToggle.tsx` (sun/moon icon button).
- Create: `src/components/visual/Aurora.tsx` — absolutely-positioned blurred blobs + particles (props: `variant: 'hero' | 'subtle'`), exactly the drift/pulse layout from the approved mockup, `pointer-events-none`, respects `prefers-reduced-motion` (blobs static).
- Create: `src/components/visual/GlassCard.tsx` — `<div className="glass-card">` wrapper with optional `hoverLift` prop (motion `whileHover={{y:-6}}`).
- Create: `src/components/visual/Reveal.tsx` — motion `whileInView` fade-up wrapper (props: `delay?`).
- Create: `src/components/visual/GradientButton.tsx` — pill button, variants `primary` (sage gradient + glow) / `ghost` (glass).
- Modify: `src/App.tsx` — wrap tree in `ThemeProvider`.
- Delete: `src/App.css`.

**Interfaces:** Produces `Aurora`, `GlassCard`, `Reveal`, `GradientButton`, `ThemeToggle`, token classes for Tasks 8–14.

- [ ] Step 1: Implement all files; `npx vite build` OK
- [ ] Step 2: `npm run dev` in ~/nmc, screenshot `/` via Chrome tools → fonts + canvas tokens render
- [ ] Step 3: Commit `feat: design system tokens, theme, visual primitives`

### Task 8: Navigation + Footer

**Files:**
- Rewrite: `src/components/Navigation.tsx` — glass sticky navbar: logo `Manas` (ink) + `Swasthya` (sage) in Fraunces; links Dashboard/Chat/Assessment/Journal/Community/Resources/Booking; active = sage underline (motion `layoutId`); right: ThemeToggle + Clerk `UserButton`; mobile: hamburger → vaul drawer. Transparent-over-aurora on `/`, `--glass` elsewhere (detect via `useLocation`).
- Create: `src/components/Footer.tsx` — three columns (brand+tagline, quick links, helplines KIRAN/iCall always visible), crisis disclaimer line, copyright.
- Modify: `src/App.tsx` — render Footer on public pages.

- [ ] Step 1: Implement; verify keyboard nav + mobile drawer in browser; screenshot desktop + 390px
- [ ] Step 2: Commit `feat: redesigned navigation and footer`

### Task 9: Landing page (dark aurora showpiece)

**Files:**
- Rewrite: `src/pages/Landing.tsx` — forced-dark section (`class="dark"` on page root regardless of theme): hero (Aurora variant="hero", badge pill with pulsing dot, Fraunces 64px headline with shimmer `<em>`, sub, two GradientButtons, three floating GlassCards exactly per approved mockup); stats band (4 animated count-up numbers: students reached, assessments, chat sessions, always free — motion `useInView` + counter); "How it works" 3 steps with Reveal stagger; features grid (6 GlassCards: chat, assessment, journal, community, resources, medicine AI); testimonial carousel (embla, 3 written student quotes, no real names); final CTA section; Footer.
- Create: `src/components/landing/StatsBand.tsx`, `src/components/landing/FeatureGrid.tsx`, `src/components/landing/Testimonials.tsx` (keep Landing.tsx < 250 lines).

- [ ] Step 1: Build sections; `npx vite build` OK
- [ ] Step 2: Browser screenshots desktop + mobile; verify animations + reduced-motion fallback
- [ ] Step 3: Commit `feat: dark aurora landing page`

### Task 10: Dashboard

**Files:**
- Rewrite: `src/components/UserDashboard.tsx` (split into `src/components/dashboard/`):
  - `DashboardHeader.tsx` — Fraunces greeting by time of day, date, streak pill (data: consecutive days with mood entries).
  - `MoodTrendCard.tsx` — recharts AreaChart of last 14 mood entries (sage stroke, `--sage-tint` fill), empty state "Log your first mood".
  - `WellnessScoreCard.tsx` — latest assessment `overallScore` in Fraunces 40px, delta vs previous, ring gauge.
  - `QuickActions.tsx` — 4 glass tiles → chat/assessment/journal/community.
  - `RecentActivity.tsx` — last 5 items across assessments/journal/mood, merged + sorted.
  - `index.tsx` — grid layout per approved dashboard mockup; all data via `api.*` with React Query (`useQuery`), skeleton loaders, `ErrorBoundary`.
- Create: `src/components/ErrorBoundary.tsx` — class component, friendly glass fallback + retry.

**Interfaces:** Consumes `api.getMoodHistory`, `api.getAssessments`, journal list.

- [ ] Step 1: Implement; verify with a signed-in Clerk test user; empty-state screenshots too
- [ ] Step 2: `npx vitest run` (streak calc unit test in `tests/streak.test.ts`: gaps break streak, today counts)
- [ ] Step 3: Commit `feat: redesigned dashboard with live data`

### Task 11: Assessment consolidation

**Files:**
- Create: `src/features/assessment/AssessmentFlow.tsx` — states `intro → question → analyzing → results`; question step calls `aiNextQuestion` (Task 5), progress = domains covered (6 chips); analyzing = lottie breathing animation; results = animated score ring, per-domain bars, risk level badge, AI summary, "Download report" (jsPDF already used by FullReport — port it), auto-save via `api.saveAssessment`.
- Create: `src/features/assessment/ScoreRing.tsx`, `DomainBars.tsx`.
- Modify: `src/pages/Assessment.tsx` — renders only `AssessmentFlow`.
- Modify: `src/components/FullReport.tsx` — reskin, consume new result type.
- Delete: `src/components/SmartAssessment.tsx`, `src/components/TakeAssessment.tsx`, `src/components/DynamicAssessment.tsx`, `src/components/Assessment.tsx`, `src/components/TestAIAssessment.tsx`, `src/pages/TestAI.tsx`; remove `/test-ai` route from `App.tsx`; port any unique prompt/scoring logic into `api/ai/assessment.ts` BEFORE deleting (diff check).
- Test: `tests/assessment.reducer.test.ts` — flow state machine transitions (intro→question on start, question→results when `isComplete`).

- [ ] Step 1: Extract state machine as pure reducer; failing tests → implement → pass
- [ ] Step 2: Wire UI; full run in browser against live `api/ai/assessment`
- [ ] Step 3: `grep -rn "SmartAssessment\|TakeAssessment\|TestAI" src/` → no results; build OK
- [ ] Step 4: Commit `feat: single adaptive assessment flow; remove 4 legacy variants`

### Task 12: Chat redesign + single context

**Files:**
- Merge: `src/contexts/chat-context.tsx` INTO `src/contexts/ChatContext.tsx` (keep the DB-backed room/message logic; type all `any`s with `src/types/api.ts`); delete `chat-context.tsx`; update its importers.
- Rewrite: `src/components/ChatBot.tsx` → `src/features/chat/` (`ChatSurface.tsx` message list with motion entrance, Manas avatar (sage gradient circle), typing indicator dots; `Composer.tsx` textarea + voice input (existing SpeechRecognition logic, typed); `CrisisBanner.tsx` appears when `detectCrisis` fires — helplines, non-dismissable during session; `SuggestedPrompts.tsx` 4 starter chips).
- Modify: `src/pages/Chat.tsx` — cream glass layout, room sidebar (history), uses `aiChat`.

- [ ] Step 1: Implement; browser test: send message → Gemini reply renders; crisis phrase → banner + `crisis:true` styling
- [ ] Step 2: `grep -rn "chat-context" src/` → no results; build + lint clean for these files
- [ ] Step 3: Commit `feat: redesigned chat with crisis banner; single chat context`

### Task 13: Journal + mood

**Files:**
- Reskin: `src/pages/Journal.tsx`, `src/components/journal/*` (editor, calendar, templates, stickers), `src/components/mood/MoodTracker.tsx` — tokens/GlassCard/Reveal; calendar CSS now token-based (Task 7 removed `!important` styles — verify visual parity); mood picker = 5 animated emoji-free faces (SVG, sage→clay scale); journal save → `api` journal CRUD; insights card calls `aiAnalyze` on save.
- Type all `any`s in these files.

- [ ] Step 1: Implement; browser: create entry → appears in calendar + dashboard RecentActivity
- [ ] Step 2: Commit `feat: redesigned journal and mood tracking`

### Task 14: Community, Booking, Resources, About, NotFound

**Files:**
- Reskin: `src/pages/Community.tsx` + `src/components/community/*` (groups grid with join, events list with register via `api` events action endpoint, mentors row), `src/components/PeerForum.tsx`, `src/pages/Booking.tsx` (stepper: counselor → slot → confirm; confirmation state with motion check; persists via existing chat/room or events model — no schema change), `src/pages/Resources.tsx` + `ResourceHub.tsx` (search + category filter chips), `src/pages/About.tsx`, `src/pages/NotFound.tsx` (lost-lotus illustration, home CTA).
- Fix `Community.tsx` useEffect deps warning (wrap fetches in `useCallback`).

- [ ] Step 1: Implement page by page; browser-verify each (join group, register event roundtrip)
- [ ] Step 2: Commit `feat: reskin community, booking, resources, about, 404`

### Task 15: Performance + lint zero

**Files:**
- Modify: `src/App.tsx` — `React.lazy` every page; `<Suspense fallback={<PageSkeleton/>}>`; create `src/components/PageSkeleton.tsx` (glass shimmer blocks).
- Modify: `vite.config.ts` — `build.rollupOptions.output.manualChunks`: `vendor-react`, `vendor-clerk`, `vendor-charts` (recharts), `vendor-motion`.
- Fix: all remaining ESLint errors project-wide (the `any`s in `PWAInstallPrompt`, `RichTextEditor`, `GroupDiscussion`, hooks warnings).

- [ ] Step 1: `npx vite build` → largest chunk < 400 kB gzip; record sizes
- [ ] Step 2: `npx eslint .` → 0 errors 0 warnings
- [ ] Step 3: Commit `perf: route code splitting + manual chunks; lint clean`

### Task 16: Production packaging

**Files:**
- Create: `vercel.json`

```json
{
  "rewrites": [
    { "source": "/api/:path*", "destination": "/api/:path*" },
    { "source": "/((?!api).*)", "destination": "/index.html" }
  ],
  "functions": { "api/**/*.ts": { "maxDuration": 30 } }
}
```

- Modify: `index.html` — title "ManasSwasthya — AI mental wellness for students", meta description, OG/Twitter tags with `/public/og.png` (generate 1200×630 dark-aurora card), theme-color `#141A18`.
- Modify: `.env.example` — trim to actually-used vars: `VITE_CLERK_PUBLISHABLE_KEY`, `VITE_API_URL` (optional), `DATABASE_URL`, `GEMINI_API_KEY`; delete unused Stack/Vercel-postgres blocks.
- Create: `scripts/seed.mjs` — idempotent demo data: 4 mentors, 5 events (future dates), 6 community groups.
- Rewrite: `README.md` — hero screenshot, badges, features, architecture diagram (mermaid), local setup, deploy-to-Vercel steps, env table, screenshots gallery.
- Verify PWA: `public/manifest.json` icons/name/theme updated to new brand.

- [ ] Step 1: Implement; `node scripts/seed.mjs` → seeded (run twice, no dupes)
- [ ] Step 2: Commit `chore: vercel config, SEO, seed, README`

### Task 17: Final verification (gate)

- [ ] Step 1: Fresh sync to ~/nmc; `npm ci`-equivalent install; `npx prisma generate`; `npx vitest run`; `npx eslint .`; `npx vite build` — all green, paste outputs
- [ ] Step 2: Run `server.ts` + `vite preview`; browser walkthrough of ALL routes signed-out and signed-in; screenshot each (desktop + 390px, light + dark); confirm: chat replies, assessment full run, journal save, mood save, group join, event register, booking confirm
- [ ] Step 3: `grep -rn "VITE_GEMINI\|localhost:3001" src/ api/` → empty; verify built `dist/assets/*.js` contains no `AIza` string
- [ ] Step 4: `git checkout main && git merge redesign`; tag `v1.0.0`
- [ ] Step 5: `graphify update .` per project CLAUDE.md
- [ ] Step 6: Present final report + deployment instructions to user

## Self-review notes

- Spec coverage: audit fixes → Tasks 2,4,5,6,15; design system → 7; pages → 8–14; polish → 16; verification → 17. Seed/demo data (spec "Data") → Task 16. Crisis client+server → Tasks 5,12. PWA manifest → 16. `/test-ai` removal → 11.
- Type consistency: envelope `{ok,data|error}` defined Task 3, consumed Task 6; `AiChat` names match between schemas (T3), endpoints (T5), client (T5/T6).
- No placeholder steps: repetitive page tasks specify exact files, sections, data calls, and verification actions rather than code-for-code's-sake; all novel logic (tokens, prisma adapter, http lib, client) has full code.
