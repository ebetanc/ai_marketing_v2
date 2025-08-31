import React, { useEffect, useState } from "react";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { supabase } from "../lib/supabase";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useNavigate } from "react-router-dom";
import { useAsyncCallback } from "../hooks/useAsync";
import { z } from "zod";

export default function ResetPassword() {
  useDocumentTitle("Reset password — Lighting");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | undefined>(undefined);
  const minPasswordLength = 6;
  const navigate = useNavigate();

  // Require a recovery session to show the form per Supabase v2 docs
  const [hasRecoverySession, setHasRecoverySession] = useState<boolean>(false);
  useEffect(() => {
    let mounted = true;
    const { data: sub } = supabase.auth.onAuthStateChange(
      (
        event:
          | "INITIAL_SESSION"
          | "SIGNED_IN"
          | "SIGNED_OUT"
          | "PASSWORD_RECOVERY"
          | "TOKEN_REFRESHED"
          | "USER_UPDATED"
          | "LINKED_IDENTITY"
          | "UNLINKED_IDENTITY",
      ) => {
        if (!mounted) return;
        if (
          event === "PASSWORD_RECOVERY" ||
          event === "TOKEN_REFRESHED" ||
          event === "USER_UPDATED"
        ) {
          setHasRecoverySession(true);
        }
      },
    );
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setHasRecoverySession(!!data.session);
    })();
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const {
    call: updatePassword,
    loading,
    reset,
  } = useAsyncCallback(async () => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
    setMessage("Password updated. Redirecting to login…");
    setTimeout(() => navigate("/login", { replace: true }), 1200);
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    reset();
    setFieldError(undefined);
    const parsed = z
      .string()
      .min(minPasswordLength, `Use at least ${minPasswordLength} characters.`)
      .safeParse(password);
    if (!parsed.success) {
      setFieldError(
        parsed.error.issues?.[0]?.message ||
          `Use at least ${minPasswordLength} characters.`,
      );
      return;
    }
    const res = await updatePassword();
    if (res && "error" in res && res.error) {
      setError(res.error.message || "Couldn’t update password.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Reset password
          </h1>
          <p className="text-gray-500 text-base mt-1">
            Enter your new password.
          </p>
        </div>
        {!hasRecoverySession && (
          <div className="text-base text-red-600" role="alert">
            Invalid or expired reset link. Request a new one.
          </div>
        )}
        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            type="password"
            label="New password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={fieldError}
            required
            disabled={!hasRecoverySession}
          />
          {/* Confirm password removed per request */}
          <Button
            type="submit"
            loading={loading}
            className="w-full"
            disabled={
              !hasRecoverySession || password.trim().length < minPasswordLength
            }
          >
            Update password
          </Button>
        </form>
        {message && <div className="text-base text-green-600">{message}</div>}
        {error && <div className="text-base text-red-600">{error}</div>}
      </div>
    </div>
  );
}
