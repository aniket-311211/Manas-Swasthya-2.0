import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { AssessmentProvider } from "@/contexts/AssessmentContext";
import Navigation from "./components/Navigation";
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
import { api } from '@/lib/api';

// Lazy load heavy components
const UserDashboard = lazy(() => import("./components/UserDashboard"));
const Booking = lazy(() => import("./pages/Booking"));
const Chat = lazy(() => import("./pages/Chat"));
const Assessment = lazy(() => import("./pages/Assessment"));
const Resources = lazy(() => import("./pages/Resources"));
const Community = lazy(() => import("./pages/Community"));
const MedicineAI = lazy(() => import("./components/MedicineAI"));
const Journal = lazy(() => import("./pages/Journal"));

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
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isSignedIn, isLoaded } = useUser();

  if (!isLoaded) {
    return <PageLoader />;
  }

  if (!isSignedIn) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      {children}
    </div>
  );
};

const App = () => {
  const { isSignedIn, isLoaded, user } = useUser();

  // Sync User with Backend
  useEffect(() => {
    if (isSignedIn && user) {
      const syncUser = async () => {
        try {
          await api.createUser({
            clerkId: user.id,
            email: user.primaryEmailAddress?.emailAddress || '',
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            imageUrl: user.imageUrl || ''
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
                <Route path="/sign-in/*" element={<SignInPage />} />
                <Route path="/sign-up/*" element={<SignUpPage />} />
                <Route path="/sign-out" element={<SignOutPage />} />

                {/* Protected Routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
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
                <Route
                  path="/medicine"
                  element={
                    <ProtectedRoute>
                      <MedicineAI />
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
    </QueryClientProvider>
  );
};

export default App;
