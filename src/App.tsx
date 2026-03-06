import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { lazy, Suspense, useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import MobileLayout from "@/components/layout/MobileLayout";
import LoadingScreen from "@/components/states/LoadingScreen";
import SplashScreen from "@/components/states/SplashScreen";

const Index = lazy(() => import("./pages/Index"));
const ChapterPage = lazy(() => import("./pages/ChapterPage"));
const ChapterTheoryPage = lazy(() => import("./pages/ChapterTheoryPage"));
const LessonPage = lazy(() => import("./pages/LessonPage"));
const LeaderboardPage = lazy(() => import("./pages/LeaderboardPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

// Pages that show bottom navigation
const MAIN_PAGES = ["/", "/leaderboard", "/admin"];

const AppRoutes = () => {
  const location = useLocation();
  const isMainPage = MAIN_PAGES.includes(location.pathname);

  const content = (
    <Suspense fallback={<LoadingScreen />}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Index />} />
          <Route path="/chapter/:chapterId" element={<ChapterPage />} />
          <Route path="/chapter/:chapterId/theory" element={<ChapterTheoryPage />} />
          <Route path="/lesson/:lessonId" element={<LessonPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AnimatePresence>
    </Suspense>
  );

  return isMainPage ? <MobileLayout>{content}</MobileLayout> : content;
};

const App = () => {
  const [showSplash, setShowSplash] = useState(() => {
    const shown = sessionStorage.getItem("pylearn-splash-shown");
    return !shown;
  });

  useEffect(() => {
    if (showSplash) {
      const timer = setTimeout(() => {
        setShowSplash(false);
        sessionStorage.setItem("pylearn-splash-shown", "true");
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [showSplash]);

  if (showSplash) return <SplashScreen />;

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
