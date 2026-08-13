import { SignIn, useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import AuthLayout from '@/auth/AuthLayout';
import { clerkAppearance } from '@/auth/clerkTheme';

export default function SignInPage() {
  const { isSignedIn, isLoaded } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoaded && isSignedIn) navigate('/dashboard', { replace: true });
  }, [isLoaded, isSignedIn, navigate]);

  if (!isLoaded) {
    return (
      <AuthLayout title="Welcome back" subtitle="One moment…">
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
    <AuthLayout title="Welcome back" subtitle="Sign in to your Manas Swasthya account">
      <SignIn
        appearance={clerkAppearance}
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        // `redirectUrl` and `afterSignInUrl` are deprecated in Clerk v5 and were
        // being passed together, which is ambiguous. `fallbackRedirectUrl` is
        // the current prop: it defers to a `redirect_url` in the query when
        // there is one, so a link into a deep page still lands there.
        fallbackRedirectUrl="/dashboard"
      />
    </AuthLayout>
  );
}
