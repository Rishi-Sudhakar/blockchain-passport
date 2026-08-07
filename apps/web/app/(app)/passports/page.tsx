"use client";

import Link from "next/link";
import { TopBar } from "@/components/shell/TopBar";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { PassportListCard } from "@/components/passport/PassportListCard";
import { usePassports } from "@/lib/api/hooks";
import { useSession } from "@/lib/auth/session";

export default function PassportsPage() {
  const { user } = useSession();
  const { data: passports, isLoading } = usePassports();
  const canCreate = user?.role === "manufacturer" || user?.role === "admin";

  return (
    <div>
      <TopBar title="Passports" />
      <div className="space-y-3 px-5">
        {canCreate && (
          <Link href="/passports/new">
            <Button size="md" fullWidth variant="glass" className="mb-3">
              + New passport
            </Button>
          </Link>
        )}
        {isLoading && (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        )}
        {!isLoading && (passports?.length ?? 0) === 0 && (
          <GlassCard className="text-center text-[13px] font-semibold text-ink-2">No passports yet.</GlassCard>
        )}
        {passports?.map((p, i) => <PassportListCard key={p.id} passport={p} index={i} />)}
      </div>
    </div>
  );
}
