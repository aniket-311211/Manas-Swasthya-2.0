import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, CalendarCheck, Check, Loader2, Ticket } from 'lucide-react';
import { ApiError, api } from '@/lib/api';
import type { Booking, Mentor } from '@/types/api';
import {
  BAD,
  BTN_QUIET,
  BTN_SOLID,
  CARD,
  FOCUS,
  GOOD,
  INK,
  MUTED,
  STANDARD_FEE_PAISE,
  formatFee,
  formatWhen,
  nextNDays,
  slotsForDay,
} from './booking';

/**
 * Pick a slot, then ask the server for it.
 *
 * THE PRICE IS NOT DECIDED HERE. This sheet shows the standard fee so the page
 * is not blank, and it collects a coupon code and a registration number — but
 * it does not know which coupons exist and it cannot tell a real registration
 * number from a plausible one. It posts what the user typed; `createBooking`
 * comes back with `feePaise`, `feeWaived` and `waiverReason` already decided,
 * and the confirmation renders THOSE. A client that could compute the waiver
 * could also grant itself one.
 */

const MODES: { value: Booking['mode']; label: string }[] = [
  { value: 'video', label: 'Video call' },
  { value: 'audio', label: 'Voice call' },
  { value: 'chat', label: 'Text chat' },
  { value: 'in_person', label: 'In person' },
];

const DURATION_MIN = 45;
const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
const clock = (d: Date) => {
  const h = d.getHours();
  return `${h % 12 === 0 ? 12 : h % 12}:${String(d.getMinutes()).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`;
};

const LABEL = 'block text-[13px] font-semibold text-[#1B2430]';
const FIELD = `mt-1.5 w-full rounded-[14px] border border-[#1B2430]/20 bg-white/80 px-3.5 py-2.5 text-[14px] text-[#1B2430] placeholder:text-[#5A6472]/70 ${FOCUS}`;
/** The label a hidden radio drives. Checked state is a fill AND a weight change. */
const CHIP =
  'block cursor-pointer rounded-[14px] border border-[#1B2430]/20 bg-white/70 px-3.5 py-2 text-center text-[13px] text-[#1B2430] transition-colors peer-hover:bg-white peer-checked:border-[#1B2430] peer-checked:bg-[#1B2430] peer-checked:font-semibold peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-[#1B2430] peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[#EDF0C9] peer-disabled:cursor-not-allowed peer-disabled:opacity-45';

