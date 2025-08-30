import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { X, CheckCircle, XCircle, AlertTriangle, Info } from "lucide-react";

export type ToastVariant = "success" | "error" | "info" | "warning";

type ToastItem = {
  id: string;
  message: string;
  title?: string;
  variant?: ToastVariant;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
    ariaLabel?: string;
  };
};

type ToastContextType = {
  push: (toast: Omit<ToastItem, "id">) => string;
  remove: (id: string) => void;
  clearAll: () => void;
  success: (
    message: string,
    opts?: Omit<ToastItem, "id" | "message" | "variant">,
  ) => string;
  error: (
    message: string,
    opts?: Omit<ToastItem, "id" | "message" | "variant">,
  ) => string;
  info: (
    message: string,
    opts?: Omit<ToastItem, "id" | "message" | "variant">,
  ) => string;
  warning: (
    message: string,
    opts?: Omit<ToastItem, "id" | "message" | "variant">,
  ) => string;
};

const ToastContext = createContext<ToastContextType | null>(null);

type ToastProviderProps = {
  children: React.ReactNode;
  maxVisible?: number;
  dedupeWindowMs?: number;
  allowActions?: boolean;
};

export function ToastProvider({
  children,
  maxVisible = 3,
  dedupeWindowMs = 500,
  allowActions = true,
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timeouts = useRef<Record<string, number>>({});
  const remaining = useRef<Record<string, number>>({});
  const lastStart = useRef<Record<string, number>>({});
  const queue = useRef<ToastItem[]>([]);
  const lastEmitted = useRef<Record<string, number>>({});

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const to = timeouts.current[id];
    if (to) {
      window.clearTimeout(to);
      delete timeouts.current[id];
    }
    delete remaining.current[id];
    delete lastStart.current[id];

    // If we have queued toasts, show the next one
    if (queue.current.length > 0) {
      const next = queue.current.shift()!;
      setToasts((prev) => [...prev, next]);
      remaining.current[next.id] = next.duration ?? 3500;
      lastStart.current[next.id] = Date.now();
      timeouts.current[next.id] = window.setTimeout(
        () => remove(next.id),
        remaining.current[next.id],
      );
    }
  }, []);

  const push = useCallback(
    (toast: Omit<ToastItem, "id">) => {
      const id = crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2);
      const variant = toast.variant ?? "info";
      const defaultDuration =
        variant === "error"
          ? 6000
          : variant === "warning"
            ? 5000
            : variant === "success"
              ? 3000
              : 3500;
      const duration = toast.duration ?? defaultDuration;
      const item: ToastItem = { id, variant, duration, ...toast };

      // Dedupe identical message+variant within a short window
      const key = `${item.variant}|${item.title || ""}|${item.message}`;
      const now = Date.now();
      const last = lastEmitted.current[key];
      if (last && now - last < dedupeWindowMs) {
        return id;
      }
      lastEmitted.current[key] = now;

      setToasts((prev) => {
        if (prev.length >= maxVisible) {
          queue.current.push(item);
          return prev;
        }
        remaining.current[id] = duration;
        lastStart.current[id] = Date.now();
        const timeoutId = window.setTimeout(() => remove(id), duration);
        timeouts.current[id] = timeoutId;
        return [...prev, item];
      });

      return id;
    },
    [remove, dedupeWindowMs, maxVisible],
  );

  const clearAll = useCallback(() => {
    // Remove visible
    toasts.forEach((t) => remove(t.id));
    // Clear queued
    queue.current = [];
  }, [toasts, remove]);

  const success = useCallback(
    (message: string, opts?: Omit<ToastItem, "id" | "message" | "variant">) =>
      push({ message, variant: "success", ...(opts || {}) }),
    [push],
  );
  const error = useCallback(
    (message: string, opts?: Omit<ToastItem, "id" | "message" | "variant">) =>
      push({ message, variant: "error", ...(opts || {}) }),
    [push],
  );
  const info = useCallback(
    (message: string, opts?: Omit<ToastItem, "id" | "message" | "variant">) =>
      push({ message, variant: "info", ...(opts || {}) }),
    [push],
  );
  const warning = useCallback(
    (message: string, opts?: Omit<ToastItem, "id" | "message" | "variant">) =>
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
      {/* Toast viewport */}
      <div
        className="fixed top-4 right-4 z-[100] space-y-2 w-[calc(100%-2rem)] max-w-sm"
        role="region"
        aria-label="Notifications"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={
              "pointer-events-auto flex items-start gap-3 rounded-xl border p-3 shadow-lg bg-white " +
              (t.variant === "success"
                ? "border-green-200"
                : t.variant === "error"
                  ? "border-red-200"
                  : t.variant === "warning"
                    ? "border-yellow-200"
                    : "border-gray-200")
            }
            tabIndex={0}
            role={
              t.variant === "error" || t.variant === "warning"
                ? "alert"
                : "status"
            }
            aria-live={t.variant === "error" ? "assertive" : "polite"}
            aria-atomic="true"
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                e.stopPropagation();
                remove(t.id);
              } else if (
                (e.key === "Enter" || e.key === " ") &&
                t.action &&
                e.currentTarget === e.target
              ) {
                // Activate action when the toast container itself has focus
                try {
                  t.action.onClick?.();
                } finally {
                  remove(t.id);
                }
              }
            }}
            onMouseEnter={() => {
              const id = t.id;
              const to = timeouts.current[id];
              if (to) {
                window.clearTimeout(to);
                const elapsed =
                  Date.now() - (lastStart.current[id] || Date.now());
                remaining.current[id] = Math.max(
                  0,
                  (remaining.current[id] || t.duration || 0) - elapsed,
                );
                delete timeouts.current[id];
              }
            }}
            onMouseLeave={() => {
              const id = t.id;
              if (timeouts.current[id]) return;
              const ms = remaining.current[id] ?? t.duration ?? 0;
              if (ms <= 0) {
                remove(id);
                return;
              }
              lastStart.current[id] = Date.now();
              timeouts.current[id] = window.setTimeout(() => remove(id), ms);
            }}
            onFocus={() => {
              const id = t.id;
              const to = timeouts.current[id];
              if (to) {
                window.clearTimeout(to);
                const elapsed =
                  Date.now() - (lastStart.current[id] || Date.now());
                remaining.current[id] = Math.max(
                  0,
                  (remaining.current[id] || t.duration || 0) - elapsed,
                );
                delete timeouts.current[id];
              }
            }}
            onBlur={() => {
              const id = t.id;
              if (timeouts.current[id]) return;
              const ms = remaining.current[id] ?? t.duration ?? 0;
              if (ms <= 0) {
                remove(id);
                return;
              }
              lastStart.current[id] = Date.now();
              timeouts.current[id] = window.setTimeout(() => remove(id), ms);
            }}
          >
            <div className="mt-0.5">
              {t.variant === "success" && (
                <CheckCircle aria-hidden className="h-5 w-5 text-green-600" />
              )}
              {t.variant === "error" && (
                <XCircle aria-hidden className="h-5 w-5 text-red-600" />
              )}
              {t.variant === "warning" && (
                <AlertTriangle
                  aria-hidden
                  className="h-5 w-5 text-yellow-600"
                />
              )}
              {(!t.variant || t.variant === "info") && (
                <Info aria-hidden className="h-5 w-5 text-brand-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              {t.title && (
                <p className="text-base font-semibold text-gray-900 leading-snug">
                  {t.title}
                </p>
              )}
              <p className="text-base text-gray-800 leading-snug">
                {t.message}
              </p>
            </div>
            {allowActions && t.action && (
              <button
                onClick={() => {
                  try {
                    t.action?.onClick?.();
                  } finally {
                    remove(t.id);
                  }
                }}
                className="shrink-0 rounded-md text-brand-700 hover:text-brand-900 hover:bg-brand-50 px-3 py-2 text-base font-medium"
                aria-label={t.action.ariaLabel || t.action.label}
                data-touch-target
              >
                {t.action.label}
              </button>
            )}
            <button
              onClick={() => remove(t.id)}
              className="shrink-0 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              aria-label="Dismiss notification"
              data-touch-target
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
