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

// Every non-ghost variant is the same glass material — translucent fill +
// backdrop blur + a hairline top highlight — just tinted differently. No
// colored box-shadow glow on any of them; only a plain neutral-black shadow
// for lift, same as GlassSurface.
const glassShadow = "shadow-[0_10px_24px_-10px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.14)]";

const variantClass: Record<Variant, string> = {
  primary: cn(
    "font-semibold text-accent-teal border border-accent-teal/35 bg-accent-teal/[0.14] backdrop-blur-xl",
    "hover:bg-accent-teal/[0.2]",
    glassShadow,
  ),
  glass: cn(
    "text-ink-0 border border-white/[0.14] bg-white/[0.07] backdrop-blur-xl",
    "hover:bg-white/[0.11]",
    glassShadow,
  ),
  ghost: "text-ink-1 hover:text-ink-0 hover:bg-white/[0.06]",
  danger: cn(
    "font-semibold text-danger border border-danger/35 bg-danger/[0.14] backdrop-blur-xl",
    "hover:bg-danger/[0.2]",
    glassShadow,
  ),
};

const sizeClass: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm rounded-full gap-1.5",
  md: "h-11 px-5 text-[15px] rounded-full gap-2",
  lg: "h-14 px-7 text-base rounded-full gap-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = "primary", size = "md", loading, fullWidth, disabled, className, children, ...rest },
    ref,
  ) => {
    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.96 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center font-medium select-none",
          "disabled:opacity-40 disabled:cursor-not-allowed transition-[background-color,box-shadow] duration-150",
          variantClass[variant],
          sizeClass[size],
          fullWidth && "w-full",
          className,
        )}
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
