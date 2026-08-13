import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth, useUser } from "@clerk/clerk-react";
import { AssessmentProvider } from "@/contexts/AssessmentContext";
import ThemeProvider from "@/components/theme/ThemeProvider";
import AppShell from "./components/shell/AppShell";
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import OfflineIndicator from "./components/OfflineIndicator";
import Landing from "./pages/Landing";
import About from "./pages/About";
import NotFound from "./pages/NotFound";
// Import auth components from auth folder
import SignInPage from "./auth/sign-in/[[...sign-in]]/page";
import SignUpPage from "./auth/sign-up/[[...sign-up]]/page";
import SignOutPage from "./auth/sign-out/page";
import { registerServiceWorker, addOnlineStatusListener } from "./utils/pwa";
import { useEffect, lazy, Suspense } from "react";
import { api, setTokenProvider } from '@/lib/api';

// Lazy load heavy components
const UserDashboard = lazy(() => import("./components/UserDashboard"));
const Booking = lazy(() => import("./pages/Booking"));
const Chat = lazy(() => import("./pages/Chat"));
const Assessment = lazy(() => import("./pages/Assessment"));
const Resources = lazy(() => import("./pages/Resources"));
const Community = lazy(() => import("./pages/Community"));
const Medicine = lazy(() => import("./pages/Medicine"));
const Journal = lazy(() => import("./pages/Journal"));
const ScrollyVideoDemo = lazy(() => import("./pages/ScrollyVideoDemo"));

const queryClient = new QueryClient();

// Loading component for Suspense
const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
      <p className="text-muted-foreground">Loading...</p>
    </div>
  </div>
);

// Protected Route Component
const ProtectedRoute = ({
  children,
  backdrop = false,
}: {
  children: React.ReactNode;
  /** Opt into the animated iridescence field. Dashboard only for now. */
  backdrop?: boolean;
}) => {
  const { isSignedIn, isLoaded } = useUser();

  if (!isLoaded) {
    return <PageLoader />;
  }

  if (!isSignedIn) {
    return <Navigate to="/" replace />;
  }

  // Every authenticated page shares one shell. AppShell renders the <main>
  // landmark, so pages must not add their own.
  return <AppShell backdrop={backdrop}>{children}</AppShell>;
};

const App = () => {
  const { isSignedIn, isLoaded, user } = useUser();
  const { getToken } = useAuth();

  // Every API call carries a signed Clerk token from here on, so the server can
  // verify who is calling instead of trusting a user id in the request body.
  // Registered before the sync below, which is itself an API call.
  useEffect(() => {
    setTokenProvider(() => getToken());
    return () => setTokenProvider(null);
  }, [getToken]);

  // Sync User with Backend
  useEffect(() => {
    if (isSignedIn && user) {
      localStorage.setItem('clerk_user_id', user.id);
      const syncUser = async () => {
        try {
          await api.upsertUser({
            clerkId: user.id,
            email: user.primaryEmailAddress?.emailAddress || '',
            firstName: user.firstName || '',
            lastName: user.lastName || ''
          });
        } catch (error) {
          console.error('Failed to sync user:', error);
        }
      };
      syncUser();
    }
  }, [isSignedIn, user]);

  // PWA Setup
  useEffect(() => {
    // Register service worker
    registerServiceWorker();

    // Handle online/offline status
    const cleanup = addOnlineStatusListener((isOnline) => {
      if (!isOnline) {
        console.log("App is now offline - some features may be limited");
      } else {
        console.log("App is back online");
      }
    });

    return cleanup;
  }, []);

  // Show loading state while Clerk is initializing
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AssessmentProvider>
          <BrowserRouter>
            <OfflineIndicator />
            <PWAInstallPrompt />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public Routes */}
                <Route
                  path="/"
                  element={
                    isSignedIn ? (
                      <Navigate to="/dashboard" replace />
                    ) : (
                      <Landing />
                    )
                  }
                />
                <Route path="/about" element={<About />} />
                <Route path="/scrolly-video" element={<ScrollyVideoDemo />} />
                <Route path="/sign-in/*" element={<SignInPage />} />
                <Route path="/sign-up/*" element={<SignUpPage />} />
                <Route path="/sign-out" element={<SignOutPage />} />

                {/* Protected Routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute backdrop>
                      <UserDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/booking"
                  element={
                    <ProtectedRoute>
                      <Booking />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/chat"
                  element={
                    <ProtectedRoute>
                      <Chat />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/journal"
                  element={
                    <ProtectedRoute>
                      <Journal />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/assessment"
                  element={
                    <ProtectedRoute>
                      <Assessment />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/resources"
                  element={
                    <ProtectedRoute>
                      <Resources />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/community"
                  element={
                    <ProtectedRoute>
                      <Community />
                    </ProtectedRoute>
                  }
                />
                {/* Mentors moved inside the community page. Kept as a redirect
                    rather than deleted, so an old link or bookmark still lands
                    on the mentors tab instead of a 404. */}
                <Route path="/mentors" element={<Navigate to="/community?tab=mentors" replace />} />
                <Route
                  path="/medicine"
                  element={
                    <ProtectedRoute>
                      <Medicine />
                    </ProtectedRoute>
                  }
                />

                {/* Catch all route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AssessmentProvider>
      </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
