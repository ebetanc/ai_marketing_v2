import React from "react";
import { cn } from "../../lib/utils";

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  description?: string;
}

export function Textarea({
  className,
  label,
  error,
  description,
  id,
  onKeyDown,
  onKeyUp,
  ...props
}: TextareaProps) {
  const autoId = React.useId();
  const textareaId = id ?? autoId;
  const describedIds =
    [
      error ? `${textareaId}-error` : undefined,
      description ? `${textareaId}-desc` : undefined,
    ]
      .filter(Boolean)
      .join(" ") || undefined;
  return (
    <div className="space-y-1">
      {label && (
        <label
          htmlFor={textareaId}
          className={cn(
            // Upgrade to text-base (16px) per accessibility guideline
            "block text-base font-medium",
            props.disabled || (props as any).readOnly
              ? "text-gray-500"
              : "text-gray-700",
          )}
        >
          {label}
        </label>
      )}
      <textarea
        className={cn(
          "block w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 placeholder-gray-500 motion-safe:transition-colors focus:border-brand-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200 resize-none",
          (props.disabled || (props as any).readOnly) &&
            "bg-gray-50 text-gray-500 cursor-not-allowed placeholder-gray-400",
          error && "border-red-300 focus:border-red-500",
          className,
        )}
        id={textareaId}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={describedIds}
        aria-required={props.required || undefined}
        style={{ minHeight: 88 }}
        {...props}
        onKeyDown={(e) => {
          onKeyDown?.(e);
        }}
        onKeyUp={(e) => {
          onKeyUp?.(e);
        }}
      />
      {description && !error && (
        <p
          id={`${textareaId}-desc`}
          className="text-base text-gray-600 leading-snug"
        >
          {description}
        </p>
      )}
      {error && (
        <p
          id={`${textareaId}-error`}
          className="text-base text-red-600 font-medium"
        >
          {error}
        </p>
      )}
    </div>
  );
}
