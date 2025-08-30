import React, { useMemo, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { supabase } from "../lib/supabase";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { useAsyncCallback } from "../hooks/useAsync";
import { z } from "zod";

export default function Login() {
  useDocumentTitle("Sign in — AI Marketing");
  const { session } = useAuth();
  const location = useLocation();
  const redirectTo = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return (
      params.get("redirectTo") ||
      (location.state as any)?.from?.pathname ||
      "/dashboard"
    );
  }, [location]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const minPasswordLength = 6;

  const LoginSchema = z.object({
    email: z.string().trim().email("Enter a valid email address"),
    password: z
      .string()
      .min(minPasswordLength, `Use at least ${minPasswordLength} characters.`),
  });

  const {
    call: signIn,
    loading: signingIn,
    error: signInError,
    reset: resetSignIn,
  } = useAsyncCallback(async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    if (data?.user) {
      window.location.assign(redirectTo || "/dashboard");
    }
  });

  // Redirect authenticated users via effect to avoid any hook-order confusion
  useEffect(() => {
    if (session) {
      window.location.assign(redirectTo || "/dashboard");
    }
  }, [session, redirectTo]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Sign in</h1>
        </div>

        <div className="space-y-4">
          <Input
            type="email"
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={fieldErrors.email}
            autoComplete="email"
            required
          />
          <Input
            type="password"
            label="Password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={fieldErrors.password}
            autoComplete="current-password"
            required
          />
          <div>
            <Button
              type="button"
              onClick={async () => {
                setMessage(null);
                setFormError(null);
                setFieldErrors({});
                resetSignIn();
                const parsed = LoginSchema.safeParse({ email, password });
                if (!parsed.success) {
                  const fe = parsed.error.flatten().fieldErrors;
                  setFieldErrors({
                    email: fe.email?.[0],
                    password: fe.password?.[0],
                  });
                  return;
                }
                const res = await signIn();
                if (res && "error" in res && res.error) {
                  const msg = res.error.message || "Sign in failed.";
                  if (/confirm/i.test(msg) && /email/i.test(msg)) {
                    setFormError(
                      "Email not confirmed. Check your inbox or resend below.",
                    );
                  } else if (
                    /invalid/i.test(msg) &&
                    /credentials|login/i.test(msg)
                  ) {
                    setFormError("Invalid email or password.");
                  } else {
                    setFormError(msg);
                  }
                }
              }}
              loading={signingIn}
              disabled={!email || !password}
              className="w-full"
            >
              Sign in
            </Button>
          </div>
          <div className="text-right">
            <a
              href="/forgot-password"
              className="text-base text-brand-600 hover:underline"
            >
              Forgot password?
            </a>
          </div>
          <div className="text-base text-gray-600">
            Don’t have an account?{" "}
            <a
              className="text-brand-600 hover:underline"
              href={`/signup?redirectTo=${encodeURIComponent(redirectTo)}`}
            >
              Sign up
            </a>
          </div>
        </div>

        {message && <div className="text-base text-green-600">{message}</div>}
        {(formError || signInError) && (
          <div className="space-y-2">
            <div className="text-base text-red-600">
              {formError || signInError?.message}
            </div>
            {(/not\s*confirmed/i.test(
              formError || signInError?.message || "",
            ) ||
              /resend/i.test(formError || "")) && (
              <div>
                <ResendConfirmation
                  email={email}
                  redirectTo={redirectTo}
                  onDone={(ok) =>
                    setMessage(ok ? "Confirmation email sent." : null)
                  }
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ResendConfirmation({
  email,
  redirectTo,
  onDone,
}: {
  email: string;
  redirectTo: string;
  onDone?: (ok: boolean) => void;
}) {
  const [error, setError] = React.useState<string | null>(null);
  const { call, loading, reset } = useAsyncCallback(async () => {
    if (!email) return;
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: `${(import.meta.env.VITE_SITE_URL as string) || window.location.origin}/?redirectTo=${encodeURIComponent(redirectTo)}`,
      },
    });
    if (error) throw error;
    onDone?.(true);
  });
  const onClick = async () => {
    setError(null);
    reset();
    const res = await call();
    if (res && "error" in res && res.error) {
      setError(res.error.message || "Failed to resend confirmation.");
      onDone?.(false);
    }
  };
  return (
    <div className="text-base">
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={onClick}
        disabled={!email}
        loading={loading}
      >
        Resend confirmation email
      </Button>
      {error && <div className="text-red-600 mt-1">{error}</div>}
    </div>
  );
}
