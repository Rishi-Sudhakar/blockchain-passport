"use client";

import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-[10px] bg-[var(--border-muted)]",
        "[animation:skeleton-pulse_1.4s_ease-in-out_infinite]",
        className,
      )}
    />
  );
}

export function SkeletonCard() {
  return (
    <div
      className="rounded-[18px] border-[2.5px] border-border bg-bg-1 p-5 space-y-3"
      style={{ boxShadow: "6px 6px 0 0 var(--border)" }}
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}
