"use client";

import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-[14px] bg-white/[0.06]",
        "[animation:skeleton-pulse_1.4s_ease-in-out_infinite]",
        className,
      )}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-[28px] border border-white/[0.09] bg-white/[0.03] p-5 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}
