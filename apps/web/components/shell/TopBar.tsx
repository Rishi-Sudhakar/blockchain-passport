"use client";

import Link from "next/link";
import { useSession } from "@/lib/auth/session";

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function TopBar({ title }: { title: string }) {
  const { user } = useSession();
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-5 pt-[max(env(safe-area-inset-top),20px)] pb-4 bg-bg-0">
      <h1 className="text-xl font-extrabold tracking-tight text-ink-0">{title}</h1>
      <Link
        href="/profile"
        className="flex h-9 w-9 items-center justify-center rounded-full border-[2px] border-border bg-accent-teal text-xs font-bold text-accent-teal-ink"
      >
        {user ? initials(user.displayName) : ""}
      </Link>
    </header>
  );
}
