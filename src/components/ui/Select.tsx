import React from "react";
import { cn } from "../../lib/utils";
import { ChevronDown } from "lucide-react";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  description?: string;
  placeholder?: string;
  options: { value: string; label: string }[];
}

export function Select({
  className,
  label,
  error,
  description,
  placeholder,
  options,
  id,
  onKeyDown,
  onKeyUp,
  ...props
}: SelectProps) {
  const autoId = React.useId();
  const selectId = id ?? autoId;
  const describedIds =
    [
      error ? `${selectId}-error` : undefined,
      description ? `${selectId}-desc` : undefined,
    ]
      .filter(Boolean)
      .join(" ") || undefined;
  return (
    <div className="space-y-1">
      {label && (
        <label
          htmlFor={selectId}
          className={cn(
            // Enforce minimum 16px font size
            "block text-base font-medium",
            props.disabled || (props as any).readOnly
              ? "text-gray-500"
              : "text-gray-700",
          )}
        >
          {label}
          {props.required && (
            <span aria-hidden className="text-red-600 ml-0.5">
              *
            </span>
          )}
        </label>
      )}
      <div className="relative">
        <select
          className={cn(
            "block w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 motion-safe:transition-colors focus:border-brand-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200 appearance-none bg-white",
            (props.disabled || (props as any).readOnly) &&
              "bg-gray-50 text-gray-500 cursor-not-allowed",
            error && "border-red-300 focus:border-red-500",
            className,
          )}
          id={selectId}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={describedIds}
          aria-required={props.required || undefined}
          {...props}
          onKeyDown={(e) => {
            onKeyDown?.(e);
          }}
          onKeyUp={(e) => {
            onKeyUp?.(e);
          }}
          // Ensure comfortable tap target height
          style={{ minHeight: 44 }}
        >
          {placeholder && (
            <option value="" disabled={props.required} hidden={!!props.value}>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden
          className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none"
        />
      </div>
      {description && !error && (
        <p
          id={`${selectId}-desc`}
          className="text-base text-gray-600 leading-snug"
        >
          {description}
        </p>
      )}
      {error && (
        <p
          id={`${selectId}-error`}
          className="text-base text-red-600 font-medium"
        >
          {error}
        </p>
      )}
    </div>
  );
}
