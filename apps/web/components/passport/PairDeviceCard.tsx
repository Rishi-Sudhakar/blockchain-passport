"use client";

import { AnimatePresence, motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { ApiError } from "@/lib/api/client";
import { authApi } from "@/lib/api/resources";

function secondsLeft(expiresAt: string): number {
  return Math.max(0, Math.round((new Date(expiresAt).getTime() - Date.now()) / 1000));
}

export function PairDeviceCard() {
  const [pairing, setPairing] = useState<{ code: string; expiresAt: string } | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!pairing) return;
    setRemaining(secondsLeft(pairing.expiresAt));
    const id = setInterval(() => {
      const left = secondsLeft(pairing.expiresAt);
      setRemaining(left);
      if (left <= 0) setPairing(null);
    }, 1000);
    return () => clearInterval(id);
  }, [pairing]);

  const onGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authApi.beginDevicePairing();
      setPairing(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't generate a code. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassCard className="space-y-4">
      <div>
        <p className="text-[15px] font-extrabold text-ink-0">Pair the mobile app</p>
        <p className="mt-1 text-[12px] font-semibold text-ink-3">
          Open the Passport app on your phone, choose &ldquo;Pair with a code&rdquo;, and enter the
          code below (or scan it) within 5 minutes.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {pairing ? (
          <motion.div
            key="code"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4 py-2"
          >
            <div className="rounded-[16px] border-[2.5px] border-border bg-white p-3">
              <QRCodeSVG value={pairing.code} size={128} bgColor="#ffffff" fgColor="#16171b" />
            </div>
            <p className="font-mono text-[28px] font-extrabold tracking-[0.3em] text-ink-0">{pairing.code}</p>
            <p className="text-[12px] font-semibold text-ink-3">Expires in {remaining}s</p>
          </motion.div>
        ) : (
          <motion.div key="button" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Button variant="glass" fullWidth loading={loading} onClick={onGenerate}>
              Generate pairing code
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {error && <p className="text-[13px] font-semibold text-danger">{error}</p>}
    </GlassCard>
  );
}
