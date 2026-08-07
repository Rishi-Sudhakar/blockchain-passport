"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/shell/TopBar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { ChainOfCustodyTimeline } from "@/components/passport/ChainOfCustodyTimeline";
import { PassportActions } from "@/components/passport/PassportActions";
import { PassportDataSections } from "@/components/passport/PassportDataSections";
import { QrCodeCard } from "@/components/passport/QrCodeCard";
import { usePassport, usePassportLedger, usePassportLedgerVerify } from "@/lib/api/hooks";
import { useSession } from "@/lib/auth/session";
import { formatDate } from "@/lib/utils";
import type { BatteryData } from "@/lib/api/types";

export function PassportDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const { user } = useSession();
  const { data, isLoading } = usePassport(id);
  const { data: ledger } = usePassportLedger(id);
  const { data: verify } = usePassportLedgerVerify(id);

  if (isLoading || !data) {
    return (
      <div className="px-5 pt-20">
        <SkeletonCard />
      </div>
    );
  }

  const { passport, versions } = data;
  const currentData = versions.at(-1)?.data as BatteryData | undefined;

  return (
    <div>
      <TopBar title="Passport" />
      <div className="space-y-6 px-5">
        <motion.div layoutId={`passport-${passport.id}`} className="flex items-start justify-between">
          <div>
            <h2 className="text-[20px] font-semibold text-ink-0">
              {currentData?.productIdentifier.batteryModel || "Untitled battery"}
            </h2>
            <p className="mt-0.5 font-mono text-[13px] text-ink-2">{passport.publicCode}</p>
            <p className="mt-1 text-[12px] text-ink-3">Created {formatDate(passport.createdAt)}</p>
          </div>
          <StatusBadge status={passport.status} className="mt-1" />
        </motion.div>

        {user && <PassportActions passport={passport} versions={versions} user={user} />}

        <QrCodeCard publicCode={passport.publicCode} />

        {currentData && (
          <div>
            <h3 className="mb-3 text-[15px] font-semibold text-ink-0">Compliance data</h3>
            <PassportDataSections data={currentData} />
          </div>
        )}

        <div>
          <h3 className="mb-3 text-[15px] font-semibold text-ink-0">Chain of custody</h3>
          <ChainOfCustodyTimeline records={ledger ?? []} verify={verify} />
        </div>

        <button
          onClick={() => router.push("/passports")}
          className="mb-6 w-full text-center text-[13px] text-ink-3 hover:text-ink-1"
        >
          ← Back to passports
        </button>
      </div>
    </div>
  );
}
