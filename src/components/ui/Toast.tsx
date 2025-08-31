import React, { createContext, useCallback, useContext, useMemo } from "react";
import toast, { Toaster, ToastOptions } from "react-hot-toast";

export type ToastVariant = "success" | "error" | "info" | "warning";

type ToastInput = {
  message: string;
  title?: string; // kept for backward compatibility (will be concatenated)
  variant?: ToastVariant;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
    ariaLabel?: string;
  };
};

type ToastContextType = {
  push: (toast: Omit<ToastInput, "id">) => string;
  remove: (id: string) => void;
  clearAll: () => void;
  success: (
    message: string,
    opts?: Omit<ToastInput, "message" | "variant">,
  ) => string;
  error: (
    message: string,
    opts?: Omit<ToastInput, "message" | "variant">,
  ) => string;
  info: (
    message: string,
    opts?: Omit<ToastInput, "message" | "variant">,
  ) => string;
  warning: (
    message: string,
    opts?: Omit<ToastInput, "message" | "variant">,
  ) => string;
};

const ToastContext = createContext<ToastContextType | null>(null);

type ToastProviderProps = {
  children: React.ReactNode;
  maxVisible?: number; // not directly supported; kept for api compat
  dedupeWindowMs?: number; // not implemented; could be added via plugin logic
  allowActions?: boolean; // actions rendered inline if provided
};

export function ToastProvider({
  children,
  allowActions = true,
}: ToastProviderProps) {
  const push = useCallback(
    (t: ToastInput) => {
      const { variant = "info", title, message, duration, action } = t;
      const base: ToastOptions = {
        duration:
          duration ??
          (variant === "error"
            ? 6000
            : variant === "warning"
              ? 5000
              : variant === "success"
                ? 3000
                : 3500),
      };
      const body = (
        <div className="flex gap-3 items-start">
          <div className="flex-1 min-w-0">
            {title && (
              <p className="text-base font-semibold leading-snug">{title}</p>
            )}
            <p className="text-base leading-snug break-words">{message}</p>
          </div>
          {allowActions && action && (
            <button
              onClick={() => {
                try {
                  action.onClick();
                } finally {
                  /* dismiss via returned id below */
                }
              }}
              className="shrink-0 rounded-md text-brand-700 hover:text-brand-900 hover:bg-brand-50 px-2 py-1 text-sm font-medium"
              aria-label={action.ariaLabel || action.label}
            >
              {action.label}
            </button>
          )}
        </div>
      );

      let id: string;
      switch (variant) {
        case "success":
          id = toast.success(body, base);
          break;
        case "error":
          id = toast.error(body, base);
          break;
        case "warning":
          id = toast(body, { ...base, icon: "⚠️" });
          break;
        case "info":
        default:
          id = toast(body, base);
      }
      return id;
    },
    [allowActions],
  );

  const remove = useCallback((id: string) => toast.dismiss(id), []);
  const clearAll = useCallback(() => toast.dismiss(), []);
  const success = useCallback(
    (message: string, opts?: Omit<ToastInput, "message" | "variant">) =>
      push({ message, variant: "success", ...(opts || {}) }),
    [push],
  );
  const error = useCallback(
    (message: string, opts?: Omit<ToastInput, "message" | "variant">) =>
      push({ message, variant: "error", ...(opts || {}) }),
    [push],
  );
  const info = useCallback(
    (message: string, opts?: Omit<ToastInput, "message" | "variant">) =>
      push({ message, variant: "info", ...(opts || {}) }),
    [push],
  );
  const warning = useCallback(
    (message: string, opts?: Omit<ToastInput, "message" | "variant">) =>
      push({ message, variant: "warning", ...(opts || {}) }),
    [push],
  );

  const value = useMemo(
    () => ({ push, remove, clearAll, success, error, info, warning }),
    [push, remove, clearAll, success, error, info, warning],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toaster
        position="top-right"
        gutter={8}
        containerClassName="!z-[12000] pointer-events-none"
        toastOptions={{
          className:
            "rounded-xl border bg-white shadow-lg text-gray-900 pointer-events-auto",
          style: { maxWidth: "480px" },
          success: { iconTheme: { primary: "#16a34a", secondary: "white" } },
          error: { iconTheme: { primary: "#dc2626", secondary: "white" } },
        }}
      />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
