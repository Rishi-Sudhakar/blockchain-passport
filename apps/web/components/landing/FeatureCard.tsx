"use client";

import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";

export function FeatureCard({
  index,
  title,
  description,
  icon,
}: {
  index: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
    >
      <GlassCard className="h-full space-y-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-white/[0.06] text-accent-teal">
          {icon}
        </div>
        <div>
          <p className="text-[14px] font-semibold text-ink-0">{title}</p>
          <p className="mt-1 text-[13px] leading-relaxed text-ink-2">{description}</p>
        </div>
      </GlassCard>
    </motion.div>
  );
}