export default function BookingSheet({
  mentor,
  clerkId,
  onClear,
}: {
  mentor: Mentor | null;
  clerkId: string;
  onClear: () => void;
}) {
  const queryClient = useQueryClient();
  // One clock reading for the life of the sheet. Slots are filtered against it;
  // if it goes stale the server refuses the booking and we print why.
  const [now] = useState(() => new Date());

  const [dayId, setDayId] = useState('');
  const [slotIso, setSlotIso] = useState('');
  const [mode, setMode] = useState<Booking['mode']>('video');
  const [note, setNote] = useState('');
  const [coupon, setCoupon] = useState('');
  const [registrationNo, setRegistrationNo] = useState('');

  const days = useMemo(() => nextNDays(14, now), [now]);
  const bookable = useMemo(
    () => new Set(days.filter((d) => slotsForDay(d, now).length > 0).map(dayKey)),
    [days, now],
  );

  // Derived, not stored: changing the day drops a slot that no longer exists
  // without an effect to keep in sync.
  const day = days.find((d) => dayKey(d) === dayId) ?? days.find((d) => bookable.has(dayKey(d))) ?? days[0];
  const slots = useMemo(() => (day ? slotsForDay(day, now) : []), [day, now]);
  const slot = slots.find((s) => s.toISOString() === slotIso) ?? null;

  const create = useMutation({
    mutationFn: (scheduledAt: string) =>
      api.createBooking({
        clerkId,
        mentorId: mentor!.id,
        mentorName: mentor!.name,
        mode,
        scheduledAt,
        durationMin: DURATION_MIN,
        note: note.trim() || null,
        // Asked for, never granted here.
        couponCode: coupon.trim() || null,
        registrationNo: registrationNo.trim() || null,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookings', clerkId] }),
  });

  const failure = create.error instanceof ApiError ? create.error.message : create.error ? 'We could not reach the server. Please try again.' : null;
  // The server names the field it rejected; a coupon complaint belongs beside
  // the coupon box, not in a general error strip.
  const couponFailure = failure && /coupon/i.test(failure) ? failure : null;
  const booked = create.data ?? null;

  const startOver = () => {
    create.reset();
    setSlotIso('');
    setNote('');
    setCoupon('');
    setRegistrationNo('');
  };

  if (!mentor) {
    return (
      <section aria-labelledby="sheet-heading" className={`${CARD} p-6`}>
        <h2 id="sheet-heading" className={`font-display text-[22px] ${INK}`}>
          Book a consultation
        </h2>
        <p className={`mt-1.5 text-[14px] ${MUTED}`}>
          Choose someone from the deck above and this fills in with their next free slots.
        </p>
      </section>
    );
  }

  return (
    <section aria-labelledby="sheet-heading" className={`${CARD} p-6`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="sheet-heading" className={`font-display text-[22px] leading-tight ${INK}`}>
            Book with {mentor.name}
          </h2>
          <p className={`mt-1 text-[14px] ${MUTED}`}>
            {mentor.specialization ?? 'General wellbeing support'} · {DURATION_MIN}-minute session
          </p>
        </div>
        <button type="button" onClick={onClear} className={`${BTN_QUIET} !py-2 text-[13px]`}>
          Choose someone else
        </button>
      </div>

      {/* The booking result. Present in the DOM at all times so a screen reader
          announces it when it fills, rather than when it appears. */}
      <div role="status" aria-live="polite">
        {booked && (
          <div className="mt-5 rounded-[16px] border border-[#146356]/35 bg-white/85 p-5">
            <p className={`flex items-center gap-2 font-display text-[19px] ${INK}`}>
              <CalendarCheck className="h-5 w-5 text-[#146356]" aria-hidden="true" />
              You are booked in
            </p>
            <dl className="mt-3 space-y-1.5 text-[14px]">
              <div className="flex justify-between gap-4">
                <dt className={MUTED}>With</dt>
                <dd className={`font-semibold ${INK}`}>{booked.mentorName}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className={MUTED}>When</dt>
                <dd className={`font-semibold ${INK}`}>{formatWhen(booked.scheduledAt)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className={MUTED}>Length</dt>
                <dd className={`font-semibold ${INK}`}>{booked.durationMin} minutes</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className={MUTED}>Fee</dt>
                <dd className={`font-semibold ${booked.feeWaived ? GOOD : INK}`}>
                  {formatFee(booked.feePaise)}
                  {booked.feeWaived && (booked.waiverReason === 'student' ? ' — waived, student registration' : ' — waived, coupon applied')}
                </dd>
              </div>
            </dl>
            <p className={`mt-3 text-[13px] ${MUTED}`}>
              {booked.feeWaived
                ? 'Nothing to pay. This is what the server recorded against your booking.'
                : 'Payment is collected at the session, not here.'}
            </p>
            <button type="button" onClick={startOver} className={`${BTN_QUIET} mt-4`}>
              Book another session
            </button>
          </div>
        )}
      </div>

      {!booked && (
        <form
          className="mt-5 space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            if (slot) create.mutate(slot.toISOString());
          }}
        >
          <fieldset>
            <legend className={LABEL}>Day</legend>
            <div className="mt-2 flex gap-2 overflow-x-auto pb-2">
              {days.map((d) => {
                const id = dayKey(d);
                const free = bookable.has(id);
                return (
                  <label key={id} className="relative shrink-0">
                    <input
                      type="radio"
                      name="booking-day"
                      value={id}
                      checked={day ? dayKey(day) === id : false}
                      disabled={!free}
                      onChange={() => {
                        setDayId(id);
                        setSlotIso('');
                      }}
                      className="peer sr-only"
                    />
                    <span className={`${CHIP} w-[4.75rem] px-2`}>
                      <span className="block font-mono text-[10px] uppercase tracking-[0.1em] opacity-80">
                        {WEEKDAY[d.getDay()]}
                      </span>
                      <span className="block text-[15px] font-semibold">{d.getDate()}</span>
                      <span className="block font-mono text-[10px] uppercase tracking-[0.1em] opacity-80">
                        {free ? MONTH[d.getMonth()] : 'Full'}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <fieldset>
            <legend className={LABEL}>Time</legend>
            {slots.length === 0 ? (
              <p className={`mt-2 text-[14px] ${MUTED}`}>No slots left on this day. Try the next one.</p>
            ) : (
              <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {slots.map((s) => {
                  const iso = s.toISOString();
                  return (
                    <label key={iso} className="relative">
                      <input
                        type="radio"
                        name="booking-slot"
                        value={iso}
                        checked={slotIso === iso}
                        onChange={() => setSlotIso(iso)}
                        className="peer sr-only"
                      />
                      <span className={CHIP}>{clock(s)}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </fieldset>

          <fieldset>
            <legend className={LABEL}>How you would like to meet</legend>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {MODES.map((m) => (
                <label key={m.value} className="relative">
                  <input
                    type="radio"
                    name="booking-mode"
                    value={m.value}
                    checked={mode === m.value}
                    onChange={() => setMode(m.value)}
                    className="peer sr-only"
                  />
                  <span className={CHIP}>{m.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div>
            <label htmlFor="booking-note" className={LABEL}>
              Anything they should know first (optional)
            </label>
            <textarea
              id="booking-note"
              rows={3}
              value={note}
              maxLength={2000}
              onChange={(e) => setNote(e.target.value)}
              placeholder="A sentence or two is plenty. Skip it if you would rather talk in person."
              className={`${FIELD} resize-y`}
            />
          </div>

          {/* Fee. Everything in this block is a request, not a calculation. */}
          <div className="rounded-[16px] border border-[#1B2430]/15 bg-white/55 p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className={`text-[15px] font-semibold ${INK}`}>Fee</h3>
              <p className={`text-[15px] font-semibold ${INK}`}>
                {formatFee(STANDARD_FEE_PAISE)}{' '}
                <span className={`text-[13px] font-normal ${MUTED}`}>per {DURATION_MIN}-minute session</span>
              </p>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="booking-coupon" className={LABEL}>
                  Coupon code (optional)
                </label>
                <input
                  id="booking-coupon"
                  type="text"
                  value={coupon}
                  maxLength={32}
                  autoComplete="off"
                  spellCheck={false}
                  aria-invalid={!!couponFailure}
                  aria-describedby={couponFailure ? 'booking-coupon-error' : undefined}
                  onChange={(e) => setCoupon(e.target.value)}
                  placeholder="If you were given one"
                  className={`${FIELD} font-mono uppercase tracking-[0.08em] ${couponFailure ? 'border-[#9B1C1C]' : ''}`}
                />
                {couponFailure && (
                  <p id="booking-coupon-error" className={`mt-1.5 flex items-start gap-1.5 text-[13px] font-medium ${BAD}`}>
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    {couponFailure}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="booking-reg" className={LABEL}>
                  Student registration number (optional)
                </label>
                <input
                  id="booking-reg"
                  type="text"
                  value={registrationNo}
                  maxLength={32}
                  autoComplete="off"
                  spellCheck={false}
                  aria-describedby="booking-reg-help"
                  onChange={(e) => setRegistrationNo(e.target.value)}
                  placeholder="e.g. 21BCE1234"
                  className={`${FIELD} font-mono uppercase tracking-[0.08em]`}
                />
                <p id="booking-reg-help" className={`mt-1.5 text-[13px] ${MUTED}`}>
                  <span className={`font-semibold ${GOOD}`}>The fee is waived</span> if you are a student
                  registered on the platform with a valid registration number. Enter it here and we will
                  apply the waiver.
                </p>
              </div>
            </div>

            <p className={`mt-4 flex items-start gap-2 text-[13px] ${MUTED}`}>
              <Ticket className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              We check the code and the registration number when you confirm. The amount on your
              confirmation is the real one — this page only shows the standard rate.
            </p>
          </div>

          {failure && !couponFailure && (
            <p role="alert" className={`flex items-start gap-2 text-[14px] font-medium ${BAD}`}>
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {failure}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" disabled={!slot || create.isPending} className={BTN_SOLID}>
              {create.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Confirming…
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" aria-hidden="true" /> Confirm booking
                </>
              )}
            </button>
            <p className={`text-[13px] ${MUTED}`}>
              {slot
                ? `${formatWhen(slot.toISOString())} · ${MODES.find((m) => m.value === mode)?.label}`
                : 'Pick a time above to continue.'}
            </p>
          </div>
        </form>
      )}
    </section>
  );
}
