import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { X, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react'

export type ToastVariant = 'success' | 'error' | 'info' | 'warning'

type ToastItem = {
    id: string
    message: string
    title?: string
    variant?: ToastVariant
    duration?: number
}

type ToastContextType = {
    push: (toast: Omit<ToastItem, 'id'>) => string
    remove: (id: string) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([])
    const timeouts = useRef<Record<string, number>>({})

    const remove = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
        const to = timeouts.current[id]
        if (to) {
            window.clearTimeout(to)
            delete timeouts.current[id]
        }
    }, [])

    const push = useCallback((toast: Omit<ToastItem, 'id'>) => {
        const id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)
        const variant = toast.variant ?? 'info'
        const defaultDuration = variant === 'error' ? 6000 : variant === 'warning' ? 5000 : variant === 'success' ? 3000 : 3500
        const duration = toast.duration ?? defaultDuration
        const item: ToastItem = { id, variant, duration, ...toast }
        setToasts((prev) => [...prev, item])

        const timeoutId = window.setTimeout(() => remove(id), duration)
        timeouts.current[id] = timeoutId

        return id
    }, [remove])

    const value = useMemo(() => ({ push, remove }), [push, remove])

    return (
        <ToastContext.Provider value={value}>
            {children}
            {/* Toast viewport */}
            <div className="fixed top-4 right-4 z-[100] space-y-2 w-[calc(100%-2rem)] max-w-sm" role="region" aria-label="Notifications">
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        className={
                            'pointer-events-auto flex items-start gap-3 rounded-xl border p-3 shadow-lg bg-white ' +
                            (t.variant === 'success' ? 'border-green-200' : t.variant === 'error' ? 'border-red-200' : t.variant === 'warning' ? 'border-yellow-200' : 'border-gray-200')
                        }
                        role={t.variant === 'error' || t.variant === 'warning' ? 'alert' : 'status'}
                        aria-live={t.variant === 'error' ? 'assertive' : 'polite'}
                    >
                        <div className="mt-0.5">
                            {t.variant === 'success' && <CheckCircle aria-hidden className="h-5 w-5 text-green-600" />}
                            {t.variant === 'error' && <XCircle aria-hidden className="h-5 w-5 text-red-600" />}
                            {t.variant === 'warning' && <AlertTriangle aria-hidden className="h-5 w-5 text-yellow-600" />}
                            {(!t.variant || t.variant === 'info') && <Info aria-hidden className="h-5 w-5 text-brand-600" />}
                        </div>
                        <div className="flex-1 min-w-0">
                            {t.title && <p className="text-sm font-medium text-gray-900">{t.title}</p>}
                            <p className="text-sm text-gray-700">{t.message}</p>
                        </div>
                        <button
                            onClick={() => remove(t.id)}
                            className="shrink-0 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                            aria-label="Dismiss notification"
                            style={{ minWidth: 44, minHeight: 44 }}
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    )
}

export function useToast() {
    const ctx = useContext(ToastContext)
    if (!ctx) throw new Error('useToast must be used within a ToastProvider')
    return ctx
}
