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
  sm: "rounded-[14px]",
  md: "rounded-[20px]",
  lg: "rounded-[28px]",
  xl: "rounded-[32px]",
};

const toneClass: Record<GlassTone, string> = {
  default: "bg-white/[0.045] border-white/[0.1]",
  strong: "bg-white/[0.08] border-white/[0.18]",
  subtle: "bg-white/[0.025] border-white/[0.07]",
};

/**
 * The app's single "liquid glass" material: a translucent solid fill, a
 * hairline solid border, heavy backdrop blur, and a soft inset top highlight
 * that reads as a specular edge — the same recipe real frosted-glass UI uses,
 * with no gradient anywhere. Depth and color come from what's blurred behind
 * the surface (see AmbientBackground), not from anything painted on it.
 * Every card/sheet/nav composes this rather than re-implementing blur CSS.
 */
export const GlassSurface = forwardRef<HTMLDivElement, GlassSurfaceProps>(
  ({ tone = "default", radius = "lg", interactive = false, className, style, whileTap, children, ...rest }, ref) => {
    return (
      <motion.div
        ref={ref}
        whileTap={interactive ? whileTap ?? { scale: 0.985 } : whileTap}
        transition={{ type: "spring", stiffness: 500, damping: 32 }}
        className={cn(
          "relative border backdrop-blur-2xl",
          radiusClass[radius],
          toneClass[tone],
          interactive && "cursor-pointer transition-[background-color,box-shadow] duration-200 hover:bg-white/[0.07]",
          className,
        )}
        style={{
          boxShadow:
            "0 24px 60px -20px rgba(0,0,0,0.6), inset 0 1px 0 0 rgba(255,255,255,0.09)",
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
