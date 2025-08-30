import React, { useMemo, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { supabase } from "../lib/supabase";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { useAsyncCallback } from "../hooks/useAsync";
import { z } from "zod";

export default function SignUp() {
  useDocumentTitle("Sign up — AI Marketing");
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
  const [role, setRole] = useState<"marketing" | "real_estate">("marketing");
  const [message, setMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const minPasswordLength = 6;

  const Schema = z.object({
    email: z.string().trim().email("Enter a valid email address"),
    password: z
      .string()
      .min(minPasswordLength, `Use at least ${minPasswordLength} characters.`),
  });

  const {
    call: signUp,
    loading: signingUp,
    error: signUpError,
    reset,
  } = useAsyncCallback(async () => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${(import.meta.env.VITE_SITE_URL as string) || window.location.origin}/?redirectTo=${encodeURIComponent(redirectTo)}`,
        data: { role },
      },
    });
    if (error) throw error;
    if (data?.session) {
      window.location.assign(redirectTo || "/dashboard");
    } else if (data?.user) {
      setMessage(
        "Account created. Check your email to confirm. You’ll be signed in after confirming.",
      );
    }
  });

  useEffect(() => {
    if (session) {
      window.location.assign(redirectTo || "/dashboard");
    }
  }, [session, redirectTo]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Create your account
          </h1>
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
            autoComplete="new-password"
            required
          />

          {/* Role selection (immutable later) */}
          <fieldset>
            <legend className="block text-base font-medium text-gray-700 mb-2">
              Role
            </legend>
            <div className="grid gap-3">
              {/* Marketing role */}
              <label
                htmlFor="role-marketing"
                className={`block w-full rounded-xl border p-4 transition shadow-sm cursor-pointer ${role === "marketing" ? "border-brand-500 ring-2 ring-brand-200 bg-brand-50" : "border-gray-200 hover:border-gray-300 bg-white"}`}
              >
                <input
                  type="radio"
                  name="role"
                  id="role-marketing"
                  value="marketing"
                  checked={role === "marketing"}
                  onChange={() => setRole("marketing")}
                  className="sr-only"
                  aria-labelledby="role-marketing-label"
                />
                <div className="flex items-center justify-between">
                  <div>
                    <div
                      id="role-marketing-label"
                      className="font-medium text-gray-900"
                    >
                      Marketing
                    </div>
                    <div className="text-base text-gray-500">
                      General marketing teams & creators.
                    </div>
                  </div>
                  <div
                    className={`h-5 w-5 rounded-full border flex items-center justify-center ${role === "marketing" ? "border-brand-500" : "border-gray-300"}`}
                    aria-hidden
                  >
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${role === "marketing" ? "bg-brand-500" : "bg-transparent"}`}
                    />
                  </div>
                </div>
              </label>
              {/* Real Estate role */}
              <label
                htmlFor="role-real-estate"
                className={`block w-full rounded-xl border p-4 transition shadow-sm cursor-pointer ${role === "real_estate" ? "border-brand-500 ring-2 ring-brand-200 bg-brand-50" : "border-gray-200 hover:border-gray-300 bg-white"}`}
              >
                <input
                  type="radio"
                  name="role"
                  id="role-real-estate"
                  value="real_estate"
                  checked={role === "real_estate"}
                  onChange={() => setRole("real_estate")}
                  className="sr-only"
                  aria-labelledby="role-real-estate-label"
                />
                <div className="flex items-center justify-between">
                  <div>
                    <div
                      id="role-real-estate-label"
                      className="font-medium text-gray-900"
                    >
                      Real Estate
                    </div>
                    <div className="text-base text-gray-500">
                      Content & strategy for real estate niche.
                    </div>
                  </div>
                  <div
                    className={`h-5 w-5 rounded-full border flex items-center justify-center ${role === "real_estate" ? "border-brand-500" : "border-gray-300"}`}
                    aria-hidden
                  >
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${role === "real_estate" ? "bg-brand-500" : "bg-transparent"}`}
                    />
                  </div>
                </div>
              </label>
            </div>
          </fieldset>

          <Button
            type="button"
            onClick={async () => {
              setMessage(null);
              setFormError(null);
              setFieldErrors({});
              reset();
              const parsed = Schema.safeParse({ email, password });
              if (!parsed.success) {
                const fe = parsed.error.flatten().fieldErrors;
                setFieldErrors({
                  email: fe.email?.[0],
                  password: fe.password?.[0],
                });
                return;
              }
              const res = await signUp();
              if (res && "error" in res && res.error) {
                setFormError(res.error.message || "Sign up failed.");
              }
            }}
            loading={signingUp}
            disabled={!email || !password}
            className="w-full"
          >
            Create account
          </Button>

          <div className="text-base text-gray-600">
            Already have an account?{" "}
            <a
              className="text-brand-600 hover:underline"
              href={`/login?redirectTo=${encodeURIComponent(redirectTo)}`}
            >
              Sign in
            </a>
          </div>
        </div>

        {message && <div className="text-base text-green-600">{message}</div>}
        {(formError || signUpError) && (
          <div className="space-y-2">
            <div className="text-base text-red-600">
              {formError || signUpError?.message}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
