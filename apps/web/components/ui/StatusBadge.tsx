"use client";

import { cn } from "@/lib/utils";
import type { CertificationStatus, PassportStatus } from "@/lib/api/types";

type AnyStatus = PassportStatus | CertificationStatus;

const config: Record<AnyStatus, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-white/[0.08] text-ink-1" },
  submitted: { label: "Awaiting review", className: "bg-warning/15 text-warning" },
  pending: { label: "Pending", className: "bg-warning/15 text-warning" },
  certified: { label: "Certified", className: "bg-success/15 text-success" },
  approved: { label: "Approved", className: "bg-success/15 text-success" },
  published: { label: "Published", className: "bg-accent-teal/15 text-accent-teal" },
  amended: { label: "Amended", className: "bg-accent-violet/15 text-accent-violet" },
  rejected: { label: "Rejected", className: "bg-danger/15 text-danger" },
  end_of_life: { label: "End of life", className: "bg-white/[0.06] text-ink-2" },
};

export function StatusBadge({ status, className }: { status: AnyStatus; className?: string }) {
  const c = config[status] ?? { label: status, className: "bg-white/[0.08] text-ink-1" };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium tracking-wide",
        c.className,
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {c.label}
    </span>
  );
}
