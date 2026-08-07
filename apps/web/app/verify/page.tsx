"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { QrScanner } from "@/components/passport/QrScanner";

function codeFromScan(text: string): string {
  try {
    const url = new URL(text);
    const parts = url.pathname.split("/").filter(Boolean);
    return parts.at(-1) ?? text;
  } catch {
    return text;
  }
}

export default function VerifyLandingPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [scanning, setScanning] = useState(false);

  const goToCode = (raw: string) => {
    const clean = codeFromScan(raw.trim());
    if (clean) router.push(`/verify/${encodeURIComponent(clean)}`);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <motion.div
        className="w-full max-w-sm space-y-6"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="space-y-2 text-center">
          <h1 className="text-[26px] font-black tracking-tight text-ink-0">Verify a passport</h1>
          <p className="text-[14px] font-semibold text-ink-2">Scan a QR code or enter a passport code.</p>
        </div>

        <Button size="lg" fullWidth onClick={() => setScanning(true)}>
          Scan QR code
        </Button>

        <div className="flex items-center gap-3">
          <div className="h-[2px] flex-1 bg-[var(--border-muted)]" />
          <span className="text-[12px] font-bold text-ink-3">or</span>
          <div className="h-[2px] flex-1 bg-[var(--border-muted)]" />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            goToCode(code);
          }}
          className="space-y-3"
        >
          <TextField
            label="Passport code"
            placeholder="BP-XXXXX-XXXXX"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <Button type="submit" size="lg" variant="glass" fullWidth disabled={!code.trim()}>
            Look up
          </Button>
        </form>

        <Link href="/" className="block text-center text-[13px] text-ink-3 hover:text-ink-1">
          ← Back
        </Link>
      </motion.div>

      <AnimatePresence>
        {scanning && (
          <QrScanner
            onResult={(text) => {
              setScanning(false);
              goToCode(text);
            }}
            onClose={() => setScanning(false)}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
