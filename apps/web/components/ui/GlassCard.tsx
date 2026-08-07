"use client";

import type { HTMLMotionProps } from "framer-motion";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { GlassSurface } from "./GlassSurface";

interface GlassCardProps extends HTMLMotionProps<"div"> {
  padded?: boolean;
  interactive?: boolean;
  tone?: "default" | "strong" | "subtle";
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ padded = true, interactive, tone, className, ...rest }, ref) => {
    return (
      <GlassSurface
        ref={ref}
        radius="lg"
        interactive={interactive}
        tone={tone}
        className={cn(padded && "p-5", className)}
        {...rest}
      />
    );
  },
);
GlassCard.displayName = "GlassCard";
