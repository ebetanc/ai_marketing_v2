import React from 'react'
import { cn } from '../../lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ className, label, error, id, onKeyDown, onKeyUp, ...props }: InputProps) {
  const autoId = React.useId()
  const inputId = id ?? autoId
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={inputId} className={cn("block text-sm font-medium", (props.disabled || props.readOnly) ? 'text-gray-500' : 'text-gray-700')}>
          {label}
        </label>
      )}
      <input
        className={cn(
          'block w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 placeholder-gray-500 motion-safe:transition-colors focus:border-brand-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200',
          (props.disabled || props.readOnly) && 'bg-gray-50 text-gray-500 cursor-not-allowed placeholder-gray-400',
          error && 'border-red-300 focus:border-red-500',
          className
        )}
        id={inputId}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={error ? `${inputId}-error` : undefined}
        style={{ minHeight: 44 }}
        {...props}
        onKeyDown={(e) => {
          onKeyDown?.(e)
        }}
        onKeyUp={(e) => {
          onKeyUp?.(e)
        }}
      />
      {error && (
        <p id={`${inputId}-error`} className="text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}
