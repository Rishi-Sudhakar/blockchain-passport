"use client";

import { motion } from "framer-motion";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-col justify-center px-6 py-14">
      <motion.div
        className="mx-auto w-full max-w-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="mb-8 space-y-2">
          <h1 className="text-[28px] font-semibold tracking-tight text-ink-0">{title}</h1>
          {subtitle && <p className="text-[15px] text-ink-2">{subtitle}</p>}
        </div>
        {children}
      </motion.div>
    </main>
  );
}
