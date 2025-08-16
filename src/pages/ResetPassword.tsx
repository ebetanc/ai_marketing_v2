import React, { useEffect, useState } from 'react'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { supabase } from '../lib/supabase'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useNavigate } from 'react-router-dom'

export default function ResetPassword() {
    useDocumentTitle('Reset password — AI Marketing')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const minPasswordLength = 6
    const navigate = useNavigate()

    // Optional: observe PASSWORD_RECOVERY, but we tolerate direct access and let updateUser handle errors.
    useEffect(() => {
        const { data: sub } = supabase.auth.onAuthStateChange((_event: any) => { })
        return () => {
            sub.subscription.unsubscribe()
        }
    }, [])

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setMessage(null)
        try {
            if (password.length < minPasswordLength) {
                throw new Error(`Password must be at least ${minPasswordLength} characters.`)
            }
            const { data, error } = await supabase.auth.updateUser({ password })
            if (error) throw error
            setMessage('Password updated. Redirecting to login...')
            setTimeout(() => navigate('/login', { replace: true }), 1200)
        } catch (err: any) {
            setError(err?.message || 'Failed to update password.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow p-6 space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Reset password</h1>
                    <p className="text-gray-500 text-sm mt-1">Enter your new password.</p>
                </div>
                <form onSubmit={onSubmit} className="space-y-4">
                    <Input
                        type="password"
                        label="New password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    {/* Confirm password removed per request */}
                    <Button type="submit" loading={loading} className="w-full">Update password</Button>
                </form>
                {message && <div className="text-sm text-green-600">{message}</div>}
                {error && <div className="text-sm text-red-600">{error}</div>}
            </div>
        </div>
    )
}
