import React from 'react'
import { cn } from '../../lib/utils'

interface SwitchProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
  'aria-label'?: string
}

export function Switch({ checked, onCheckedChange, disabled = false, ...rest }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-disabled={disabled || undefined}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      onKeyDown={(e) => {
        if (disabled) return
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault()
          onCheckedChange(!checked)
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault()
          if (checked) onCheckedChange(false)
        } else if (e.key === 'ArrowRight') {
          e.preventDefault()
          if (!checked) onCheckedChange(true)
        }
      }}
      {...rest}
      className={cn(
        'relative inline-flex h-6 w-11 items-center rounded-full motion-safe:transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white',
        checked ? 'bg-brand-600' : 'bg-gray-200',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      style={{ minWidth: 44, minHeight: 44 }}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
          checked ? 'translate-x-6' : 'translate-x-1'
        )}
      />
    </button>
  )
}
