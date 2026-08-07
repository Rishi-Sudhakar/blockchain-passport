"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { TopBar } from "@/components/shell/TopBar";
import { GlassCard } from "@/components/ui/GlassCard";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useCertificationQueue } from "@/lib/api/hooks";
import { formatDate } from "@/lib/utils";

export default function CertificationQueuePage() {
  const { data: items, isLoading } = useCertificationQueue();

  return (
    <div>
      <TopBar title="Certification queue" />
      <div className="space-y-3 px-5">
        {isLoading && (
          <>
            <SkeletonCard />
            <SkeletonCard />
          </>
        )}
        {!isLoading && (items?.length ?? 0) === 0 && (
          <GlassCard className="text-center text-[13px] font-semibold text-ink-2">
            Nothing waiting for review right now.
          </GlassCard>
        )}
        {items?.map((item, i) => (
          <Link key={item.certification.id} href={`/passports/${item.passport.id}`}>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i * 0.04 }}
            >
              <GlassCard interactive className="flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-extrabold text-ink-0">
                    {item.passport.category === "battery" ? "Battery passport" : item.passport.category}
                  </p>
                  <p className="mt-0.5 font-mono text-[12px] font-bold text-ink-2">{item.passport.publicCode}</p>
                  <p className="mt-1 text-[12px] font-semibold text-ink-3">Submitted {formatDate(item.certification.createdAt)}</p>
                </div>
                <StatusBadge status={item.certification.status} />
              </GlassCard>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
}
