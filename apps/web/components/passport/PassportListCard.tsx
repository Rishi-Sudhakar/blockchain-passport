"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/utils";
import type { Passport } from "@/lib/api/types";

export function PassportListCard({ passport, index = 0 }: { passport: Passport; index?: number }) {
  return (
    <Link href={`/passports/${passport.id}`}>
      <motion.div
        layoutId={`passport-${passport.id}`}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
      >
        <GlassCard interactive className="flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold text-ink-0">
              {passport.category === "battery" ? "Battery passport" : passport.category}
            </p>
            <p className="mt-0.5 font-mono text-[12px] text-ink-2">{passport.publicCode}</p>
            <p className="mt-1 text-[12px] text-ink-3">Updated {formatDate(passport.updatedAt)}</p>
          </div>
          <StatusBadge status={passport.status} />
        </GlassCard>
      </motion.div>
    </Link>
  );
}
