"use client";

import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatusBadge } from "@/components/ui/StatusBadge";

const rows = [
  { label: "Chemistry", value: "NMC" },
  { label: "Carbon footprint", value: "42.5 kg CO₂e" },
  { label: "Recycled cobalt", value: "22%" },
  { label: "Rated capacity", value: "75 Ah" },
];

const chainSteps = ["Issued", "Certified", "Published"];

export function PassportMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, rotate: 3 }}
      animate={{ opacity: 1, y: 0, rotate: -2 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ rotate: 0, y: -4 }}
      className="w-full max-w-[300px]"
    >
      <GlassCard tone="strong" className="space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[15px] font-semibold text-ink-0">Cell Module 4680</p>
            <p className="mt-0.5 font-mono text-[11px] text-ink-2">BP-8F3KQ-2NWXR</p>
          </div>
          <StatusBadge status="published" />
        </div>

        <div className="space-y-2">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between border-b border-white/[0.06] py-1.5 last:border-0">
              <span className="text-[12px] text-ink-2">{row.label}</span>
              <span className="text-[12px] font-medium text-ink-0">{row.value}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {chainSteps.map((step, i) => (
            <div key={step} className="flex flex-1 items-center gap-2">
              <span className="h-2 w-2 shrink-0 rounded-full bg-accent-teal" />
              <span className="text-[10px] font-medium text-ink-3">{step}</span>
              {i < chainSteps.length - 1 && <span className="h-px flex-1 bg-white/[0.12]" />}
            </div>
          ))}
        </div>
      </GlassCard>
    </motion.div>
  );
}
