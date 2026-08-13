import { useState } from 'react';
import { AlertCircle, Loader2, ShieldCheck, UserPlus } from 'lucide-react';
import { BAD, BTN_SOLID, CARD, FOCUS, INK, MENTOR_INK, MUTED } from './theme';

/**
 * Mentor self-signup.
 *
 * NOTHING SECRET IS ON THIS PAGE. The invite codes live in
 * `api/mentors/signup.ts` and are checked there; a code, an example address or a
 * sample password printed here would ship in the bundle, and a published code is
 * not a gate. So this form has labels and rules, and no values.
 *
 * THE SERVER'S WORDS, NOT OURS. A bad code and an address that is already a
 * mentor both come back as the same 403 with the same sentence, on purpose —
 * otherwise this form tells anyone who asks which addresses are registered. So
 * whatever the server says is rendered verbatim and this component never adds a
 * guess about which field was wrong.
 */

const FIELD =
  `w-full rounded-xl border border-[#2B0B2E]/20 bg-white/85 px-3.5 py-2.5 text-[15px] text-[#2B0B2E] placeholder:text-[#6A3F70]/70 ${FOCUS}`;

export default function MentorSignup({
  onSubmit,
}: {
  /** Resolves once the new mentor is signed in; rejects with the server's ApiError. */
  onSubmit: (fields: {
    name: string;
    email: string;
    password: string;
    specialization?: string;
    inviteCode: string;
  }) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      await onSubmit({ name, email, password, specialization, inviteCode });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That did not go through. Try once more.');
      setPending(false);
    }
    // No setPending(false) on success: the console replaces this form.
  };

  return (
    <section aria-labelledby="mentor-signup-heading" className={`${CARD} max-w-md p-6`}>
      <h2
        id="mentor-signup-heading"
        className={`flex items-center gap-2 font-display text-[22px] leading-tight ${INK}`}
      >
        <ShieldCheck className={`h-5 w-5 ${MENTOR_INK}`} aria-hidden="true" />
        Create a mentor account
      </h2>
      <p className={`mt-1.5 text-[14px] leading-relaxed ${MUTED}`}>
        Any email address works. The invite code is what proves you were asked to do this — students
        write to mentors about their mental health, so the door is not open to everyone.
      </p>

      <form onSubmit={submit} className="mt-5 space-y-4">
        <div>
          <label htmlFor="signup-name" className={`block text-[13px] font-semibold ${INK}`}>
            Your name
          </label>
          <p className={`mt-0.5 text-[12px] ${MUTED}`}>Students see this on every message you send.</p>
          <input
            id="signup-name"
            name="name"
            type="text"
            autoComplete="name"
            required
            maxLength={80}
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={pending}
            className={`mt-1.5 ${FIELD}`}
          />
        </div>

        <div>
          <label htmlFor="signup-email" className={`block text-[13px] font-semibold ${INK}`}>
            Email address
          </label>
          <input
            id="signup-email"
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
          <label htmlFor="signup-password" className={`block text-[13px] font-semibold ${INK}`}>
            Password
          </label>
          {/* The rule, not an example. minLength is the same 10 the server enforces. */}
          <p className={`mt-0.5 text-[12px] ${MUTED}`}>At least 10 characters, and not all digits.</p>
          <input
            id="signup-password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={10}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={pending}
            className={`mt-1.5 ${FIELD}`}
          />
        </div>

        <div>
          <label htmlFor="signup-specialization" className={`block text-[13px] font-semibold ${INK}`}>
            Specialisation <span className={`font-normal ${MUTED}`}>(optional)</span>
          </label>
          <input
            id="signup-specialization"
            name="specialization"
            type="text"
            maxLength={80}
            value={specialization}
            onChange={(e) => setSpecialization(e.target.value)}
            disabled={pending}
            className={`mt-1.5 ${FIELD}`}
          />
        </div>

        <div>
          <label htmlFor="signup-invite" className={`block text-[13px] font-semibold ${INK}`}>
            Invite code
          </label>
          <p className={`mt-0.5 text-[12px] ${MUTED}`}>
            Issued by the wellbeing team when your training is signed off. Codes are not listed
            anywhere on this site — ask them if you do not have one.
          </p>
          <input
            id="signup-invite"
            name="inviteCode"
            type="text"
            autoComplete="off"
            required
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            disabled={pending}
            className={`mt-1.5 font-mono uppercase tracking-[0.08em] ${FIELD}`}
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
            <UserPlus className="h-4 w-4" aria-hidden="true" />
          )}
          {pending ? 'Creating your account…' : 'Create account'}
        </button>

        <p role="status" aria-live="polite" className={`text-[13px] ${MUTED}`}>
          {pending ? 'Checking your invite code…' : ''}
        </p>
      </form>
    </section>
  );
}
