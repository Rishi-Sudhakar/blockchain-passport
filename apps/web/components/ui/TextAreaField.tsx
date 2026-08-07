"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface TextAreaFieldProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
}

export const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(
  ({ label, error, className, id, ...rest }, ref) => {
    const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="space-y-1.5">
        <label htmlFor={inputId} className="text-[13px] font-medium text-ink-2">
          {label}
        </label>
        <textarea
          ref={ref}
          id={inputId}
          rows={3}
          className={cn(
            "w-full resize-none rounded-[16px] border border-white/[0.1] bg-white/[0.04] px-4 py-3 text-[15px] text-ink-0",
            "placeholder:text-ink-3 outline-none transition-colors duration-150",
            "focus:border-accent-teal/60 focus:bg-white/[0.06]",
            error && "border-danger/60",
            className,
          )}
          {...rest}
        />
        {error && <p className="text-[12px] text-danger">{error}</p>}
      </div>
    );
  },
);
TextAreaField.displayName = "TextAreaField";
