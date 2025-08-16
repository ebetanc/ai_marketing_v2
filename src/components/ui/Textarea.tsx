import React from 'react'
import { cn } from '../../lib/utils'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export function Textarea({ className, label, error, id, onKeyDown, onKeyUp, ...props }: TextareaProps) {
  const autoId = React.useId()
  const textareaId = id ?? autoId
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={textareaId} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <textarea
        className={cn(
          'block w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 placeholder-gray-500 motion-safe:transition-colors focus:border-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 resize-none',
          error && 'border-red-300 focus:border-red-500',
          className
        )}
        id={textareaId}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={error ? `${textareaId}-error` : undefined}
        {...props}
        onKeyDown={(e) => {
          onKeyDown?.(e)
        }}
        onKeyUp={(e) => {
          onKeyUp?.(e)
        }}
      />
      {error && (
        <p id={`${textareaId}-error`} className="text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}
