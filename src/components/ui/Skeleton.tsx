import React from "react";
import { cn } from "../../lib/utils";

type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-xl bg-gray-200 motion-reduce:animate-none animate-pulse",
        className,
      )}
      aria-hidden="true"
    />
  );
}
