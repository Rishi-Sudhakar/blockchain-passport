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
        <label htmlFor={inputId} className="text-[13px] font-bold text-ink-2">
          {label}
        </label>
        <textarea
          ref={ref}
          id={inputId}
          rows={3}
          className={cn(
            "w-full resize-none rounded-[14px] border-[2.5px] border-border bg-bg-1 px-4 py-3 text-[15px] font-medium text-ink-0",
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
TextAreaField.displayName = "TextAreaField";
