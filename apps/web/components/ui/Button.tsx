"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "glass" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "ref"> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

// Neo-brutalist buttons: solid opaque fill, thick black border, hard black
// offset shadow. Pressing a button walks it into its own shadow (translate
// + shadow shrink) rather than just scaling down — the classic brutalist
// "push the button in" feel. No colored glow on any variant.
const variantClass: Record<Variant, string> = {
  primary: "font-bold text-yellow-ink border-[2.5px] border-border bg-yellow",
  glass: "font-bold text-ink-0 border-[2.5px] border-border bg-bg-1",
  ghost: "font-semibold text-ink-1 hover:text-ink-0 border-[2.5px] border-transparent",
  danger: "font-bold text-ink-0 border-[2.5px] border-border bg-danger",
};

const sizeClass: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm rounded-[12px] gap-1.5",
  md: "h-12 px-5 text-[15px] rounded-[16px] gap-2",
  lg: "h-14 px-7 text-base rounded-[18px] gap-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = "primary", size = "md", loading, fullWidth, disabled, className, style, children, ...rest },
    ref,
  ) => {
    const flat = variant === "ghost";
    return (
      <motion.button
        ref={ref}
        whileTap={flat ? undefined : { x: 4, y: 4, boxShadow: "0 0 0 0 var(--border)" }}
        transition={{ type: "spring", stiffness: 600, damping: 34 }}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center select-none",
          "disabled:opacity-40 disabled:cursor-not-allowed",
          variantClass[variant],
          sizeClass[size],
          fullWidth && "w-full",
          className,
        )}
        style={{
          boxShadow: flat ? "none" : "5px 5px 0 0 var(--border)",
          ...style,
        }}
        {...rest}
      >
        {loading ? (
          <motion.span
            className="h-4 w-4 rounded-full border-2 border-current border-t-transparent"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 0.7, ease: "linear" }}
          />
        ) : (
          children
        )}
      </motion.button>
    );
  },
);
Button.displayName = "Button";
