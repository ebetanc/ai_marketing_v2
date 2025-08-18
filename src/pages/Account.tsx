import React, { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { useToast } from '../components/ui/Toast'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useNavigate } from 'react-router-dom'
import { useAsyncCallback } from '../hooks/useAsync'
import { z } from 'zod'

export function Account() {
    useDocumentTitle('Account — AI Marketing')
    const { session } = useAuth()
    const { push } = useToast()
    const navigate = useNavigate()

    const user = session?.user

    // Metadata
    const [name, setName] = useState<string>('')
    const [metaSaving, setMetaSaving] = useState(false)

    // Email
    const [email, setEmail] = useState<string>('')
    const [emailSaving, setEmailSaving] = useState(false)
    const [emailError, setEmailError] = useState<string | undefined>(undefined)

    // Password
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [pwdSaving, setPwdSaving] = useState(false)
    const [pwdErrors, setPwdErrors] = useState<{ currentPassword?: string; newPassword?: string; confirmPassword?: string }>({})

    useEffect(() => {
        const meta = (user?.user_metadata || {}) as any
        setName(meta?.name ?? '')
        setEmail(user?.email ?? '')
    }, [user?.id, user?.email, user?.user_metadata])

    const userId = user?.id ?? '—'
    const emailVerified = Boolean(user?.email_confirmed_at)

    const canSave = useMemo(() => Boolean(user), [user])

    const { call: saveMetaCall, loading: metaLoading } = useAsyncCallback(async () => {
        if (!canSave) return
        if (!isSupabaseConfigured) {
            push({ title: 'Demo mode', message: 'Supabase is not configured; changes won’t persist.', variant: 'warning' })
            return
        }
        const { error } = await supabase.auth.updateUser({ data: { name } as any })
        if (error) throw error
        push({ title: 'Profile updated', message: 'Profile saved.', variant: 'success' })
    })

    const { call: saveEmailCall, loading: emailLoading } = useAsyncCallback(async () => {
        if (!canSave) return
        const next = email.trim()
        const EmailSchema = z.string().trim().email('Enter a valid email address.')
        const parsed = EmailSchema.safeParse(next)
        if (!parsed.success) {
            setEmailError(parsed.error.issues[0]?.message || 'Invalid email')
            push({ title: 'Fix errors', message: 'Check the email field.', variant: 'warning' })
            return
        }
        setEmailError(undefined)
        if (!isSupabaseConfigured) {
            push({ title: 'Demo mode', message: 'Supabase is not configured; email change won’t persist.', variant: 'warning' })
            return
        }
        const { error } = await supabase.auth.updateUser({ email: parsed.data })
        if (error) throw error
        push({ title: 'Check your email', message: 'We sent a confirmation link.', variant: 'info' })
    })

    const { call: savePasswordCall, loading: pwdLoading } = useAsyncCallback(async () => {
        if (!canSave) return
        const PasswordSchema = z.object({
            currentPassword: z.string().optional(),
            newPassword: z.string().min(8, 'Use at least 8 characters.'),
            confirmPassword: z.string()
        }).refine((data) => data.newPassword === data.confirmPassword, {
            message: 'Passwords don’t match.',
            path: ['confirmPassword']
        })
        const parsed = PasswordSchema.safeParse({ currentPassword, newPassword, confirmPassword })
        if (!parsed.success) {
            const issues = parsed.error.flatten().fieldErrors
            setPwdErrors({
                currentPassword: issues.currentPassword?.[0],
                newPassword: issues.newPassword?.[0],
                confirmPassword: issues.confirmPassword?.[0],
            })
            push({ title: 'Fix errors', message: 'Check the password fields.', variant: 'warning' })
            return
        }
        setPwdErrors({})
        if (!isSupabaseConfigured) {
            push({ title: 'Demo mode', message: 'Supabase is not configured; password change won’t persist.', variant: 'warning' })
            return
        }
        if (currentPassword && user?.email) {
            const { error: reauthError } = await supabase.auth.signInWithPassword({ email: user.email, password: currentPassword })
            if (reauthError) {
                setPwdErrors(prev => ({ ...prev, currentPassword: 'Invalid current password.' }))
                push({ title: 'Invalid current password', message: 'Check your current password.', variant: 'error' })
                return
            }
        }
        const { error } = await supabase.auth.updateUser({ password: parsed.data.newPassword })
        if (error) throw error
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        push({ title: 'Password updated', message: 'Password changed.', variant: 'success' })
    })

    const { call: signOutCall } = useAsyncCallback(async () => {
        try {
            await supabase.auth.signOut()
        } finally {
            navigate('/login', { replace: true })
        }
    })

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Account</h1>
                <p className="mt-2 text-gray-600">Manage your profile, email, and password.</p>
            </div>

            {!isSupabaseConfigured && (
                <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
                    Supabase is not configured. Demo mode: changes won’t persist.
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Profile metadata */}
                <Card>
                    <CardHeader>
                        <CardTitle>Profile</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Input label="Name" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Input label="User ID" value={userId} disabled />
                                <Input label="Email verified" value={emailVerified ? 'Yes' : 'No'} disabled />
                            </div>
                            <div className="flex justify-end">
                                <Button onClick={() => { setMetaSaving(true); saveMetaCall()?.finally(() => setMetaSaving(false)) }} loading={metaSaving || metaLoading} disabled={!canSave}>Save</Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Email */}
                <Card>
                    <CardHeader>
                        <CardTitle>Email</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <Input label="Email" type="email" placeholder="you@example.com" value={email} onChange={(e) => { setEmail(e.target.value); setEmailError(undefined) }} error={emailError} />
                            <div className="flex justify-end">
                                <Button onClick={() => { setEmailSaving(true); saveEmailCall()?.finally(() => setEmailSaving(false)) }} loading={emailSaving || emailLoading} disabled={!canSave}>Update email</Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Password */}
                <Card>
                    <CardHeader>
                        <CardTitle>Password</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <Input label="Current password (optional)" type="password" value={currentPassword} onChange={(e) => { setCurrentPassword(e.target.value); setPwdErrors(prev => ({ ...prev, currentPassword: undefined })) }} autoComplete="current-password" error={pwdErrors.currentPassword} />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Input label="New password" type="password" value={newPassword} onChange={(e) => { setNewPassword(e.target.value); setPwdErrors(prev => ({ ...prev, newPassword: undefined })) }} autoComplete="new-password" error={pwdErrors.newPassword} />
                                <Input label="Confirm new password" type="password" value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); setPwdErrors(prev => ({ ...prev, confirmPassword: undefined })) }} autoComplete="new-password" error={pwdErrors.confirmPassword} />
                            </div>
                            <div className="flex justify-end">
                                <Button onClick={() => { setPwdSaving(true); savePasswordCall()?.finally(() => setPwdSaving(false)) }} loading={pwdSaving || pwdLoading} disabled={!canSave}>Update password</Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Sign out */}
                <Card>
                    <CardHeader>
                        <CardTitle>Sign out</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <p className="text-gray-600 text-sm">Sign out of your account on this device.</p>
                            <div className="flex justify-end">
                                <Button variant="outline" onClick={() => { signOutCall() }} disabled={!session}>Sign Out</Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
