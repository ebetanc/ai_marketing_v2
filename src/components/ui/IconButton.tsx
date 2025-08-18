import React from 'react'
import { cn } from '../../lib/utils'

export type IconButtonVariant = 'default' | 'danger' | 'ghost'
export type IconButtonSize = 'sm' | 'md' | 'lg'

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    'aria-label': string
    variant?: IconButtonVariant
    size?: IconButtonSize
}

export function IconButton({
    className,
    variant = 'default',
    size = 'md',
    children,
    type = 'button',
    ...props
}: IconButtonProps) {
    return (
        <button
            type={type}
            className={cn(
                'inline-flex items-center justify-center rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white motion-safe:transition-colors',
                // sizes
                size === 'sm' ? 'p-1.5' : size === 'lg' ? 'p-3' : 'p-2',
                // variants
                variant === 'default' && 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus-visible:ring-brand-500',
                variant === 'ghost' && 'text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus-visible:ring-gray-500',
                variant === 'danger' && 'text-gray-600 hover:text-red-700 hover:bg-red-50 focus-visible:ring-red-500',
                className
            )}
            style={{ minWidth: 44, minHeight: 44 }}
            {...props}
        >
            {children}
        </button>
    )
}
