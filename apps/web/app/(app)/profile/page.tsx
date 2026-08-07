"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { TopBar } from "@/components/shell/TopBar";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PairDeviceCard } from "@/components/passport/PairDeviceCard";
import { authApi, identityApi } from "@/lib/api/resources";
import { useSigningKeys } from "@/lib/api/hooks";
import { defaultDeviceLabel, setupSigningKeyForThisDevice } from "@/lib/auth/device-setup";
import { useSession } from "@/lib/auth/session";
import { listLocalSigningAddresses } from "@/lib/crypto/signing";
import { formatDate, truncateMiddle } from "@/lib/utils";

const roleLabel: Record<string, string> = {
  manufacturer: "Manufacturer",
  certifier: "Certifier",
  admin: "Admin",
  consumer: "Consumer",
};

export default function ProfilePage() {
  const { user, clear } = useSession();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { data: keys, isLoading, refetch } = useSigningKeys();
  const [localAddresses, setLocalAddresses] = useState<string[]>([]);
  const [settingUp, setSettingUp] = useState(false);

  useEffect(() => {
    listLocalSigningAddresses().then(setLocalAddresses);
  }, [keys]);

  if (!user) return null;

  const hasLocalKey = keys?.some((k) => localAddresses.includes(k.address) && !k.revokedAt) ?? false;

  const onAddDevice = async () => {
    setSettingUp(true);
    try {
      await setupSigningKeyForThisDevice(defaultDeviceLabel());
      await refetch();
    } finally {
      setSettingUp(false);
    }
  };

  const onRevoke = async (id: string) => {
    await identityApi.revokeSigningKey(id);
    await refetch();
  };

  const onLogout = async () => {
    await authApi.logout();
    clear();
    queryClient.clear();
    router.replace("/");
  };

  return (
    <div>
      <TopBar title="Profile" />
      <div className="space-y-8 px-5">
        <GlassCard className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border-[2.5px] border-border bg-accent-teal text-lg font-extrabold text-accent-teal-ink">
            {user.displayName.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <p className="text-[16px] font-extrabold text-ink-0">{user.displayName}</p>
            <p className="text-[13px] font-semibold text-ink-2">{user.email}</p>
            <span className="mt-1 inline-block rounded-full border-[2px] border-border bg-bg-2 px-2 py-0.5 text-[11px] font-bold text-ink-0">
              {roleLabel[user.role] ?? user.role}
            </span>
          </div>
        </GlassCard>

        <PairDeviceCard />

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[15px] font-extrabold text-ink-0">Signing keys</h3>
            {!hasLocalKey && (
              <Button size="sm" variant="glass" loading={settingUp} onClick={onAddDevice}>
                Add this device
              </Button>
            )}
          </div>
          <p className="mb-3 text-[12px] font-semibold text-ink-3">
            Each device you sign in from gets its own key that notarizes the passport actions you take there.
            Keys never leave the device they were created on.
          </p>
          <div className="space-y-2">
            {isLoading && <GlassCard className="text-[13px] font-semibold text-ink-2">Loading...</GlassCard>}
            {keys?.map((key) => {
              const isThisDevice = localAddresses.includes(key.address);
              return (
                <GlassCard key={key.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-[14px] font-bold text-ink-0">
                      {key.deviceLabel} {isThisDevice && <span className="text-ink-3">(this device)</span>}
                    </p>
                    <p className="font-mono text-[11px] font-semibold text-ink-3">{truncateMiddle(key.address, 10)}</p>
                    <p className="text-[11px] font-semibold text-ink-3">Added {formatDate(key.createdAt)}</p>
                  </div>
                  {key.revokedAt ? (
                    <StatusBadge status="end_of_life" />
                  ) : (
                    <button
                      onClick={() => onRevoke(key.id)}
                      className="text-[12px] font-bold text-danger hover:underline"
                    >
                      Revoke
                    </button>
                  )}
                </GlassCard>
              );
            })}
          </div>
        </div>

        <Button variant="glass" fullWidth onClick={onLogout} className="mb-8">
          Log out
        </Button>
      </div>
    </div>
  );
}
