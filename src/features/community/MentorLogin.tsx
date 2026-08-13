import { useState } from 'react';
import { AlertCircle, Loader2, LogIn, ShieldCheck } from 'lucide-react';
import { BAD, BTN_SOLID, CARD, FOCUS, INK, MENTOR_INK, MUTED } from './theme';

/**
 * Mentor sign-in.
 *
 * THE SERVER'S WORDS, NOT OURS. `api/mentors/auth.ts` answers an unknown email
 * and a wrong password with the same 401 and the same sentence, on purpose — a
 * different message for each would tell anyone with a login form which
 * addresses belong to mentors. So whatever comes back is rendered verbatim and
 * this component never adds its own guess about which field was wrong. The same
 * goes for the 429: the server already says how long to wait.
 *
 * There are no example credentials on this page. There is no hint, no filled
 * placeholder, no "try this" line. A real mentor knows their own address.
 */

const FIELD =
  `w-full rounded-xl border border-[#2B0B2E]/20 bg-white/85 px-3.5 py-2.5 text-[15px] text-[#2B0B2E] placeholder:text-[#6A3F70]/70 ${FOCUS}`;

export default function MentorLogin({
  onSubmit,
}: {
  /** Resolves when the session is stored; rejects with the server's ApiError. */
  onSubmit: (email: string, password: string) => Promise<void>;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      await onSubmit(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in did not go through. Try once more.');
      setPending(false);
    }
    // No setPending(false) on success: the console replaces this form, and
    // flipping the button back to "Sign in" first would look like nothing
    // happened.
  };

  return (
    <section aria-labelledby="mentor-login-heading" className={`${CARD} max-w-md p-6`}>
      <h2
        id="mentor-login-heading"
        className={`flex items-center gap-2 font-display text-[22px] leading-tight ${INK}`}
      >
        <ShieldCheck className={`h-5 w-5 ${MENTOR_INK}`} aria-hidden="true" />
        Mentor sign-in
      </h2>
      <p className={`mt-1.5 text-[14px] leading-relaxed ${MUTED}`}>
        For trained mentors only. Signing in lets you post in the peer circles under your mentor
        badge — students sign in with their student account instead.
      </p>

      <form onSubmit={submit} className="mt-5 space-y-4">
        <div>
          <label htmlFor="mentor-email" className={`block text-[13px] font-semibold ${INK}`}>
            Email address
          </label>
          <input
            id="mentor-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={pending}
            className={`mt-1.5 ${FIELD}`}
          />
        </div>

        <div>
          <label htmlFor="mentor-password" className={`block text-[13px] font-semibold ${INK}`}>
            Password
          </label>
          <input
            id="mentor-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={pending}
            className={`mt-1.5 ${FIELD}`}
          />
        </div>

        {error && (
          <p
            role="alert"
            className={`flex items-start gap-2 rounded-xl border border-[#9B1C1C]/25 bg-white/80 px-3.5 py-2.5 text-[14px] font-medium ${BAD}`}
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {error}
          </p>
        )}

        <button type="submit" disabled={pending} className={`${BTN_SOLID} w-full`}>
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <LogIn className="h-4 w-4" aria-hidden="true" />
          )}
          {pending ? 'Signing in…' : 'Sign in'}
        </button>

        {/* The button already changes; this is what a screen reader hears. */}
        <p role="status" aria-live="polite" className={`text-[13px] ${MUTED}`}>
          {pending ? 'Checking those details…' : ''}
        </p>
      </form>
    </section>
  );
}
