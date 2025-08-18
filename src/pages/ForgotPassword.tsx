import React, { useState } from 'react'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { supabase } from '../lib/supabase'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export default function ForgotPassword() {
    useDocumentTitle('Forgot password — AI Marketing')
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setMessage(null)
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${siteUrl}/reset-password`,
            })
            if (error) throw error
            setMessage('If that email exists, we sent a reset link.')
        } catch (err: any) {
            setError(err?.message || 'Couldn’t send reset email.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow p-6 space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Forgot password</h1>
                    <p className="text-gray-500 text-sm mt-1">We’ll email a reset link.</p>
                </div>
                <form onSubmit={onSubmit} className="space-y-4">
                    <Input
                        type="email"
                        label="Email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <Button type="submit" loading={loading} className="w-full">Send link</Button>
                </form>
                {message && <div className="text-sm text-green-600">{message}</div>}
                {error && <div className="text-sm text-red-600">{error}</div>}
            </div>
        </div>
    )
}
