import { useAuth } from '@clerk/clerk-react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '@/auth/AuthLayout';

export default function SignOutPage() {
  const { signOut, isSignedIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let live = true;
    const go = () => {
      if (live) navigate('/', { replace: true });
    };

    if (!isSignedIn) {
      go();
      return;
    }
    // A failed sign-out must still get them off this page — leaving someone
    // stranded on a spinner is worse than a redirect that half-worked.
    signOut().then(go).catch(go);

    return () => {
      live = false;
    };
  }, [isSignedIn, signOut, navigate]);

  return (
    <AuthLayout title="Signing you out" subtitle="One moment — we are closing your session.">
      <div className="flex flex-col items-center gap-4 py-6" role="status">
        <span className="sr-only">Signing out</span>
        <span
          aria-hidden="true"
          className="h-9 w-9 rounded-full border-2 border-[#12665e]/25 border-t-[#12665e] motion-safe:animate-spin"
        />
        <p className="text-center text-[14px] leading-relaxed text-[#4A6866]">
          Your journal, moods and conversations stay where they are. Come back
          whenever you want them.
        </p>
      </div>
    </AuthLayout>
  );
}
