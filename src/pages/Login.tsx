import React, { useMemo, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { supabase } from '../lib/supabase'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'

export default function Login() {
    useDocumentTitle('Sign in — AI Marketing')
    const { session } = useAuth()
    const location = useLocation()
    const redirectTo = useMemo(() => {
        const params = new URLSearchParams(location.search)
        return params.get('redirectTo') || (location.state as any)?.from?.pathname || '/dashboard'
    }, [location])

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const minPasswordLength = 6

    if (session) {
        return <Navigate to={redirectTo || '/dashboard'} replace />
    }

    const handleSignUp = async () => {
        setLoading(true)
        setError(null)
        setMessage(null)
        try {
            if (password.length < minPasswordLength) {
                throw new Error(`Password must be at least ${minPasswordLength} characters.`)
            }
            const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    // If email confirmations are enabled, this controls where Supabase redirects after the user confirms.
                    emailRedirectTo: `${siteUrl}/?redirectTo=${encodeURIComponent(redirectTo)}`,
                },
            })
            if (error) throw error
            // If confirmations are enabled, session will be null and user must confirm via email first.
            if (data?.session) {
                window.location.assign(redirectTo || '/dashboard')
            } else if (data?.user) {
                setMessage('Account created. Check your email to confirm your address. You’ll be signed in automatically after confirming.')
            }
        } catch (err: any) {
            setError(err?.message || 'Sign up failed.')
        } finally {
            setLoading(false)
        }
    }

    const handleSignIn = async () => {
        setLoading(true)
        setError(null)
        setMessage(null)
        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password })
            if (error) throw error
            if (data?.user) {
                window.location.assign(redirectTo || '/dashboard')
            }
        } catch (err: any) {
            const msg = err?.message || 'Sign in failed.'
            // Heuristic for unconfirmed email message
            if (/confirm/i.test(msg) && /email/i.test(msg)) {
                setError('Email not confirmed. Check your inbox or resend the confirmation email below.')
            } else if (/invalid/i.test(msg) && /credentials|login/i.test(msg)) {
                setError('Invalid email or password.')
            } else {
                setError(msg)
            }
        } finally {
            setLoading(false)
        }
    }

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
                        required
                    />
                    <Input
                        type="password"
                        label="Password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    {/* Removed confirm password to streamline sign up */}
                    <div className="grid grid-cols-2 gap-2">
                        <Button type="button" onClick={handleSignIn} loading={loading} disabled={!email || !password}>Sign in</Button>
                        <Button type="button" variant="outline" onClick={handleSignUp} loading={loading} disabled={!email || !password}>Sign up</Button>
                    </div>
                    <div className="text-right">
                        <a href="/forgot-password" className="text-xs text-blue-600 hover:underline">Forgot password?</a>
                    </div>
                </div>

                {message && <div className="text-sm text-green-600">{message}</div>}
                {error && (
                    <div className="space-y-2">
                        <div className="text-sm text-red-600">{error}</div>
                        {(/not\s*confirmed/i.test(error) || /resend/i.test(error)) && (
                            <div>
                                <ResendConfirmation email={email} redirectTo={redirectTo} onDone={(ok) => setMessage(ok ? 'Confirmation email sent.' : null)} />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

function ResendConfirmation({ email, redirectTo, onDone }: { email: string; redirectTo: string; onDone?: (ok: boolean) => void }) {
    const [sending, setSending] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)
    const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin
    const onClick = async () => {
        if (!email) return
        setSending(true)
        setError(null)
        try {
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email,
                options: { emailRedirectTo: `${siteUrl}/?redirectTo=${encodeURIComponent(redirectTo)}` },
            })
            if (error) throw error
            onDone?.(true)
        } catch (err: any) {
            setError(err?.message || 'Failed to resend confirmation.')
            onDone?.(false)
        } finally {
            setSending(false)
        }
    }
    return (
        <div className="text-xs">
            <Button type="button" size="sm" variant="outline" onClick={onClick} disabled={!email} loading={sending}>
                Resend confirmation email
            </Button>
            {error && <div className="text-red-600 mt-1">{error}</div>}
        </div>
    )
}
