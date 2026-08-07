"use client";

import { BrowserQRCodeReader } from "@zxing/browser";
import type { IScannerControls } from "@zxing/browser";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

interface QrScannerProps {
  onResult: (text: string) => void;
  onClose: () => void;
}

export function QrScanner({ onResult, onClose }: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let controls: IScannerControls | undefined;
    const reader = new BrowserQRCodeReader();

    reader
      .decodeFromVideoDevice(undefined, videoRef.current ?? undefined, (result, err) => {
        if (result) onResult(result.getText());
        // A "not found" error fires on every frame with no code in view — ignore it.
        void err;
      })
      .then((c) => {
        controls = c;
      })
      .catch(() => setError("Couldn't access the camera. Check permissions and try again."));

    return () => controls?.stop();
  }, [onResult]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-ink-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="relative h-72 w-72 overflow-hidden rounded-[22px] border-[3px] border-bg-0">
        <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
        <div className="pointer-events-none absolute inset-6 rounded-[16px] border-[3px] border-yellow" />
      </div>
      {error && <p className="mt-4 max-w-xs text-center text-[13px] font-semibold text-danger">{error}</p>}
      <button onClick={onClose} className="mt-6 text-[14px] font-bold text-bg-0">
        Cancel
      </button>
    </motion.div>
  );
}
