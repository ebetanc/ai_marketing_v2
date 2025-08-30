import React from "react";
import { cn } from "../../lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "primary" | "secondary" | "success" | "warning" | "error";
  children: React.ReactNode;
}

export function Badge({
  className,
  variant = "secondary",
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        // Enforce minimum 16px font size; adjust padding to keep visual weight reasonable
        "inline-flex items-center rounded-full px-3 py-1 text-base font-medium motion-safe:transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
        {
          "bg-brand-100 text-brand-800": variant === "primary",
          "bg-gray-100 text-gray-800": variant === "secondary",
          "bg-green-100 text-green-800": variant === "success",
          "bg-yellow-100 text-yellow-800": variant === "warning",
          "bg-red-100 text-red-800": variant === "error",
        },
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
