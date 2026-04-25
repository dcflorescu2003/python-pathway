import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render } from "@testing-library/react";
import { act } from "react";

// --- Mocks ---------------------------------------------------------------

vi.mock("@capacitor/core", () => ({
  Capacitor: { isNativePlatform: () => false, getPlatform: () => "web" },
}));
vi.mock("@capacitor/app", () => ({
  App: {
    getLaunchUrl: () => Promise.resolve(null),
    addListener: () => Promise.resolve({ remove: () => undefined }),
  },
}));
vi.mock("@capacitor/browser", () => ({ Browser: { close: vi.fn(), open: vi.fn() } }));
vi.mock("@capacitor/splash-screen", () => ({
  SplashScreen: { hide: vi.fn().mockResolvedValue(undefined) },
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => undefined } } }),
      getSession: () => new Promise(() => undefined), // never resolves -> simulează blocaj
      setSession: vi.fn(),
      exchangeCodeForSession: vi.fn(),
    },
    from: () => ({ select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null }) }) }) }),
  },
}));

vi.mock("@/hooks/useAuth", () => ({
  AuthProvider: ({ children }: any) => children,
  useAuth: () => ({ user: null, loading: true, session: null }),
}));

vi.mock("@/hooks/usePushNotifications", () => ({
  PushNotificationsProvider: ({ children }: any) => children,
}));

vi.mock("@/components/states/SplashScreen", () => ({
  default: () => <div data-testid="splash" />,
}));
vi.mock("@/components/states/LoadingScreen", () => ({
  default: () => <div data-testid="loading" />,
}));
vi.mock("@/components/layout/MobileLayout", () => ({
  default: ({ children }: any) => <div>{children}</div>,
}));

// Stub all lazy pages
vi.mock("./pages/Index", () => ({ default: () => <div>index</div> }));
vi.mock("./pages/ChapterPage", () => ({ default: () => <div /> }));
vi.mock("./pages/ChapterTheoryPage", () => ({ default: () => <div /> }));
vi.mock("./pages/LessonPage", () => ({ default: () => <div /> }));
vi.mock("./pages/LeaderboardPage", () => ({ default: () => <div /> }));
vi.mock("./pages/ProblemsPage", () => ({ default: () => <div /> }));
vi.mock("./pages/ProblemSolvePage", () => ({ default: () => <div /> }));
vi.mock("./pages/AuthPage", () => ({ default: () => <div /> }));
vi.mock("./pages/AdminPage", () => ({ default: () => <div /> }));
vi.mock("./pages/ResetPasswordPage", () => ({ default: () => <div /> }));
vi.mock("./pages/PrivacyPolicyPage", () => ({ default: () => <div /> }));
vi.mock("./pages/DeleteAccountPage", () => ({ default: () => <div /> }));
vi.mock("./pages/SupportPage", () => ({ default: () => <div /> }));
vi.mock("./pages/ManualLessonPage", () => ({ default: () => <div /> }));
vi.mock("./pages/TakeTestPage", () => ({ default: () => <div /> }));
vi.mock("./pages/SkipChallengePage", () => ({ default: () => <div /> }));
vi.mock("./pages/UnsubscribePage", () => ({ default: () => <div /> }));
vi.mock("./pages/NotFound", () => ({ default: () => <div /> }));

import App from "./App";

describe("App startup watchdog", () => {
  let reloadSpy: ReturnType<typeof vi.fn>;
  let originalLocation: Location;

  beforeEach(() => {
    sessionStorage.clear();
    vi.useFakeTimers();
    originalLocation = window.location;
    reloadSpy = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...originalLocation, reload: reloadSpy },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: originalLocation,
    });
  });

  it("declanșează reload după ~7s dacă pornirea rămâne blocată", () => {
    render(<App />);

    act(() => {
      vi.advanceTimersByTime(6000);
    });
    expect(reloadSpy).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(reloadSpy).toHaveBeenCalledTimes(1);
    expect(sessionStorage.getItem("pyro-startup-reload-attempt")).toBeTruthy();
  });

  it("nu intră în buclă: dacă a făcut deja reload, nu repetă", () => {
    sessionStorage.setItem("pyro-startup-reload-attempt", String(Date.now()));
    render(<App />);
    act(() => {
      vi.advanceTimersByTime(8000);
    });
    expect(reloadSpy).not.toHaveBeenCalled();
  });
});
