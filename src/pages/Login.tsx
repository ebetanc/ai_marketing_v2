import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { useAuth } from '../lib/auth'
import { Navigate } from 'react-router-dom'

export default function Login() {
    const { session } = useAuth()
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    const handleMagicLink = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setMessage(null)

        try {
            const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin
            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    emailRedirectTo: `${siteUrl}/`,
                },
            })
            if (error) throw error
            setMessage('Check your email for the login link.')
        } catch (err: any) {
            setError(err?.message || 'Failed to send magic link.')
        } finally {
            setLoading(false)
        }
    }

    if (session) {
        return <Navigate to="/dashboard" replace />
    }

    const handleGoogle = async () => {
        setLoading(true)
        setError(null)
        setMessage(null)
        try {
            const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${siteUrl}/`,
                },
            })
            if (error) throw error
            // Browser will redirect; nothing else to do here
        } catch (err: any) {
            setError(err?.message || 'Google sign-in failed.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow p-6 space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Sign in</h1>
                    <p className="text-gray-500 text-sm mt-1">Use your email to receive a magic link.</p>
                </div>

                <form onSubmit={handleMagicLink} className="space-y-4">
                    <Input
                        type="email"
                        label="Email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <Button type="submit" loading={loading} className="w-full">Send magic link</Button>
                </form>

                <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center">
                        <span className="bg-white px-2 text-xs text-gray-400">or</span>
                    </div>
                </div>

                <Button variant="outline" onClick={handleGoogle} loading={loading} className="w-full">
                    Continue with Google
                </Button>

                {message && <div className="text-sm text-green-600">{message}</div>}
                {error && <div className="text-sm text-red-600">{error}</div>}
            </div>
        </div>
    )
}
