"use client";

import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { formatDateTime, truncateMiddle } from "@/lib/utils";
import type { LedgerRecord, VerifyResult } from "@/lib/api/types";

const eventLabels: Record<string, string> = {
  submit: "Submitted for certification",
  certify_approve: "Certified",
  certify_reject: "Certification rejected",
  publish: "Published",
  amend: "Amended",
  end_of_life: "Marked end of life",
};

export function ChainOfCustodyTimeline({
  records,
  verify,
}: {
  records: LedgerRecord[];
  verify?: VerifyResult;
}) {
  return (
    <div className="space-y-3">
      {verify && (
        <div
          className={`flex items-center gap-2 rounded-[16px] border px-4 py-3 text-[13px] font-medium ${
            verify.valid
              ? "border-success/30 bg-success/10 text-success"
              : "border-danger/30 bg-danger/10 text-danger"
          }`}
        >
          <span className="text-base">{verify.valid ? "✓" : "!"}</span>
          {verify.valid
            ? `Chain verified — ${verify.length} record${verify.length === 1 ? "" : "s"}, no tampering detected.`
            : `Integrity check failed at record #${verify.brokenAt}: ${verify.reason}`}
        </div>
      )}

      {records.length === 0 && (
        <GlassCard className="text-center text-[13px] text-ink-2">
          No ledger entries yet — this passport is still a private draft.
        </GlassCard>
      )}

      <div className="relative space-y-4 pl-1">
        {records.map((rec, i) => (
          <motion.div
            key={rec.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            className="relative flex gap-3 pl-6"
          >
            <div className="absolute left-0 top-1 flex flex-col items-center">
              <span className="h-2.5 w-2.5 rounded-full bg-accent-teal" />
              {i < records.length - 1 && <span className="mt-1 w-px flex-1 bg-white/[0.12]" style={{ minHeight: 36 }} />}
            </div>
            <div className="flex-1 pb-1">
              <p className="text-[14px] font-medium text-ink-0">
                {eventLabels[rec.eventType] ?? rec.eventType}
              </p>
              <p className="text-[12px] text-ink-3">
                {formatDateTime(rec.signedAt)} · signed by {truncateMiddle(rec.signerAddress, 8)}
              </p>
              <p className="mt-0.5 font-mono text-[11px] text-ink-3">
                #{rec.sequenceNum} · {truncateMiddle(rec.recordHash, 10)}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
