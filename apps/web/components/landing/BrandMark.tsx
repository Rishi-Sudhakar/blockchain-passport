export function BrandMark({ size = 24 }: { size?: number }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-[9px] border-[2px] border-border bg-accent-teal"
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 24 24" fill="none" style={{ width: size * 0.58, height: size * 0.58 }} className="text-accent-teal-ink">
        <path
          d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3Z"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinejoin="round"
        />
        <path d="m9.2 12 1.9 1.9L15 10" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
