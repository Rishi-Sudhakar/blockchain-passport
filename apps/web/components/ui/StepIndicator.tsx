"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface StepIndicatorProps {
  steps: string[];
  current: number;
}

export function StepIndicator({ steps, current }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-2">
      {steps.map((step, i) => {
        const state = i < current ? "done" : i === current ? "active" : "upcoming";
        return (
          <div key={step} className="flex flex-1 flex-col gap-2">
            <div className="h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-accent-teal"
                initial={false}
                animate={{ width: state === "upcoming" ? "0%" : "100%" }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
            <span
              className={cn(
                "text-[11px] font-medium truncate",
                state === "active" ? "text-ink-0" : "text-ink-3",
              )}
            >
              {step}
            </span>
          </div>
        );
      })}
    </div>
  );
}
