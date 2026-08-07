"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: { value: string; label: string }[];
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ label, options, className, id, ...rest }, ref) => {
    const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="space-y-1.5">
        <label htmlFor={inputId} className="text-[13px] font-medium text-ink-2">
          {label}
        </label>
        <select
          ref={ref}
          id={inputId}
          className={cn(
            "h-12 w-full rounded-[16px] border border-white/[0.1] bg-white/[0.04] px-4 text-[15px] text-ink-0",
            "outline-none transition-colors duration-150 focus:border-accent-teal/60 focus:bg-white/[0.06]",
            className,
          )}
          {...rest}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value} className="bg-bg-1 text-ink-0">
              {o.label}
            </option>
          ))}
        </select>
      </div>
    );
  },
);
SelectField.displayName = "SelectField";
