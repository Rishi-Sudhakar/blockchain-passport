"use client";

import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";

export function QrCodeCard({ publicCode }: { publicCode: string }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? `${window.location.origin}/verify/${publicCode}` : `/verify/${publicCode}`;

  const onCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <GlassCard className="flex flex-col items-center gap-4 text-center">
      <div className="rounded-[16px] border-[2.5px] border-border bg-white p-3">
        <QRCodeSVG value={url} size={148} bgColor="#ffffff" fgColor="#16171b" />
      </div>
      <div>
        <p className="font-mono text-[13px] font-bold text-ink-1">{publicCode}</p>
        <p className="mt-1 text-[12px] font-semibold text-ink-3">Scan to verify this passport publicly</p>
      </div>
      <Button size="sm" variant="glass" onClick={onCopy}>
        {copied ? "Link copied" : "Copy verify link"}
      </Button>
    </GlassCard>
  );
}
