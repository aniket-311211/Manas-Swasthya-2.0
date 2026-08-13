import { SignUp, useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import AuthLayout from '@/auth/AuthLayout';
import { clerkAppearance } from '@/auth/clerkTheme';

export default function SignUpPage() {
  const { isSignedIn, isLoaded } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoaded && isSignedIn) navigate('/dashboard', { replace: true });
  }, [isLoaded, isSignedIn, navigate]);

  if (!isLoaded) {
    return (
      <AuthLayout title="Join Manas Swasthya" subtitle="One moment…">
        <div className="flex justify-center py-8" role="status">
          <span className="sr-only">Loading</span>
          <span
            aria-hidden="true"
            className="h-9 w-9 rounded-full border-2 border-[#12665e]/25 border-t-[#12665e] motion-safe:animate-spin"
          />
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Join Manas Swasthya"
      subtitle="Free for students. Your journal and mood entries stay private to you."
    >
      <SignUp
        appearance={clerkAppearance}
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        fallbackRedirectUrl="/dashboard"
      />
    </AuthLayout>
  );
}
