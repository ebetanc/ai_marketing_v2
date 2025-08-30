import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { supabase, isSupabaseConfigured } from "./supabase";
import { Navigate, Outlet, useLocation } from "react-router-dom";

type Session = Awaited<
  ReturnType<typeof supabase.auth.getSession>
>["data"]["session"];

type AuthContextType = {
  session: Session;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!isMounted) return;
      setSession(data.session);
      setLoading(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(
      (
        _event:
          | "INITIAL_SESSION"
          | "SIGNED_IN"
          | "SIGNED_OUT"
          | "PASSWORD_RECOVERY"
          | "TOKEN_REFRESHED"
          | "USER_UPDATED"
          | "LINKED_IDENTITY"
          | "UNLINKED_IDENTITY",
        newSession: Session,
      ) => {
        setSession(newSession);
      },
    );

    return () => {
      isMounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(() => ({ session, loading }), [session, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function ProtectedLayout() {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Loading…
      </div>
    );
  }

  if (!session) {
    // If Supabase isn't configured, allow access so the UI renders for local/dev preview
    if (!isSupabaseConfigured) {
      return <Outlet />;
    }
    // Preserve intended path for post-login return
    const redirectTo = encodeURIComponent(location.pathname + location.search);
    return (
      <Navigate
        to={`/login?redirectTo=${redirectTo}`}
        replace
        state={{ from: location }}
      />
    );
  }

  return <Outlet />;
}
