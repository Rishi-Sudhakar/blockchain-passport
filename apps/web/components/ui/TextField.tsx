"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ label, error, className, id, ...rest }, ref) => {
    const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="space-y-1.5">
        <label htmlFor={inputId} className="text-[13px] font-bold text-ink-2">
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "h-12 w-full rounded-[14px] border-[2.5px] border-border bg-bg-1 px-4 text-[15px] font-medium text-ink-0",
            "placeholder:text-ink-3 outline-none transition-transform duration-150",
            "focus:-translate-y-0.5",
            error && "border-danger",
            className,
          )}
          style={{ boxShadow: "3px 3px 0 0 var(--border)" }}
          {...rest}
        />
        {error && <p className="text-[12px] font-semibold text-danger">{error}</p>}
      </div>
    );
  },
);
TextField.displayName = "TextField";
