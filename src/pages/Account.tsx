import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { useToast } from "../components/ui/Toast";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useNavigate } from "react-router-dom";
import { useAsyncCallback } from "../hooks/useAsync";
import { z } from "zod";
import { PageHeader } from "../components/layout/PageHeader";
import { PageContainer } from "../components/layout/PageContainer";
import {
  ShieldCheck,
  LogOut,
  Mail,
  User as UserIcon,
  KeyRound,
  Check,
  Copy,
  AlertTriangle,
} from "lucide-react";

export function Account() {
  useDocumentTitle("Account — AI Marketing");
  const { session } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();
  const user = session?.user;

  const [name, setName] = useState("");
  const [metaSaving, setMetaSaving] = useState(false);
  const [email, setEmail] = useState("");
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailError, setEmailError] = useState<string | undefined>();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdErrors, setPwdErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  useEffect(() => {
    const meta = (user?.user_metadata || {}) as any;
    setName(meta?.name ?? "");
    setEmail(user?.email ?? "");
  }, [user?.id, user?.email, user?.user_metadata]);

  const userId = user?.id ?? "—";
  const emailVerified = Boolean(user?.email_confirmed_at);
  const canSave = useMemo(() => Boolean(user), [user]);

  const { call: saveMetaCall, loading: metaLoading } = useAsyncCallback(
    async () => {
      if (!canSave) return;
      if (!isSupabaseConfigured) {
        push({
          title: "Demo mode",
          message: "Supabase not configured; changes won’t persist.",
          variant: "warning",
        });
        return;
      }
      const { error } = await supabase.auth.updateUser({
        data: { name } as any,
      });
      if (error) throw error;
      push({
        title: "Profile updated",
        message: "Profile saved.",
        variant: "success",
      });
    },
  );

  const { call: saveEmailCall, loading: emailLoading } = useAsyncCallback(
    async () => {
      if (!canSave) return;
      const next = email.trim();
      const EmailSchema = z
        .string()
        .trim()
        .email("Enter a valid email address.");
      const parsed = EmailSchema.safeParse(next);
      if (!parsed.success) {
        setEmailError(parsed.error.issues[0]?.message || "Invalid email");
        push({
          title: "Fix errors",
          message: "Check the email field.",
          variant: "warning",
        });
        return;
      }
      setEmailError(undefined);
      if (!isSupabaseConfigured) {
        push({
          title: "Demo mode",
          message: "Supabase not configured; email change won’t persist.",
          variant: "warning",
        });
        return;
      }
      const { error } = await supabase.auth.updateUser({ email: parsed.data });
      if (error) throw error;
      push({
        title: "Check your email",
        message: "We sent a confirmation link.",
        variant: "info",
      });
    },
  );

  const { call: savePasswordCall, loading: pwdLoading } = useAsyncCallback(
    async () => {
      if (!canSave) return;
      const PasswordSchema = z
        .object({
          currentPassword: z.string().optional(),
          newPassword: z.string().min(8, "Use at least 8 characters."),
          confirmPassword: z.string(),
        })
        .refine((d) => d.newPassword === d.confirmPassword, {
          message: "Passwords don’t match.",
          path: ["confirmPassword"],
        });
      const parsed = PasswordSchema.safeParse({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      if (!parsed.success) {
        const issues = parsed.error.flatten().fieldErrors;
        setPwdErrors({
          currentPassword: issues.currentPassword?.[0],
          newPassword: issues.newPassword?.[0],
          confirmPassword: issues.confirmPassword?.[0],
        });
        push({
          title: "Fix errors",
          message: "Check the password fields.",
          variant: "warning",
        });
        return;
      }
      setPwdErrors({});
      if (!isSupabaseConfigured) {
        push({
          title: "Demo mode",
          message: "Supabase not configured; password change won’t persist.",
          variant: "warning",
        });
        return;
      }
      if (currentPassword && user?.email) {
        const { error: reauthError } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: currentPassword,
        });
        if (reauthError) {
          setPwdErrors((p) => ({
            ...p,
            currentPassword: "Invalid current password.",
          }));
          push({
            title: "Invalid current password",
            message: "Check your current password.",
            variant: "error",
          });
          return;
        }
      }
      const { error } = await supabase.auth.updateUser({
        password: parsed.data.newPassword,
      });
      if (error) throw error;
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      push({
        title: "Password updated",
        message: "Password changed.",
        variant: "success",
      });
    },
  );

  const { call: signOutCall } = useAsyncCallback(async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      navigate("/login", { replace: true });
    }
  });

  function copy(text: string) {
    if (!text) return;
    navigator.clipboard
      .writeText(text)
      .then(() =>
        push({
          title: "Copied",
          message: "Value copied to clipboard.",
          variant: "success",
        }),
      );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Account"
        description="Manage your profile, email, and password."
        icon={<ShieldCheck className="h-5 w-5" />}
      />

      {!isSupabaseConfigured && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 mt-0.5 text-amber-600" />
          <div>
            <p className="font-medium">Demo mode</p>
            <p>Supabase isn’t configured; changes won’t persist.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-600/10 ring-1 ring-brand-600/20 flex items-center justify-center text-brand-700">
                <UserIcon className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Profile</CardTitle>
                <p className="text-xs text-gray-500 mt-0.5">
                  Basic account metadata.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Name"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative">
                  <Input label="User ID" value={userId} disabled />
                  {user && (
                    <button
                      type="button"
                      onClick={() => copy(userId)}
                      className="absolute top-7 right-2 inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      aria-label="Copy user id"
                    >
                      <Copy className="h-3 w-3" /> Copy
                    </button>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-700 mb-1">
                    Email status
                  </span>
                  <div className="flex items-center gap-2 h-[42px] px-3 rounded-xl border bg-gray-50 text-sm">
                    {emailVerified ? (
                      <>
                        <Check className="h-4 w-4 text-green-600" />
                        <span className="text-gray-800">Verified</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        <span className="text-gray-700">Not verified</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={() => {
                    setMetaSaving(true);
                    saveMetaCall()?.finally(() => setMetaSaving(false));
                  }}
                  loading={metaSaving || metaLoading}
                  disabled={!canSave}
                >
                  Save
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Email */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-600/10 ring-1 ring-brand-600/20 flex items-center justify-center text-brand-700">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Email</CardTitle>
                <p className="text-xs text-gray-500 mt-0.5">
                  Update your account email.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError(undefined);
                }}
                error={emailError}
              />
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <p className="text-xs text-gray-500">
                  We’ll send a confirmation email if you change this.
                </p>
                <div className="flex justify-end">
                  <Button
                    onClick={() => {
                      setEmailSaving(true);
                      saveEmailCall()?.finally(() => setEmailSaving(false));
                    }}
                    loading={emailSaving || emailLoading}
                    disabled={!canSave}
                  >
                    Update email
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Password */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-600/10 ring-1 ring-brand-600/20 flex items-center justify-center text-brand-700">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Password</CardTitle>
                <p className="text-xs text-gray-500 mt-0.5">
                  Use a strong, unique password (min 8 characters).
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input
                label="Current password (optional)"
                type="password"
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  setPwdErrors((p) => ({ ...p, currentPassword: undefined }));
                }}
                autoComplete="current-password"
                error={pwdErrors.currentPassword}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="New password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setPwdErrors((p) => ({ ...p, newPassword: undefined }));
                  }}
                  autoComplete="new-password"
                  error={pwdErrors.newPassword}
                />
                <Input
                  label="Confirm new password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setPwdErrors((p) => ({ ...p, confirmPassword: undefined }));
                  }}
                  autoComplete="new-password"
                  error={pwdErrors.confirmPassword}
                />
              </div>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <p className="text-xs text-gray-500">
                  Minimum 8 characters. Avoid reuse across sites.
                </p>
                <div className="flex justify-end">
                  <Button
                    onClick={() => {
                      setPwdSaving(true);
                      savePasswordCall()?.finally(() => setPwdSaving(false));
                    }}
                    loading={pwdSaving || pwdLoading}
                    disabled={!canSave}
                  >
                    Update password
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sign out */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-600/10 ring-1 ring-brand-600/20 flex items-center justify-center text-brand-700">
                <LogOut className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Sign out</CardTitle>
                <p className="text-xs text-gray-500 mt-0.5">
                  End your current session on this device.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-gray-600 text-base">
                Sign out of your account on this device.
              </p>
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => signOutCall()}
                  disabled={!session}
                >
                  Sign Out
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
