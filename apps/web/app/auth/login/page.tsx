"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { AuthShell } from "@/components/shell/AuthShell";
import { ApiError } from "@/lib/api/client";
import { authApi } from "@/lib/api/resources";
import { useSession } from "@/lib/auth/session";
import { getPasskeyAssertion, isWebAuthnJSONSupported } from "@/lib/crypto/webauthn";
import { hasAnySigningKey } from "@/lib/crypto/signing";

export default function LoginPage() {
  const router = useRouter();
  const { refetch } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onLogin = async () => {
    setError(null);
    if (!isWebAuthnJSONSupported()) {
      setError("Your browser doesn't support passkeys yet. Try the latest Chrome, Safari, or Edge.");
      return;
    }
    setLoading(true);
    try {
      const { ceremonyId, options } = await authApi.beginLogin();
      const credentialJSON = await getPasskeyAssertion(options.publicKey);
      await authApi.finishLogin(ceremonyId, credentialJSON);
      await refetch();

      const hasKey = await hasAnySigningKey();
      router.replace(hasKey ? "/dashboard" : "/auth/device-setup");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Couldn't sign you in. Make sure you're using the passkey you registered with.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Log in with the passkey on this device.">
      <div className="space-y-4">
        {error && <p className="text-[13px] text-danger">{error}</p>}
        <Button size="lg" fullWidth loading={loading} onClick={onLogin}>
          Log in with passkey
        </Button>
      </div>

      <p className="mt-6 text-center text-[13px] text-ink-2">
        New here?{" "}
        <Link href="/auth/register" className="font-medium text-ink-0">
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}
