# Setup

From a clean machine to a running application.

- [Prerequisites](#prerequisites)
- [Install](#install)
- [Environment variables](#environment-variables)
- [Database](#database)
- [Running it](#running-it)
- [Seeding demo data](#seeding-demo-data)
- [Scripts](#scripts)
- [Deploying](#deploying)
- [Things that go wrong](#things-that-go-wrong)

---

## Prerequisites

| | Version | Notes |
|---|---|---|
| Node | 20 or newer | 22 is what this was developed against |
| npm | 10+ | ships with Node 20 |
| Postgres | any | [Neon](https://console.neon.tech) free tier is fine |
| Clerk account | — | [dashboard.clerk.com](https://dashboard.clerk.com), free tier is fine |
| Gemini API key | — | [aistudio.google.com/apikey](https://aistudio.google.com/apikey), free tier is fine |

All four external services have free tiers that cover development.

---

## Install

```bash
git clone https://github.com/aniket-311211/Manas-Swasthya-2.0.git
cd Manas-Swasthya-2.0
npm install
```

---

## Environment variables

```bash
cp .env.example .env
```

Then fill it in. The four that are required:

### `VITE_CLERK_PUBLISHABLE_KEY`

Clerk dashboard → your application → **API Keys** → *Publishable key*. Starts
`pk_test_` or `pk_live_`.

This one is public by design — the `VITE_` prefix compiles it into the browser
bundle. That is correct for a publishable key and wrong for anything else.

While you are in Clerk, enable at least one sign-in method. Google works well
and is what the sign-in page is laid out for.

### `CLERK_SECRET_KEY`

Same page, *Secret key*. Starts `sk_test_` or `sk_live_`. **Server-only — no
`VITE_` prefix.**

Every user-scoped endpoint verifies the caller's session token against this. If
it is missing, `verifiedClerkId` returns null for every request and the whole API
answers 401. That is deliberate: a deployment that forgets this variable should
fail loudly rather than silently stop checking who is calling.

### `DATABASE_URL`

Neon → your project → **Connection string** → *Pooled connection*. Looks like:

```
postgresql://user:password@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require
```

Any Postgres works; Prisma connects through `@prisma/adapter-pg`.

### `GEMINI_API_KEY`

[aistudio.google.com/apikey](https://aistudio.google.com/apikey) → *Create API
key*. **Server-only.**

Without it the four AI endpoints return 503 and everything else works normally.

> If you have ever seen `VITE_GEMINI_API_KEY` in a `.env` for this project,
> delete it and rotate the key. That prefix ships the key to every browser.

### Optional

| Variable | Effect if unset |
|---|---|
| `BOOKING_COUPON_CODES` | No waiver code works. Format `CODE:Label,CODE2:Label2`. |
| `BOOKING_FEE_PAISE` | Defaults to `49900` (₹499). |
| `MENTOR_INVITE_CODES` | **Mentor signup is closed.** Set your own codes to open it. |
| `MENTOR_SEED_PASSWORD` | Seed script generates one and prints it once. |
| `PORT` | Defaults to 3001. |
| `VITE_API_URL` | Defaults to `/api`, correct for both Vercel and the local proxy. |

Both code lists default to empty on purpose. A fresh clone inherits no working
discounts and accepts no mentor signups until you configure your own.

---

## Database

```bash
npx prisma generate      # build the typed client
npx prisma db push       # create the tables — first run only
```

`db push` is used rather than migrations because the schema is still moving. If
you fork this for production, switch to `prisma migrate` so schema changes are
reviewable and reversible.

Check it worked:

```bash
npm run db:check
```

---

## Running it

Two processes: the API and the web server.

```bash
npm run dev:all
```

That runs both under `concurrently` — API on **:3001**, Vite on **:8080**, with
`/api` proxied. Open <http://localhost:8080>.

Separately, if you prefer:

```bash
npm run server    # tsx watch server.ts  → :3001
npm run dev       # vite                 → :8080
```

Sign up through the UI. The first request after sign-in syncs your Clerk account
into the local `users` table and assigns you a mentor automatically.

---

## Seeding demo data

Neither script is required; both are safe to re-run.

### Mentors

```bash
MENTOR_SEED_PASSWORD='choose-something-long' node scripts/seed-mentors.mjs
```

Creates five mentors with bcrypt-hashed passwords. The password comes from the
environment so it never enters the repository — omit it and the script generates
one and prints it once.

The script also deletes leftover mentors from earlier seeds, **except** any whose
conversations contain real messages. Those are retired instead: hidden from the
directory and unable to sign in, but their history survives. No seed script gets
to delete somebody's conversation.

### Activities

```bash
node scripts/seed-events.mjs
```

Seven activities at offsets from the moment you run it: one live, six upcoming.
They drift into the past over time — re-run when the board looks stale.

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server on :8080 |
| `npm run server` | API on :3001 with watch |
| `npm run dev:all` | Both, side by side |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve the built bundle |
| `npm test` | Vitest — 516 tests |
| `npm run lint` | ESLint |
| `npm run db:push` | Push schema to the database |
| `npm run db:generate` | Regenerate the Prisma client |
| `npm run db:check` | Connectivity and row counts |

---

## Deploying

Built for Vercel, but nothing is Vercel-specific beyond the handler signature.

1. Import the repository in Vercel.
2. Build command `npm run build`, output `dist`.
3. Add every variable from your `.env` **except** `PORT` to project settings.
4. Files under `api/` are picked up automatically as functions.

`npx prisma generate` must run at build time — Vercel does this automatically
when `prisma` is in `dependencies`, which it is.

**Before going to production:** switch `db push` to `prisma migrate`, and read
the "still open" section of [`SECURITY.md`](SECURITY.md) — the rate limiters
outside the medicine quota are in-memory and reset on cold start.

---

## Things that go wrong

**Everything returns 401.** `CLERK_SECRET_KEY` is missing or belongs to a
different Clerk application than the publishable key. Both must come from the
same one.

**`PrismaClientInitializationError`.** `DATABASE_URL` is wrong or the Neon
project is suspended — free-tier projects sleep. Open the Neon console to wake
it, then `npm run db:check`.

**AI endpoints return 503.** `GEMINI_API_KEY` is missing, invalid, or out of
quota. The server logs the real reason; the client deliberately gets a generic
message.

**Tests fail with `Cannot find module @rollup/rollup-linux-*`.** `node_modules`
was installed on a different OS or architecture. `rm -rf node_modules && npm install`.

**Tests fail on connection.** The suite runs against a real database rather than
mocking Prisma, so `DATABASE_URL` must be set. Point it at a scratch database if
you would rather not write to your main one; the tests clean up after themselves.

**Mentor signup rejects every code.** Expected until you set
`MENTOR_INVITE_CODES`. Empty means closed.

**Activities all say "This one has finished".** The seeded dates have aged out.
Re-run `node scripts/seed-events.mjs`.

**The page looks dark.** A browser extension is forcing dark mode. The app is
light-only and sets `color-scheme: only light`; Brave's aggressive dark mode
overrides it anyway.
