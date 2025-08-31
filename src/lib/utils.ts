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

// Basic relative time formatter (e.g. "3h ago")
const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
const divisions: { amount: number; name: Intl.RelativeTimeFormatUnit }[] = [
  { amount: 60, name: "seconds" },
  { amount: 60, name: "minutes" },
  { amount: 24, name: "hours" },
  { amount: 7, name: "days" },
  { amount: 4.34524, name: "weeks" },
  { amount: 12, name: "months" },
  { amount: Number.POSITIVE_INFINITY, name: "years" },
];

export function relativeTime(date: string | number | Date) {
  const d = new Date(date).getTime();
  const now = Date.now();
  let diff = (d - now) / 1000; // seconds
  for (const div of divisions) {
    if (Math.abs(diff) < div.amount) {
      return rtf.format(Math.round(diff), div.name);
    }
    diff /= div.amount;
  }
  return ""; // should never reach
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
