import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { User } from "@supabase/supabase-js";

// --- Mocks ---------------------------------------------------------------

// Mutable auth state used by the mocked useAuth hook.
const authState: { user: User | null; loading: boolean } = {
  user: null,
  loading: true,
};
const listeners = new Set<() => void>();
const setAuth = (next: Partial<typeof authState>) => {
  Object.assign(authState, next);
  listeners.forEach((l) => l());
};

vi.mock("@/hooks/useAuth", () => {
  const React = require("react");
  return {
    useAuth: () => {
      const [, force] = React.useState(0);
      React.useEffect(() => {
        const l = () => force((n: number) => n + 1);
        listeners.add(l);
        return () => {
          listeners.delete(l);
        };
      }, []);
      return {
        user: authState.user,
        loading: authState.loading,
        signUp: vi.fn(),
        signIn: vi.fn(),
        signInWithGoogle: vi.fn(),
        signInWithApple: vi.fn(),
        signOut: vi.fn(),
        session: null,
      };
    },
  };
});

vi.mock("@/hooks/useAdminAccess", () => ({
  useAdminAccess: () => ({ isAdmin: false }),
}));

vi.mock("@/hooks/useSubscription", () => ({
  useSubscription: () => ({
    checkSubscription: vi.fn().mockResolvedValue(undefined),
    subscribed: false,
  }),
}));

vi.mock("@/integrations/supabase/client", () => {
  const chain: any = {
    select: () => chain,
    eq: () => chain,
    limit: () => chain,
    single: () => Promise.resolve({ data: null, error: null }),
    maybeSingle: () => Promise.resolve({ data: null, error: null }),
    update: () => chain,
    insert: () => Promise.resolve({ data: null, error: null }),
    then: (resolve: any) => resolve({ data: [], error: null }),
  };
  return {
    supabase: {
      from: () => chain,
      auth: {
        resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
      },
    },
  };
});

vi.mock("@capacitor/core", () => ({
  Capacitor: { isNativePlatform: () => false, getPlatform: () => "web" },
}));

vi.mock("@/components/account/AccountProfileTab", () => ({
  default: () => <div data-testid="account-profile-tab">profile-tab</div>,
}));
vi.mock("@/components/account/StudentTab", () => ({
  default: () => <div>student-tab</div>,
}));
vi.mock("@/components/account/TeacherClassesTab", () => ({
  default: () => <div>classes-tab</div>,
}));
vi.mock("@/components/account/TeacherTestsTab", () => ({
  default: () => <div>tests-tab</div>,
}));

import AuthPage from "./AuthPage";

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={["/auth"]}>
      <AuthPage />
    </MemoryRouter>
  );

beforeEach(() => {
  authState.user = null;
  authState.loading = true;
  listeners.clear();
});

// --- Tests ---------------------------------------------------------------

describe("AuthPage cold-start → Cont navigation", () => {
  it("shows the loading screen (no login flash, no black screen) while auth is restoring", () => {
    authState.loading = true;
    authState.user = null;

    const { container } = renderPage();

    // Login form must NOT be visible during auth restore.
    expect(screen.queryByText(/Bine ai revenit/i)).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/parola/i)).not.toBeInTheDocument();

    // The screen is not blank — LoadingScreen renders skeletons with bg-background.
    expect(container.querySelector(".bg-background")).toBeTruthy();
    expect(container.querySelectorAll('[class*="skeleton" i], .animate-pulse').length).toBeGreaterThan(0);
  });

  it("renders AccountView (Cont) directly once the session restores — no login flash", async () => {
    // Simulate cold start
    authState.loading = true;
    authState.user = null;
    renderPage();

    expect(screen.queryByTestId("account-profile-tab")).not.toBeInTheDocument();

    // Session restores
    await act(async () => {
      setAuth({
        loading: false,
        user: { id: "u1", email: "test@example.com" } as User,
      });
    });

    // Account view is rendered (Cont tab) — never flashed the login form.
    expect(await screen.findByText(/Contul meu/i)).toBeInTheDocument();
    expect(screen.queryByText(/Bine ai revenit/i)).not.toBeInTheDocument();
  });

  it("shows the login form only when auth finished restoring with no user", async () => {
    authState.loading = true;
    authState.user = null;
    renderPage();

    await act(async () => {
      setAuth({ loading: false, user: null });
    });

    // Now the login form is allowed to render.
    expect(screen.queryByTestId("account-profile-tab")).not.toBeInTheDocument();
  });
});
