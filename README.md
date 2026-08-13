# Manas Swasthya

A mental-health platform for Indian college students. Mood tracking, a private
journal, a validated self-assessment, peer circles, one-to-one mentoring,
bookable counselling, a resource library, an AI companion, and a medicine
identifier — in one place, in four languages.

Built as a full-stack TypeScript application: React on the front, serverless
handlers over Postgres on the back, Clerk for identity, Gemini for the AI
features.

```
516 tests · 32 suites · 0 lint errors · 0 type errors · 22 API endpoints · 4 languages
```

---

## Contents

- [What it does](#what-it-does)
- [Demos](#demos)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Folder structure](#folder-structure)
- [Setup](#setup)
- [Security](#security)
- [Testing](#testing)
- [Further reading](#further-reading)

---

## What it does

| Section | What a student can do |
|---|---|
| **Dashboard** | A daily ritual that changes through the day, a mood check-in, a rhythm chart over 90 days, a wellness score, their next booked session, recent journal entries, and an activity they have joined. |
| **Chat** | An AI companion with server-side crisis detection. If a message reads as distress, helplines surface immediately rather than waiting on the model. |
| **Journal** | A rich notebook: two themes, stickers, photos, audio clips, bold/italic text, a calendar view, and an AI mood read that lands on the calendar and feeds a live mood index. |
| **Assessment** | Twelve fixed questions across six domains of student life, plus AI follow-ups chosen from the answers. Scored, tracked over time, with a radar against last time and a "what changed" narrative. |
| **Booking** | Browse consultants, book a session, redeem a waiver code or claim the student registration waiver. Pricing is decided entirely server-side. |
| **Resources** | A catalogue with per-type viewers — a PDF reader, a music player with a spinning disc, a video player, an article reader — searchable by name or by code. |
| **Community** | Three tabs behind one page: assigned and chosen mentors with private 1:1 threads, peer circles with group chat, and joinable activities. Mentors sign in separately. |
| **Medicine AI** | Photograph a strip or type a name; get what it treats, how it is taken, what would mean stopping, and how it interacts with mental-health medication. Five checks a day. |

---

## Demos

Every section, in the order it was built. The previews play automatically at
full resolution — click any of them for the H.264 original.

### Landing page

The public front page.

[![Landing page demo](docs/demo/preview/00-landing-page.webp)](docs/demo/00-landing-page.mp4)

<sub>▶ [Full resolution (00-landing-page.mp4)](docs/demo/00-landing-page.mp4)</sub>

### 1 · Dashboard

The editorial bento layout: daily ritual, mood check-in, 90-day rhythm, wellness score, next booked session, journal snippets, community and resources.

[![1 · Dashboard demo](docs/demo/preview/01-dashboard.webp)](docs/demo/01-dashboard.mp4)

<sub>▶ [Full resolution (01-dashboard.mp4)](docs/demo/01-dashboard.mp4)</sub>

### 2 · Chat

The AI companion. Crisis detection runs server-side on every message, independent of the model, so helplines surface even when the model misses it.

[![2 · Chat demo](docs/demo/preview/02-chat.webp)](docs/demo/02-chat.mp4)

<sub>▶ [Full resolution (02-chat.mp4)](docs/demo/02-chat.mp4)</sub>

### 3 · Journal

Two themes, stickers, photos, audio clips, rich text and a calendar. The AI reads the mood of an entry and lands it on the calendar, feeding a live mood index.

[![3 · Journal demo](docs/demo/preview/03-journal.webp)](docs/demo/03-journal.mp4)

<sub>▶ [Full resolution (03-journal.mp4)](docs/demo/03-journal.mp4)</sub>

### 4 · Assessment

Twelve fixed questions across six domains, AI follow-ups chosen from the answers, a radar against last time and a plain-language "what changed".

[![4 · Assessment demo](docs/demo/preview/04-assessment.webp)](docs/demo/04-assessment.mp4)

<sub>▶ [Full resolution (04-assessment.mp4)](docs/demo/04-assessment.mp4)</sub>

### 5 · Booking

The consultant deck, session booking, and waiver codes. Pricing is decided entirely server-side — the browser cannot propose a fee.

[![5 · Booking demo](docs/demo/preview/05-booking.webp)](docs/demo/05-booking.mp4)

<sub>▶ [Full resolution (05-booking.mp4)](docs/demo/05-booking.mp4)</sub>

### 6 · Resources

MagicBento cards, category filtering, search by name or by code, and a viewer per media type — PDF reader, music player, video, article.

[![6 · Resources demo](docs/demo/preview/06-resources.webp)](docs/demo/06-resources.mp4)

<sub>▶ [Full resolution (06-resources.mp4)](docs/demo/06-resources.mp4)</sub>

### 7 · Community

Mentors, peer circles and events behind one sub-navigation. Private 1:1 threads, group chat, and a separate mentor sign-in.

[![7 · Community demo](docs/demo/preview/07-community.webp)](docs/demo/07-community.mp4)

<sub>▶ [Full resolution (07-community.mp4)](docs/demo/07-community.mp4)</sub>

### 8 · Medicine AI

Photograph a strip or type a name; get what it treats, how it is taken, and what would mean stopping. Five checks a day.

[![8 · Medicine AI demo](docs/demo/preview/08-medicine-ai.webp)](docs/demo/08-medicine-ai.mp4)

<sub>▶ [Full resolution (08-medicine-ai.mp4)](docs/demo/08-medicine-ai.mp4)</sub>

<details>
<summary><b>Why these are WebP, and how to get real video players</b></summary>

<br>

GitHub strips `<video>` tags out of README files, so a link to an `.mp4` in the
repository renders as a link and nothing else. Inline players only exist for
files uploaded through GitHub's own attachment flow, which cannot be scripted.

The previews are therefore **animated WebP** — native resolution, 15 fps, full
length, 24-bit colour. GitHub renders these inline and animated.

GIF was tried first and cannot do this. The community clip as a 1080px GIF is
**101 MB** against **11 MB** as WebP, because GIF is limited to a 256-colour
palette and compresses each frame independently. Worse, a GIF that size decodes
entirely into memory — over a gigabyte for that one file — so the page would
stall on load. Dropping GIF to a size that renders means dropping to 480px and
64 colours, which is what the first version of this README did, and the text was
unreadable.

The recordings have no audio, so resolution is the only thing WebP gives up
against the MP4 — and at native resolution it gives up very little.

To get native players with a seek bar, about ten minutes:

1. Open a new issue in this repository (do not submit it).
2. Drag `docs/demo/01-dashboard.mp4` into the comment box and wait for upload.
3. Copy the `https://github.com/user-attachments/assets/…` URL it produces.
4. Paste that URL **on its own line** in this README, replacing the image line
   for that section.
5. Repeat for the other eight, then close the issue without submitting.

</details>

---

## Tech stack

```mermaid
graph TB
    subgraph Browser
        R["React 18.3<br/>TypeScript 5.8"]
        RQ["TanStack Query 5<br/>server state + cache"]
        RR["React Router 6<br/>routing"]
        TW["Tailwind 3.4<br/>styling"]
        OGL["ogl<br/>Silk WebGL shader"]
        M["motion<br/>animation"]
        I18["i18next<br/>en · hi · or · ks"]
    end

    subgraph Edge
        V["Vite 5<br/>dev server + build"]
        EX["Express 5<br/>local API mirror"]
    end

    subgraph Server
        API["22 serverless handlers<br/>api/**"]
        Z["Zod<br/>request + model-output validation"]
        CB["@clerk/backend<br/>session token verification"]
        BC["bcryptjs<br/>mentor passwords"]
    end

    subgraph Data
        PR["Prisma 7.8<br/>+ @prisma/adapter-pg"]
        PG[("Neon Postgres<br/>15 models")]
    end

    subgraph External
        CL["Clerk<br/>student identity"]
        GM["Google Gemini<br/>gemini-flash-latest"]
        ZQ["ZenQuotes<br/>assessment quotes"]
    end

    R --> RQ --> API
    R --> RR
    R --> TW
    R --> OGL
    R --> M
    R --> I18
    V -.dev proxy.-> EX --> API
    API --> Z
    API --> CB --> CL
    API --> BC
    API --> PR --> PG
    API --> GM
    API --> ZQ
```

| Layer | Choice | Why |
|---|---|---|
| Framework | React 18.3 + TypeScript 5.8 | Strict mode on; 0 type errors across ~300 files |
| Build | Vite 5 | Dev proxy sends `/api` to the local Express mirror |
| Server state | TanStack Query 5 | Shared cache keys mean a write on one page refreshes another |
| Styling | Tailwind 3.4 | Light-only; `color-scheme: only light`, no `dark:` variants |
| Backgrounds | `ogl` | react-bits Silk ported from React Three Fiber, which needs React 19 |
| Animation | `motion` | `useReducedMotion` guards every animation |
| Auth (students) | Clerk | Session tokens verified server-side against `CLERK_SECRET_KEY` |
| Auth (mentors) | bcrypt + opaque tokens | Separate system; server-side sessions so they can be revoked |
| Database | Neon Postgres + Prisma 7.8 | Driver adapter `@prisma/adapter-pg` |
| Validation | Zod | Every request body and every model response |
| AI | Gemini `gemini-flash-latest` | Chat, journal mood, assessment follow-ups, medicine |
| i18n | i18next | English, Hindi, Odia, Kashmiri — with RTL for Kashmiri |
| Tests | Vitest | 516 tests, node environment, live database |

---

## Architecture

```mermaid
flowchart LR
    U(["Student"]) --> APP["React SPA"]
    M(["Mentor"]) --> APP

    APP -->|"Bearer &lt;clerk jwt&gt;<br/>X-Manas-Language"| GATE{"api/_lib/clerkAuth<br/>verifyToken"}
    APP -->|"Bearer &lt;mentor session&gt;"| MGATE{"api/_lib/mentorAuth<br/>MentorSession lookup"}

    GATE -->|401| REJ["Rejected"]
    MGATE -->|401| REJ

    GATE -->|"verified user row"| H["Handlers"]
    MGATE -->|"verified mentor row"| H

    H --> Q["api/_lib/quota<br/>daily allowance in Postgres"]
    H --> DB[("Postgres")]
    H --> AI["api/_lib/gemini"]

    Q -->|"over limit"| REJ
```

**The rule the whole backend follows:** identity is never taken from the request
body. Every user-scoped endpoint resolves the caller through
`requireVerifiedUser(req, res)`, which verifies a Clerk-signed session token. A
`clerkId` in a body or query string is a claim anyone can make, and treating it
as proof is how the earlier version of this codebase leaked journals and let
strangers spend the owner's Gemini quota.

Order of operations on a paid endpoint is deliberate: **verify identity →
reserve the quota → spend money.** Doing any of those later leaves a way to get
the expensive part for free.

Full detail, including the data model and every endpoint's identity source, is in
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

---

## Folder structure

```
ManasSwasthya2.0/
├── api/                          22 serverless handlers (Vercel-style)
│   ├── _lib/                     shared server code — not routable
│   │   ├── clerkAuth.ts          Clerk token verification, requireVerifiedUser
│   │   ├── mentorAuth.ts         bcrypt + MentorSession, LOCKED_PASSWORD
│   │   ├── quota.ts              database-backed daily AI allowance (IST days)
│   │   ├── medicine.ts           medicine prompt, output schema, image sniffing
│   │   ├── language.ts           validated language header → prompt instruction
│   │   ├── gemini.ts             model client with retries
│   │   ├── schemas.ts            every Zod request schema
│   │   ├── http.ts               ok/fail/parseBody/methodGuard/withErrors
│   │   ├── prisma.ts             singleton client + pg adapter
│   │   ├── assignMentor.ts       one mentor per student at sign-up
│   │   └── ratelimit.ts          in-memory window limiter
│   ├── ai/                       chat · analyze · assessment · medicine
│   ├── mentors/                  index · auth · signup · threads
│   ├── community/                groups · join · messages
│   ├── chat/                     rooms · messages
│   ├── assessments · bookings · events · journal · medicine · mood · quotes
│   ├── users.ts                  Clerk → local user sync
│   └── health.ts
│
├── src/
│   ├── pages/                    one file per route
│   ├── features/                 the substance of each section
│   │   ├── assessment/           item bank, scoring, history, radar, quotes
│   │   ├── booking/              consultant deck, sheet, my-bookings, pricing view
│   │   ├── chat/                 composer, bubbles, crisis banner, orb
│   │   ├── community/            mentors, circles, activities, mentor console
│   │   ├── journal/              editor, browse, AI mood, themes, media, prefs
│   │   ├── medicine/             report, image preparation, theme
│   │   └── resources/            catalogue, media resolution, players, grid
│   ├── components/
│   │   ├── dashboard/            the bento cards
│   │   ├── shell/                AppShell, AppTopBar, shared theme tokens
│   │   ├── Silk/ MagicBento/     vendored react-bits visuals
│   │   └── ui/                   10 shadcn primitives actually in use
│   ├── auth/                     Clerk sign-in / sign-up / sign-out pages
│   ├── lib/                      api client, languages, crisis, resources, utils
│   ├── types/                    shared API types
│   └── i18n.ts                   locale loading, direction, persistence
│
├── prisma/schema.prisma          15 models
├── locales/{en,hi,or,ks}/        76 strings each, key-for-key identical
├── tests/                        32 suites, 516 tests
├── scripts/                      seed-mentors · seed-events · db-check
├── docs/                         architecture · setup · security · demo videos
└── server.ts                     Express mirror of the serverless handlers
```

---

## Setup

Short version. The long version, including how to get each key and what can go
wrong, is in [`docs/SETUP.md`](docs/SETUP.md).

**Requires** Node 20+, a Neon (or any) Postgres database, a Clerk application,
and a Google Gemini API key.

```bash
git clone https://github.com/aniket-311211/Manas-Swasthya-2.0.git
cd Manas-Swasthya-2.0
npm install

cp .env.example .env          # then fill it in — see docs/SETUP.md
npx prisma generate
npx prisma db push            # first run only

npm run dev:all               # API on :3001, Vite on :8080
```

Open <http://localhost:8080>.

Optional demo data:

```bash
MENTOR_SEED_PASSWORD='choose-something-long' node scripts/seed-mentors.mjs
node scripts/seed-events.mjs   # activities dated relative to now; re-run when stale
```

---

## Security

This repository is public. Everything sensitive is configuration, not code.

**Nothing secret is committed.** `.env` is git-ignored and has never been
committed — verified against the full history, not just the working tree.
`.env.example` carries names and placeholders only.

**Waiver codes and mentor invite codes come from the environment.** They used to
be literals in `api/bookings/index.ts` and `api/mentors/signup.ts`. In a public
repository a hardcoded discount code is a discount anyone can redeem, and a
hardcoded mentor invite code means a stranger can register as a counsellor and
start receiving messages from students in distress. Both now read from
`BOOKING_COUPON_CODES` and `MENTOR_INVITE_CODES`, and both **default to empty** —
a fresh clone has no working codes and accepts no mentor signups until you
configure your own.

**If you clone this, you get no credentials.** You will need your own Clerk
application, your own database, and your own Gemini key. Nothing in this
repository will authenticate against anyone else's deployment.

The threat model, the full endpoint-by-endpoint identity table, and the list of
vulnerabilities that were found and closed are in
[`docs/SECURITY.md`](docs/SECURITY.md).

---

## Testing

```bash
npm test                                   # 516 tests
npx eslint src/ api/ tests/                # 0 errors
npx tsc --noEmit -p tsconfig.app.json      # 0 errors
npm run build
```

The suite talks to a real database rather than mocking Prisma, so `DATABASE_URL`
must be set. Clerk's signature check is the one thing stubbed —
`tests/setup/clerk.ts` replaces `verifyToken` only, so every other part of the
auth path runs for real, including the 401s.

Coverage is weighted towards the things that would hurt: who can read a private
thread, whether a booking price can be forged, whether the last seat in a session
can be sold twice, whether a refusal from the medicine model is charged or
refunded.

---

## Further reading

| Document | What is in it |
|---|---|
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Data model, every endpoint, request lifecycle, front-end patterns, design system |
| [`docs/SETUP.md`](docs/SETUP.md) | Every environment variable, where to get each key, common failures |
| [`docs/SECURITY.md`](docs/SECURITY.md) | Threat model, identity table, what was fixed, what is still open |

---

## Licence

No licence file is included, so by default all rights are reserved: others may
view the code but not reuse it. Add a `LICENSE` if you want to permit reuse —
MIT is the usual choice for a project like this.
