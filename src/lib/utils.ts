import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatTime(date: string) {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function truncateText(text: string, maxLength: number) {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

// Wrap a promise to ensure errors are caught; handy for fire-and-forget UI handlers
export function swallow<T>(p: Promise<T>): void {
  void p.then(
    () => undefined,
    () => undefined,
  );
}

// ARIA helpers
export function ariaBusy(loading?: boolean) {
  return loading ? { "aria-busy": true } : {};
}
