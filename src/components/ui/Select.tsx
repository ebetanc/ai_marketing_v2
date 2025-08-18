import React from 'react'
import { cn } from '../../lib/utils'
import { ChevronDown } from 'lucide-react'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
}

export function Select({ className, label, error, options, id, onKeyDown, onKeyUp, ...props }: SelectProps) {
  const autoId = React.useId()
  const selectId = id ?? autoId
  return (
    <div className="space-y-1">
      {label && (
        <label
          htmlFor={selectId}
          className={cn('block text-sm font-medium', props.disabled ? 'text-gray-500' : 'text-gray-700')}
        >
          {label}
        </label>
      )}
      <div className="relative">
        <select
          className={cn(
            'block w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 motion-safe:transition-colors focus:border-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 appearance-none bg-white',
            error && 'border-red-300 focus:border-red-500',
            className
          )}
          id={selectId}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={error ? `${selectId}-error` : undefined}
          {...props}
          onKeyDown={(e) => {
            onKeyDown?.(e)
          }}
          onKeyUp={(e) => {
            onKeyUp?.(e)
          }}
          // Ensure comfortable tap target height
          style={{ minHeight: 44 }}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown aria-hidden className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
      </div>
      {error && (
        <p id={`${selectId}-error`} className="text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}
