"use client";

import { cn } from "@/lib/utils";
import type { CertificationStatus, PassportStatus } from "@/lib/api/types";

type AnyStatus = PassportStatus | CertificationStatus;

// Text is always solid black regardless of fill — these are opaque chips,
// not tinted-on-dark badges, so a colored-text-on-color approach would wash
// out.
const config: Record<AnyStatus, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-bg-1" },
  submitted: { label: "Awaiting review", className: "bg-warning" },
  pending: { label: "Pending", className: "bg-warning" },
  certified: { label: "Certified", className: "bg-success" },
  approved: { label: "Approved", className: "bg-success" },
  published: { label: "Published", className: "bg-accent-teal" },
  amended: { label: "Amended", className: "bg-accent-violet" },
  rejected: { label: "Rejected", className: "bg-danger" },
  end_of_life: { label: "End of life", className: "bg-bg-2" },
};

export function StatusBadge({ status, className }: { status: AnyStatus; className?: string }) {
  const c = config[status] ?? { label: status, className: "bg-bg-1" };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border-[2px] border-border px-2.5 py-1 text-xs font-bold text-ink-0 tracking-wide",
        c.className,
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-ink-0" />
      {c.label}
    </span>
  );
}
