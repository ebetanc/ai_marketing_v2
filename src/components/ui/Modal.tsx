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
}

// Accessible modal with focus trap, ESC/overlay close, and body scroll lock
export function Modal({ isOpen, onClose, children, labelledById, describedById, role = 'dialog', className, backdropClassName }: ModalProps) {
    const overlayRef = useRef<HTMLDivElement | null>(null)
    const dialogRef = useRef<HTMLDivElement | null>(null)
    const previouslyFocused = useRef<Element | null>(null)

    useEffect(() => {
        if (!isOpen) return
        previouslyFocused.current = document.activeElement

        // Lock body scroll
        const originalOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'

        // Focus the first focusable element inside the dialog
        const focusFirst = () => {
            const dialog = dialogRef.current
            if (!dialog) return
            const focusable = dialog.querySelectorAll<HTMLElement>(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            )
                ; (focusable[0] || dialog).focus()
        }
        // Slight delay to ensure rendered
        const id = window.setTimeout(focusFirst, 0)

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.stopPropagation()
                onClose()
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
    }, [isOpen, onClose])

    if (!isOpen) return null

    const onOverlayClick = (e: React.MouseEvent) => {
        if (e.target === overlayRef.current) {
            onClose()
        }
    }

    const baseClasses = 'overflow-hidden flex flex-col'
    const defaultClasses = 'bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh]'
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
                className={appliedClasses}
            >
                {children}
            </div>
        </div>
    )
}
