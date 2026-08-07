"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { AuthShell } from "@/components/shell/AuthShell";
import { ApiError } from "@/lib/api/client";
import { defaultDeviceLabel, setupSigningKeyForThisDevice } from "@/lib/auth/device-setup";
import { useSession } from "@/lib/auth/session";

export default function DeviceSetupPage() {
  const router = useRouter();
  const { user, isLoading } = useSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !user) router.replace("/auth/login");
  }, [isLoading, user, router]);

  const onSetup = async () => {
    setBusy(true);
    setError(null);
    try {
      await setupSigningKeyForThisDevice(defaultDeviceLabel());
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't set up this device. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Set up this device"
      subtitle="This device needs its own signing key to notarize passport changes you make here."
    >
      <div className="space-y-4">
        {error && <p className="text-[13px] text-danger">{error}</p>}
        <Button size="lg" fullWidth loading={busy} onClick={onSetup}>
          Set up signing key
        </Button>
        <p className="text-center text-[12px] text-ink-3">
          The key is generated on this device and never leaves it.
        </p>
      </div>
    </AuthShell>
  );
}
