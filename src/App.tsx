import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { lazy, Suspense, useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { Capacitor } from "@capacitor/core";
import { App as CapApp } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { supabase } from "@/integrations/supabase/client";
import { AuthProvider } from "@/hooks/useAuth";
import MobileLayout from "@/components/layout/MobileLayout";
import LoadingScreen from "@/components/states/LoadingScreen";
import SplashScreen from "@/components/states/SplashScreen";
import { PushNotificationsProvider } from "@/hooks/usePushNotifications";

const Index = lazy(() => import("./pages/Index"));
const ChapterPage = lazy(() => import("./pages/ChapterPage"));
const ChapterTheoryPage = lazy(() => import("./pages/ChapterTheoryPage"));
const LessonPage = lazy(() => import("./pages/LessonPage"));
const LeaderboardPage = lazy(() => import("./pages/LeaderboardPage"));
const ProblemsPage = lazy(() => import("./pages/ProblemsPage"));
const ProblemSolvePage = lazy(() => import("./pages/ProblemSolvePage"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const PrivacyPolicyPage = lazy(() => import("./pages/PrivacyPolicyPage"));
const DeleteAccountPage = lazy(() => import("./pages/DeleteAccountPage"));
const SupportPage = lazy(() => import("./pages/SupportPage"));

const ManualLessonPage = lazy(() => import("./pages/ManualLessonPage"));
const TakeTestPage = lazy(() => import("./pages/TakeTestPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

// Pages that show bottom navigation
const MAIN_PAGES = ["/", "/leaderboard", "/problems"];

const AppRoutes = () => {
  const location = useLocation();
  const isMainPage = MAIN_PAGES.includes(location.pathname);

  const content = (
    <Suspense fallback={<LoadingScreen />}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/chapter/:chapterId" element={<ChapterPage />} />
          <Route path="/chapter/:chapterId/theory" element={<ChapterTheoryPage />} />
          <Route path="/lesson/:lessonId" element={<LessonPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/problems" element={<ProblemsPage />} />
          <Route path="/problem/:problemId" element={<ProblemSolvePage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/delete-account" element={<DeleteAccountPage />} />
          <Route path="/support" element={<SupportPage />} />
          
          <Route path="/test/:assignmentId" element={<TakeTestPage />} />
          <Route path="/manual/:lessonId" element={<ManualLessonPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AnimatePresence>
    </Suspense>
  );

  return isMainPage ? <MobileLayout>{content}</MobileLayout> : content;
};

// Handle deep link OAuth tokens
const handleDeepLinkUrl = async (url: string) => {
  try {
    const parsedUrl = new URL(url);
    const hashPart = parsedUrl.hash ? parsedUrl.hash.slice(1) : "";
    const searchPart = parsedUrl.search ? parsedUrl.search.slice(1) : "";
    const params = new URLSearchParams(hashPart || searchPart);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const code = params.get("code");

    if (accessToken && refreshToken) {
      await Browser.close().catch(() => undefined);
      await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      return;
    }

    if (code) {
      await Browser.close().catch(() => undefined);
      await supabase.auth.exchangeCodeForSession(code);
    }
  } catch (error) {
    console.error('Error handling deep link auth:', error);
  }
};

const AppComponent = () => {
  const [showSplash, setShowSplash] = useState(() => {
    const shown = sessionStorage.getItem("pyro-splash-shown");
    return !shown;
  });

  useEffect(() => {
    if (showSplash) {
      const timer = setTimeout(() => {
        setShowSplash(false);
        sessionStorage.setItem("pyro-splash-shown", "true");
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [showSplash]);

  // Listen for deep link events on native platforms
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    // Handle URL that opened the app
    CapApp.getLaunchUrl().then((result) => {
      if (result?.url) {
        handleDeepLinkUrl(result.url);
      }
    });

    // Handle URL while app is running
    const listener = CapApp.addListener('appUrlOpen', (event) => {
      if (event.url) {
        handleDeepLinkUrl(event.url);
      }
    });

    return () => {
      listener.then(l => l.remove());
    };
  }, []);

  if (showSplash) return <SplashScreen />;

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PushNotificationsProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
        </PushNotificationsProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default AppComponent;
