"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PassportDataSections } from "@/components/passport/PassportDataSections";
import { ApiError } from "@/lib/api/client";
import { usePublicPassport } from "@/lib/api/hooks";
import { formatDate } from "@/lib/utils";
import type { BatteryData } from "@/lib/api/types";

export function VerifyResultClient({ code }: { code: string }) {
  const { data, isLoading, error } = usePublicPassport(code);

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-accent-teal" />
      </main>
    );
  }

  if (error || !data) {
    const notFound = error instanceof ApiError && error.status === 404;
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-[18px] font-semibold text-ink-0">
          {notFound ? "No passport found for this code." : "Something went wrong."}
        </p>
        <Link href="/verify">
          <Button variant="glass">Try another code</Button>
        </Link>
      </main>
    );
  }

  const { passport, versions, chainVerify } = data;
  const currentData = versions.at(-1)?.data as BatteryData | undefined;

  return (
    <main className="min-h-screen px-5 py-10">
      <motion.div
        className="mx-auto max-w-md space-y-6"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div
          className={`flex items-center gap-3 rounded-[20px] border p-4 ${
            chainVerify.valid ? "border-success/30 bg-success/10" : "border-danger/30 bg-danger/10"
          }`}
        >
          <span className={`text-2xl ${chainVerify.valid ? "text-success" : "text-danger"}`}>
            {chainVerify.valid ? "✓" : "!"}
          </span>
          <div>
            <p className={`text-[15px] font-semibold ${chainVerify.valid ? "text-success" : "text-danger"}`}>
              {chainVerify.valid ? "Verified authentic" : "Integrity check failed"}
            </p>
            <p className="text-[12px] text-ink-2">
              {chainVerify.valid
                ? `${chainVerify.length} ledger record${chainVerify.length === 1 ? "" : "s"}, no tampering detected.`
                : chainVerify.reason}
            </p>
          </div>
        </div>

        <GlassCard className="flex items-start justify-between">
          <div>
            <h1 className="text-[19px] font-semibold text-ink-0">
              {currentData?.productIdentifier.batteryModel || "Digital product passport"}
            </h1>
            <p className="mt-0.5 font-mono text-[13px] text-ink-2">{passport.publicCode}</p>
            <p className="mt-1 text-[12px] text-ink-3">Issued {formatDate(passport.createdAt)}</p>
          </div>
          <StatusBadge status={passport.status} />
        </GlassCard>

        {currentData && <PassportDataSections data={currentData} />}

        <Link href="/verify" className="block pb-6 text-center text-[13px] text-ink-3 hover:text-ink-1">
          Verify another passport →
        </Link>
      </motion.div>
    </main>
  );
}
