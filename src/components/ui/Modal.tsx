import React, { useEffect, useRef } from 'react'

type ModalProps = {
    isOpen: boolean
    onClose: () => void
    children: React.ReactNode
    labelledById?: string
    describedById?: string
    role?: 'dialog' | 'alertdialog'
    className?: string
    backdropClassName?: string
    id?: string
}

// Accessible modal with focus trap, ESC/overlay close, and body scroll lock
export function Modal({ isOpen, onClose, children, labelledById, describedById, role = 'dialog', className, backdropClassName, id }: ModalProps) {
    const overlayRef = useRef<HTMLDivElement | null>(null)
    const dialogRef = useRef<HTMLDivElement | null>(null)
    const previouslyFocused = useRef<Element | null>(null)
    // Keep latest onClose without retriggering effects
    const onCloseRef = useRef(onClose)
    useEffect(() => {
        onCloseRef.current = onClose
    }, [onClose])

    useEffect(() => {
        if (!isOpen) return
        previouslyFocused.current = document.activeElement

        // Lock body scroll
        const originalOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'

        // Focus management: prefer form fields and don't steal focus if user already focused inside
        const focusFirst = () => {
            const dialog = dialogRef.current
            if (!dialog) return

            // If the user has already focused something inside the dialog (e.g. clicked an input), don't override
            const active = document.activeElement as HTMLElement | null
            if (active && dialog.contains(active)) return

            // Prefer explicit autofocus markers or form controls
            const preferred = dialog.querySelector<HTMLElement>('[autofocus], [data-autofocus], input, textarea, select')
            const focusable = Array.from(
                dialog.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
            ).filter(el => !el.hasAttribute('disabled'))

            const target = preferred || focusable[0] || dialog
            target.focus({ preventScroll: true } as any)
        }
        // Slight delay to ensure rendered; guarded to avoid overriding user focus
        const id = window.setTimeout(focusFirst, 0)

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.stopPropagation()
                onCloseRef.current?.()
            } else if (e.key === 'Tab') {
                // Trap focus
                const dialog = dialogRef.current
                if (!dialog) return
                const focusable = Array.from(
                    dialog.querySelectorAll<HTMLElement>(
                        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                    )
                ).filter(el => !el.hasAttribute('disabled'))
                if (focusable.length === 0) return
                const first = focusable[0]
                const last = focusable[focusable.length - 1]
                const active = document.activeElement as HTMLElement | null
                if (e.shiftKey) {
                    if (active === first || !dialog.contains(active)) {
                        last.focus()
                        e.preventDefault()
                    }
                } else {
                    if (active === last) {
                        first.focus()
                        e.preventDefault()
                    }
                }
            }
        }
        document.addEventListener('keydown', handleKeyDown, true)

        return () => {
            window.clearTimeout(id)
            document.removeEventListener('keydown', handleKeyDown, true)
            document.body.style.overflow = originalOverflow
            // Restore focus
            const prev = previouslyFocused.current as HTMLElement | null
            prev?.focus?.()
        }
    }, [isOpen])

    if (!isOpen) return null

    const onOverlayClick = (e: React.MouseEvent) => {
        if (e.target === overlayRef.current) {
            onClose()
        }
    }

    // Base layout is always a vertical flex with constrained height so inner content can fill and scroll
    const baseClasses = 'overflow-hidden flex flex-col w-full max-h-[90vh]'
    const defaultClasses = 'bg-white rounded-2xl shadow-2xl max-w-2xl'
    const appliedClasses = className ? `${className} ${baseClasses}` : `${defaultClasses} ${baseClasses}`

    return (
        <div
            ref={overlayRef}
            onMouseDown={onOverlayClick}
            role="presentation"
            className={backdropClassName || 'fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50'}
        >
            <div
                ref={dialogRef}
                role={role}
                aria-modal="true"
                aria-labelledby={labelledById}
                aria-describedby={describedById}
                id={id}
                tabIndex={-1}
                className={appliedClasses}
            >
                {children}
            </div>
        </div>
    )
}
