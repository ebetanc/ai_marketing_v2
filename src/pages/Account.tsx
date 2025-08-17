import React, { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { useToast } from '../components/ui/Toast'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export function Account() {
    useDocumentTitle('Account — AI Marketing')
    const { session } = useAuth()
    const { push } = useToast()

    const user = session?.user

    // Metadata
    const [name, setName] = useState<string>('')
    const [metaSaving, setMetaSaving] = useState(false)

    // Email
    const [email, setEmail] = useState<string>('')
    const [emailSaving, setEmailSaving] = useState(false)

    // Password
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [pwdSaving, setPwdSaving] = useState(false)

    useEffect(() => {
        const meta = (user?.user_metadata || {}) as any
        setName(meta?.name ?? '')
        setEmail(user?.email ?? '')
    }, [user?.id, user?.email, user?.user_metadata])

    const userId = user?.id ?? '—'
    const emailVerified = Boolean(user?.email_confirmed_at)

    const canSave = useMemo(() => Boolean(user), [user])

    const saveMetadata = async () => {
        if (!canSave) return
        if (!isSupabaseConfigured) {
            push({ title: 'Demo mode', message: 'Supabase is not configured; changes are not persisted.', variant: 'warning' })
            return
        }
        setMetaSaving(true)
        try {
            const { error } = await supabase.auth.updateUser({ data: { name } as any })
            if (error) throw error
            push({ title: 'Profile updated', message: 'Your profile details were saved.', variant: 'success' })
        } catch (e: any) {
            push({ title: 'Update failed', message: e?.message || 'Could not update profile.', variant: 'error' })
        } finally {
            setMetaSaving(false)
        }
    }

    const saveEmail = async () => {
        if (!canSave) return
        const next = email.trim()
        if (!next) {
            push({ title: 'Invalid email', message: 'Email cannot be empty.', variant: 'warning' })
            return
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(next)) {
            push({ title: 'Invalid email', message: 'Please enter a valid email address.', variant: 'warning' })
            return
        }
        if (!isSupabaseConfigured) {
            push({ title: 'Demo mode', message: 'Supabase is not configured; email change not persisted.', variant: 'warning' })
            return
        }
        setEmailSaving(true)
        try {
            const { error } = await supabase.auth.updateUser({ email: next })
            if (error) throw error
            push({ title: 'Check your email', message: 'We sent a confirmation link to update your address.', variant: 'info' })
        } catch (e: any) {
            push({ title: 'Email update failed', message: e?.message || 'Could not update email.', variant: 'error' })
        } finally {
            setEmailSaving(false)
        }
    }

    const savePassword = async () => {
        if (!canSave) return
        if (newPassword.length < 8) {
            push({ title: 'Weak password', message: 'Password must be at least 8 characters.', variant: 'warning' })
            return
        }
        if (newPassword !== confirmPassword) {
            push({ title: 'Mismatch', message: 'New password and confirmation do not match.', variant: 'warning' })
            return
        }
        if (!isSupabaseConfigured) {
            push({ title: 'Demo mode', message: 'Supabase is not configured; password change not persisted.', variant: 'warning' })
            return
        }
        setPwdSaving(true)
        try {
            // Optional re-auth check if currentPassword provided
            if (currentPassword && user?.email) {
                const { error: reauthError } = await supabase.auth.signInWithPassword({ email: user.email, password: currentPassword })
                if (reauthError) {
                    push({ title: 'Invalid current password', message: 'Please verify your current password.', variant: 'error' })
                    setPwdSaving(false)
                    return
                }
            }
            const { error } = await supabase.auth.updateUser({ password: newPassword })
            if (error) throw error
            setCurrentPassword('')
            setNewPassword('')
            setConfirmPassword('')
            push({ title: 'Password updated', message: 'Your password was changed successfully.', variant: 'success' })
        } catch (e: any) {
            push({ title: 'Password update failed', message: e?.message || 'Could not update password.', variant: 'error' })
        } finally {
            setPwdSaving(false)
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Account</h1>
                <p className="mt-2 text-gray-600">Manage your Supabase Auth profile, email, and password.</p>
            </div>

            {!isSupabaseConfigured && (
                <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
                    Supabase is not configured. This page runs in demo mode and will not persist changes.
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
                                <Button onClick={saveMetadata} loading={metaSaving} disabled={!canSave}>Save profile</Button>
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
                            <Input label="Email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                            <div className="flex justify-end">
                                <Button onClick={saveEmail} loading={emailSaving} disabled={!canSave}>Update email</Button>
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
                            <Input label="Current password (optional)" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoComplete="current-password" />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Input label="New password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" />
                                <Input label="Confirm new password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" />
                            </div>
                            <div className="flex justify-end">
                                <Button onClick={savePassword} loading={pwdSaving} disabled={!canSave}>Update password</Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
