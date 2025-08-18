import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../lib/utils'

// Simple modal stack to ensure only the top-most modal handles ESC/overlay
const modalStack: HTMLElement[] = []
// Global management for background inertness and scroll lock across multiple modals
let hiddenRoots: HTMLElement[] | null = null
let scrollLockCount = 0
let originalBodyOverflow: string | null = null

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
    dismissible?: boolean // when false, disable overlay and ESC close
    size?: 'sm' | 'md' | 'lg' | 'xl'
}

// Accessible modal with focus trap, ESC/overlay close, and body scroll lock
export function Modal({ isOpen, onClose, children, labelledById, describedById, role = 'dialog', className, backdropClassName, id, dismissible = true, size = 'md' }: ModalProps) {
    const [overlayEl, setOverlayEl] = useState<HTMLDivElement | null>(null)
    const [dialogEl, setDialogEl] = useState<HTMLDivElement | null>(null)
    const previouslyFocused = useRef<Element | null>(null)
    // Keep latest onClose without retriggering effects
    const onCloseRef = useRef(onClose)
    useEffect(() => {
        onCloseRef.current = onClose
    }, [onClose])
    useEffect(() => {
        // Wait until dialog and overlay refs exist before applying modal behaviors
        if (!isOpen || !dialogEl || !overlayEl) return
        previouslyFocused.current = document.activeElement

        // Lock body scroll with global reference count
        if (scrollLockCount === 0) {
            originalBodyOverflow = document.body.style.overflow
            document.body.style.overflow = 'hidden'
        }
        scrollLockCount += 1

        // Register in modal stack using stable element references
        const currentDialog = dialogEl || undefined
        const currentOverlay = overlayEl || undefined
        if (currentDialog) {
            modalStack.push(currentDialog)
        }
        const isFirstModal = modalStack.length === 1

        // Hide background from assistive tech and disable interaction (where supported)
        // Consider all immediate children of body except the overlay/dialog we portal into
        if (isFirstModal) {
            const bodyChildren = Array.from(document.body.children) as HTMLElement[]
            const appRoots = bodyChildren.filter((el) => el !== currentOverlay)
            hiddenRoots = appRoots
            appRoots.forEach((el) => {
                el.setAttribute('aria-hidden', 'true')
                // inert is not supported in all browsers; use where available to disable focus/interaction
                try { (el as any).inert = true } catch { /* no-op */ }
            })
        }

        // Focus management: prefer form fields and don't steal focus if user already focused inside
        const isVisible = (el: HTMLElement) => {
            const style = window.getComputedStyle(el)
            if (style.visibility === 'hidden' || style.display === 'none') return false
            if (!el.offsetParent && style.position !== 'fixed') return false
            return true
        }

        const getFocusable = (root: HTMLElement) =>
            Array.from(
                root.querySelectorAll<HTMLElement>(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                )
            ).filter(el => !el.hasAttribute('disabled') && isVisible(el))

        const focusFirst = () => {
            const dialog = currentDialog
            if (!dialog) return

            // If the user has already focused something inside the dialog (e.g. clicked an input), don't override
            const active = document.activeElement as HTMLElement | null
            if (active && dialog.contains(active)) return

            // Prefer explicit autofocus markers or form controls
            const preferred = dialog.querySelector<HTMLElement>('[autofocus], [data-autofocus], input, textarea, select')
            const focusable = getFocusable(dialog)

            const target = preferred || focusable[0] || dialog
            target.focus({ preventScroll: true } as any)
        }
        // Slight delay to ensure rendered; guarded to avoid overriding user focus
        const timeoutId = window.setTimeout(focusFirst, 0)

        const handleKeyDown = (e: KeyboardEvent) => {
            // Only the top-most modal should react to ESC/Tab trapping
            const top = modalStack[modalStack.length - 1]
            if (!top || top !== currentDialog) return
            if (e.key === 'Escape') {
                e.stopPropagation()
                if (dismissible) onCloseRef.current?.()
            } else if (e.key === 'Tab') {
                // Trap focus
                const dialog = currentDialog
                if (!dialog) return
                const focusable = getFocusable(dialog)
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
            window.clearTimeout(timeoutId)
            document.removeEventListener('keydown', handleKeyDown, true)
            // Unlock body scroll when the last modal closes
            scrollLockCount = Math.max(0, scrollLockCount - 1)
            if (scrollLockCount === 0) {
                document.body.style.overflow = originalBodyOverflow ?? ''
                originalBodyOverflow = null
            }
            // Unregister from modal stack
            const dialogNode = currentDialog
            if (dialogNode) {
                const idx = modalStack.lastIndexOf(dialogNode)
                if (idx !== -1) modalStack.splice(idx, 1)
            }
            // Restore background interactivity and a11y exposure only when last modal closes
            if (modalStack.length === 0 && hiddenRoots) {
                hiddenRoots.forEach((el) => {
                    el.removeAttribute('aria-hidden')
                    try { (el as any).inert = false } catch { /* no-op */ }
                })
                hiddenRoots = null
            }
            // Restore focus
            const prev = previouslyFocused.current as HTMLElement | null
            prev?.focus?.()
        }
    }, [isOpen, dismissible, dialogEl, overlayEl])

    if (!isOpen) return null

    const onOverlayClick = (e: React.MouseEvent) => {
        if (!dismissible) return
        // Only top-most modal should close on overlay click
        const top = modalStack[modalStack.length - 1]
        const currentDialog = dialogEl || undefined
        const currentOverlay = overlayEl || undefined
        if (e.target === currentOverlay && top === currentDialog) {
            onClose()
        }
    }

    // Base layout is always a vertical flex with constrained height so inner content can fill and scroll
    const sizeClass = size === 'sm' ? 'max-w-md' : size === 'lg' ? 'max-w-4xl' : size === 'xl' ? 'max-w-5xl' : 'max-w-2xl'
    const baseClasses = 'overflow-hidden flex flex-col w-full max-h-[90vh]'
    const defaultClasses = `bg-white rounded-card shadow-2xl ${sizeClass}`
    const appliedClasses = className ? `${className} ${baseClasses}` : `${defaultClasses} ${baseClasses}`

    const modalUI = (
        <div
            ref={(el) => { setOverlayEl(el) }}
            onMouseDown={onOverlayClick}
            role="presentation"
            // Use very high z-index to stay above app chrome; attach via portal to body so it always spans viewport
            className={backdropClassName || 'fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]'}
        >
            <div
                ref={(el) => { setDialogEl(el) }}
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

    return createPortal(modalUI, document.body)
}

// Modal subcomponents for consistent layout and semantics
type ModalSectionProps = React.HTMLAttributes<HTMLDivElement>

export function ModalHeader({ className, ...props }: ModalSectionProps) {
    return (
        <div
            className={cn('flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0', className)}
            {...props}
        />
    )
}

export function ModalBody({ className, ...props }: ModalSectionProps) {
    return (
        <div
            className={cn('flex-1 min-h-0 overflow-y-auto p-6', className)}
            {...props}
        />
    )
}

export function ModalFooter({ className, ...props }: ModalSectionProps) {
    return (
        <div
            className={cn('flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0', className)}
            {...props}
        />
    )
}

type ModalTitleProps = React.HTMLAttributes<HTMLHeadingElement> & { id?: string }
export function ModalTitle({ className, ...props }: ModalTitleProps) {
    return (
        <h2 className={cn('text-xl font-bold text-gray-900', className)} {...props} />
    )
}
