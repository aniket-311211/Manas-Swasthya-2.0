import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useUser } from '@clerk/clerk-react';
import { useReducedMotion } from 'motion/react';
import { ArrowUpRight, HeartHandshake } from 'lucide-react';
import Silk from '@/components/Silk/Silk';
import type { Mentor } from '@/types/api';
import MentorDeck from '@/features/booking/MentorDeck';
import BookingSheet from '@/features/booking/BookingSheet';
import MyBookings from '@/features/booking/MyBookings';
import { BTN_SOLID, CARD, INK, MUTED, ON_SILK, ON_SILK_MUTED, ON_SILK_PANEL } from '@/features/booking/booking';

/** The practitioner intake that already exists. No endpoint is invented here. */
const JOIN_FORM =
  'https://docs.google.com/forms/d/e/1FAIpQLSeuybOszANh7YX1YJbusdjuAh3lJ-gzGX1VeaZjLGd8lbEjtg/viewform';

function JoinTeam() {
  return (
    <section aria-labelledby="join-heading" className={`${CARD} p-6`}>
      <p className={`flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] ${ON_SILK_MUTED}`}>
        <HeartHandshake className="h-3.5 w-3.5" aria-hidden="true" /> For practitioners
      </p>
      <h2 id="join-heading" className={`mt-2 font-display text-[22px] leading-tight ${ON_SILK}`}>
        Join the ManasSwasthya team
      </h2>
      <p className={`mt-2 max-w-2xl text-[14px] leading-relaxed ${MUTED}`}>
        We are a student mental-health platform, so most of the work is short one-to-one sessions with
        people in their late teens and twenties — exam pressure, sleep, homesickness, first experiences
        of anxiety. Sessions run 45 minutes, online unless you offer in-person, and you set your own
        availability.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <h3 className={`text-[14px] font-semibold ${INK}`}>What you would be doing</h3>
          <ul className={`mt-1.5 space-y-1 text-[14px] ${MUTED}`}>
            <li>· One-to-one consultations booked through this page</li>
            <li>· Occasional group or peer-support sessions</li>
            <li>· Escalating anything that needs clinical care beyond a session</li>
          </ul>
        </div>
        <div>
          <h3 className={`text-[14px] font-semibold ${INK}`}>What we ask for</h3>
          <ul className={`mt-1.5 space-y-1 text-[14px] ${MUTED}`}>
            <li>· A recognised qualification in psychology, psychiatry or counselling</li>
            <li>· Current registration or licence where your practice requires one</li>
            <li>· Experience with young adults, and comfort working online</li>
          </ul>
        </div>
      </div>

      <a
        href={JOIN_FORM}
        target="_blank"
        rel="noopener noreferrer"
        className={`${BTN_SOLID} mt-5`}
      >
        Register your interest <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
      </a>
      <p className={`mt-2.5 text-[13px] ${MUTED}`}>
        Opens our intake form in a new tab. Someone reads it and replies by email — usually within a
        week. There is no automated screening and nothing is decided by this page.
      </p>
    </section>
  );
}

export default function Booking() {
  const { t } = useTranslation();
  const { user } = useUser();
  const reduceMotion = useReducedMotion();
  const [mentor, setMentor] = useState<Mentor | null>(null);

  const select = (m: Mentor) => {
    setMentor(m);
    // The sheet is further down the page; nothing focusable is skipped, so a
    // scroll is enough — tab order already continues into it.
    document.getElementById('sheet-heading')?.scrollIntoView({
      behavior: reduceMotion ? 'auto' : 'smooth',
      block: 'center',
    });
  };

  return (
    <div className="relative flex min-h-[calc(100vh-4.25rem)] flex-col">
      {/*
        Silk canvas. `fixed` so it spans the viewport under the sticky top bar;
        pointer-events-none so it never eats a click on a slot. Reduced motion
        falls back to the flat colour — same hex, so contrast is identical.

        #cfd84c is a bright yellow-green: white text sits at about 1.6:1 on it
        and is unreadable. Everything above it is dark ink on frosted white.
      */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 bg-[#cfd84c]">
        {!reduceMotion && (
          <Silk speed={5.8} scale={1.3} color="#cfd84c" noiseIntensity={2.2} rotation={0} />
        )}
      </div>

      <div className="relative mx-auto w-full max-w-5xl flex-1 space-y-6 px-4 py-10 lg:px-6">
        <header className={ON_SILK_PANEL}>
          <h1 className={`flex items-center gap-3 font-display text-[34px] leading-tight ${ON_SILK}`}>
                <img
                  src="/logos/manas_swasthya_logo_white.png"
                  alt=""
                  className="h-10 w-auto shrink-0 drop-shadow-[0_1px_3px_rgba(0,0,0,0.55)]"
                />
                {t('page.booking')}
              </h1>
          <p className={`mt-2 max-w-2xl text-[15px] leading-relaxed ${ON_SILK_MUTED}`}>
            Pick a consultant, pick a time, and we will hold the slot. Sessions are 45 minutes.
            Students registered on the platform do not pay for them.
          </p>
        </header>

        <MentorDeck selectedId={mentor?.id ?? null} onSelect={select} />
        <BookingSheet mentor={mentor} clerkId={user?.id ?? ''} onClear={() => setMentor(null)} />
        <MyBookings clerkId={user?.id ?? ''} />
        <JoinTeam />
      </div>
    </div>
  );
}
