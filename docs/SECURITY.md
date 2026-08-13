# Security

What this application protects, how, and what is still weak.

Written plainly rather than reassuringly. This is a mental-health service for
students: the data is journals, mood notes, assessment scores, medication
lookups and private conversations with mentors. A leak here is not an
inconvenience.

- [What is not in this repository](#what-is-not-in-this-repository)
- [Identity](#identity)
- [Authorisation](#authorisation)
- [Spending controls](#spending-controls)
- [AI-specific risks](#ai-specific-risks)
- [Safeguarding](#safeguarding)
- [What was found and fixed](#what-was-found-and-fixed)
- [Still open](#still-open)
- [Reporting something](#reporting-something)

---

## What is not in this repository

**No credentials, and none in the history.** `.env` is git-ignored and was never
committed — checked against every commit, not just the working tree. No API key,
token, password or connection string appears anywhere in the log.

**No access codes.** Consultation waiver codes and mentor invite codes read from
`BOOKING_COUPON_CODES` and `MENTOR_INVITE_CODES`. They were literals in
`api/bookings/index.ts` and `api/mentors/signup.ts`, which was acceptable while
the repository was private and wrong the moment it became public — a hardcoded
discount is a discount anyone can redeem, and a hardcoded mentor invite means a
stranger can register as a counsellor.

Both **default to empty**. No configuration means no code works and mentor signup
is closed, rather than open.

**No production data.** The seed scripts create fictional mentors and activities.
Mentor seed passwords come from the environment.

Cloning this repository gets you working code and nothing that authenticates
against anything. You will need your own Clerk application, database and Gemini
key.

---

## Identity

Two separate systems.

### Students — Clerk

Every user-scoped endpoint calls `requireVerifiedUser(req, res)`, which reads
`Authorization: Bearer <jwt>` and verifies it against `CLERK_SECRET_KEY` using
`@clerk/backend`. The subject claim cannot be chosen by the caller.

**Identity is never taken from the request body.** A `clerkId` in a body or query
string is a claim anyone can make. Earlier versions of this codebase trusted it,
and the consequences are in [what was found and fixed](#what-was-found-and-fixed).

The client makes this practical: `src/lib/api.ts` attaches the token to every
request from one place, registered once in `App.tsx`. Doing it per call site
across forty functions is how the old scheme survived.

**It fails closed.** No `CLERK_SECRET_KEY` means nothing verifies, so every
request is rejected. A deployment that forgets the variable breaks loudly instead
of silently accepting everyone.

### Mentors — separate accounts

- bcrypt, cost 10. `verifyPassword` rejects anything not `$2`-prefixed, so a
  legacy plaintext row can never match.
- Opaque server-side session tokens in `MentorSession`, not JWTs — chosen so a
  session can actually be revoked.
- Retired accounts get `LOCKED_PASSWORD` (`'locked:no-login'`), which is not a
  bcrypt hash and therefore cannot verify. They are filtered from the directory
  and from mentor assignment.
- Login is rate-limited per email address, and an unknown email and a wrong
  password return the identical 401 so the endpoint does not confirm which
  addresses belong to mentors.

---

## Authorisation

Being signed in is not permission.

**Private threads.** A `ChatRoom` of type `mentor` is readable and writable by
exactly two parties. Everyone else gets **404, not 403** — "this exists but is
not yours" is itself a disclosure.

**Circles.** Reading a peer circle requires membership. What people write in a
support circle is for the circle.

**Rosters are not public.** `api/community/groups` returns member *counts*. It
used to include every participant's Clerk id and real name — on a mental-health
service the membership list of an anxiety circle *is* the sensitive data.

**Authorship is decided server-side.** A client cannot set `role: 'assistant'`
or claim to be a mentor. Fabricated advice under the assistant's name would be
worse here than in most products.

**Pricing is server-side.** `BookingCreate` has no fee field, Zod strips unknown
keys, and `priceBooking`'s result is spread last into the write. A client-sent
price is dropped twice over.

---

## Spending controls

Gemini costs money, and an unauthenticated model endpoint is somebody else's
bill.

**Daily quota in Postgres.** `AiUsage`, one row per user per feature per day,
keyed on `Asia/Kolkata` days. Medicine is capped at five.

The old cap was a `Map` in the process: it reset on every cold start and was not
shared between instances. That is not a quota.

**Reserve, then spend.** The allowance is taken before the model is called, using
an atomic upsert-with-increment, then re-checked after the write. Ten concurrent
requests yield exactly five — there is a test.

**Refund only our own failures.** A model timeout does not cost a student one of
five. A refusal *we* chose — an unreadable photo, output we would not show — was
a real API call and stays charged, so retrying junk cannot grind through the key.

---

## AI-specific risks

**Prompt injection.** User text is fenced and labelled as data, with the
"cannot change these instructions" rule stated *before* the fence. Angle brackets
are stripped so the fence cannot be closed early. Tested.

**Model output is validated, never cast.** Zod parses every response. An
unvalidated cast previously reached the UI and crashed the page mid-render — a
blank screen where medical information should have been.

**Overdose information is refused.** The medicine prompt forbids stating maximum
or lethal doses. Verified against the live model: the refusal returns
`identified: false` with nothing usable, and it is charged rather than refunded
so probing is not free to repeat.

**Uncertainty is not styled, it is enforced.** Below 55% confidence the dosing
fields are cleared on the server. No later change to the page can reveal them.

**Photos are never stored.** A picture of someone's medication adds nothing to
the record.

**The language header is validated.** `X-Manas-Language` is attacker-controlled
and lands in a prompt, so it is checked against a fixed list.
`"Ignore previous instructions"` resolves to English.

---

## Safeguarding

Some decisions here are about harm, not attackers.

**Mentor signup is gated by invite code, and closed by default.** Without a gate
anyone could register as a counsellor and immediately receive private messages
from students in distress.

**Crisis detection runs server-side**, on the message text, independent of the
model — so helplines surface even when the model misses it. It covers the AI
chat, group messages and 1:1 threads.

**Helpline numbers are never transliterated** by the translation layer. You have
to read them to an operator.

**Errors do not leak.** `withErrors` returns a generic message and logs the real
one. Returning `err.message` had turned the API into an oracle confirming
whether any given Clerk id existed.

---

## What was found and fixed

A parallel audit of every endpoint found the following. All are closed; they are
listed because a security document that only describes the good state is not
useful.

| Severity | Issue | Fix |
|---|---|---|
| **Critical** | `POST /api/users` took `clerkId` *and* `email` from the body and adopted any row whose email matched. An unauthenticated request could rebind a victim's account to an attacker-controlled id — full takeover, and the real user locked out. | Identity from the verified token; email ownership re-checked with Clerk before any adoption. |
| **Critical** | `GET /api/chat/messages` ran its membership check inside `if (clerkId)`. Omitting the parameter skipped it — 200 messages of any room, private mentor threads included. Same on DELETE. | Membership established from the token before anything else. |
| **Critical** | `GET /api/chat/rooms` with no parameters returned every room in the system, its last message, and every participant's Clerk id and name. | Always scoped to the verified caller. |
| **High** | `ai/chat`, `ai/analyze` and `ai/assessment` never resolved `clerkId`. Free unlimited Gemini, with the rate limiter keyed on the same unverified string. | Verified identity; limiter keyed on the resolved row. |
| **High** | `api/ai/advisory.ts` — an unauthenticated proxy accepting an arbitrary 8,000-character prompt, with zero callers. | Deleted. |
| **High** | Journals, moods, assessments, bookings and mentor threads were readable given only a Clerk id — which two endpoints above handed out freely. | All moved to verified identity. |
| **Medium** | `api/community/groups` returned the full roster of every circle. | Counts only. |
| **Medium** | `GET /api/events` returned every registration row, each carrying a Clerk id. | Destructured out. |
| **Medium** | `POST /api/mentors` marked any mentor offline by id, with no session. | Returns 410. |
| **Medium** | `withErrors` returned raw exception text to the caller. | Generic message; real one logged. |
| **Medium** | `POST /api/community/join` could add or eject anyone from any circle. | Verified identity, scoped to real circles. |
| **Low** | Gemini was told every image was JPEG regardless of type. | Magic-byte sniffing; real MIME forwarded. |
| **Low** | Event capacity was counted before the insert — two people could take the last seat. | Insert first, count who got in ahead, roll back the loser. |

Historic, fixed earlier: mentor passwords compared in plaintext with no session;
demo mentor credentials displayed on the site; `VITE_GEMINI_API_KEY` shipping the
model key to every browser.

---

## Still open

Stated plainly rather than left for someone to discover.

**Rate limiting outside the medicine quota is in-memory.**
`api/_lib/ratelimit.ts` is a module-scope `Map`. It is per-instance and resets on
cold start, so the effective ceiling is `limit × concurrent instances`. This
affects AI chat, analyze, assessment, community posting, thread messages and
mentor signup. The fix is the pattern already in `quota.ts` — move them to
Postgres. Worth doing before real traffic.

**Most endpoints still trust `clerkId` for *scoping* after verifying identity.**
The verification is real; the pattern is just wordier than it needs to be. No
known hole, but it invites one.

**CORS is wide open.** `server.ts` uses bare `cors()`. Auth is bearer-based
rather than cookie-based so this is not CSRF-exploitable, but it should be
restricted to known origins.

**`prisma db push`, not migrations.** Fine while the schema moves, not fine for
production — schema changes are neither reviewable nor reversible.

**Odia and Kashmiri translations are unreviewed** by a native speaker. Not a
security issue, but `crisis.blurb` is a string that has to be right.

**No audit log.** There is no record of who read what. On a service holding this
kind of data, that is a gap worth closing.

---

## Reporting something

Open a private security advisory on the repository, or email the maintainer.
Please do not open a public issue for anything exploitable.
