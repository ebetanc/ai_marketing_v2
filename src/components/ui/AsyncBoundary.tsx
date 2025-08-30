import React from "react";
import { Card, CardContent } from "./Card";
import { Skeleton } from "./Skeleton";

type AsyncBoundaryProps = {
  loading: boolean;
  error?: string | null;
  fallbackItems?: number;
  onRetry?: () => void;
  children: React.ReactNode;
};

export function AsyncBoundary({
  loading,
  error,
  fallbackItems = 3,
  onRetry,
  children,
}: AsyncBoundaryProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: fallbackItems }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4 space-y-3">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div
            role="alert"
            aria-live="polite"
            className="flex items-center justify-between"
          >
            <p className="text-red-600">{error}</p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                Retry
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}
