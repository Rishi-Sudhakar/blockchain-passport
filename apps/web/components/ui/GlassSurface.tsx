"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type GlassTone = "default" | "strong" | "subtle";

interface GlassSurfaceProps extends HTMLMotionProps<"div"> {
  tone?: GlassTone;
  radius?: "sm" | "md" | "lg" | "xl";
  interactive?: boolean;
}

const radiusClass: Record<NonNullable<GlassSurfaceProps["radius"]>, string> = {
  sm: "rounded-[10px]",
  md: "rounded-[14px]",
  lg: "rounded-[18px]",
  xl: "rounded-[22px]",
};

const toneClass: Record<GlassTone, string> = {
  default: "bg-bg-1 border-border",
  strong: "bg-bg-1 border-border",
  subtle: "bg-bg-2 border-border",
};

/**
 * The app's single card material: a solid opaque fill, a thick solid black
 * border, and a hard offset shadow — no blur, no translucency, no gradient.
 * Every card/sheet/nav composes this rather than re-implementing the look.
 */
export const GlassSurface = forwardRef<HTMLDivElement, GlassSurfaceProps>(
  ({ tone = "default", radius = "lg", interactive = false, className, style, whileTap, children, ...rest }, ref) => {
    return (
      <motion.div
        ref={ref}
        whileTap={interactive ? whileTap ?? { x: 3, y: 3 } : whileTap}
        transition={{ type: "spring", stiffness: 500, damping: 32 }}
        className={cn(
          "relative border-[2.5px]",
          radiusClass[radius],
          toneClass[tone],
          interactive && "cursor-pointer",
          className,
        )}
        style={{
          boxShadow: "6px 6px 0 0 var(--border)",
          ...style,
        }}
        {...rest}
      >
        {children}
      </motion.div>
    );
  },
);
GlassSurface.displayName = "GlassSurface";
