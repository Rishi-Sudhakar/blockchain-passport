"use client";

import Link from "next/link";
import { TopBar } from "@/components/shell/TopBar";
import { Button } from "@/components/ui/Button";
import { ComplianceRing } from "@/components/ui/ComplianceRing";
import { GlassCard } from "@/components/ui/GlassCard";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { PassportListCard } from "@/components/passport/PassportListCard";
import { usePassports, useCertificationQueue } from "@/lib/api/hooks";
import { useSession } from "@/lib/auth/session";

export default function DashboardPage() {
  const { user } = useSession();
  const { data: passports, isLoading } = usePassports();
  const isCertifier = user?.role === "certifier" || user?.role === "admin";
  const { data: queue } = useCertificationQueue();

  const published = passports?.filter((p) => p.status === "published" || p.status === "amended").length ?? 0;
  const total = passports?.length ?? 0;
  const progress = total > 0 ? published / total : 0;

  return (
    <div>
      <TopBar title={`Hi, ${user?.displayName.split(" ")[0] ?? ""}`} />
      <div className="space-y-8 px-5">
        {!isCertifier && (
          <GlassCard className="flex items-center gap-5">
            <ComplianceRing progress={progress} size={92} strokeWidth={8} label={`${published}/${total}`} sublabel="published" />
            <div className="flex-1 space-y-3">
              <p className="text-[14px] font-semibold leading-snug text-ink-1">
                {total === 0
                  ? "Issue your first digital product passport to get started."
                  : `${published} of ${total} passports are live and verifiable.`}
              </p>
              <Link href="/passports/new">
                <Button size="sm">New passport</Button>
              </Link>
            </div>
          </GlassCard>
        )}

        {isCertifier && (
          <Link href="/certification/queue">
            <GlassCard interactive className="flex items-center justify-between">
              <div>
                <p className="text-[15px] font-extrabold text-ink-0">Certification queue</p>
                <p className="text-[13px] font-semibold text-ink-2">Passports awaiting your review</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full border-[2px] border-border bg-warning text-[15px] font-extrabold text-ink-0">
                {queue?.length ?? 0}
              </div>
            </GlassCard>
          </Link>
        )}

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[15px] font-extrabold text-ink-0">Recent passports</h2>
            <Link
              href="/passports"
              className="rounded-full border-[2px] border-border bg-bg-1 px-3 py-1 text-[12px] font-bold text-ink-0"
            >
              See all
            </Link>
          </div>
          <div className="space-y-3">
            {isLoading && (
              <>
                <SkeletonCard />
                <SkeletonCard />
              </>
            )}
            {!isLoading && (passports?.length ?? 0) === 0 && (
              <GlassCard className="text-center text-[13px] font-semibold text-ink-2">
                No passports yet.
              </GlassCard>
            )}
            {passports?.slice(0, 4).map((p, i) => <PassportListCard key={p.id} passport={p} index={i} />)}
          </div>
        </div>
      </div>
    </div>
  );
}
