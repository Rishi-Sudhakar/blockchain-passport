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
    <header className="sticky top-0 z-30 flex items-center justify-between px-5 pt-[max(env(safe-area-inset-top),20px)] pb-4 backdrop-blur-xl bg-bg-0/70">
      <h1 className="text-xl font-semibold tracking-tight text-ink-0">{title}</h1>
      <Link
        href="/profile"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-teal text-xs font-semibold text-accent-teal-ink shadow-[inset_0_1px_0_0_rgba(255,255,255,0.5)]"
      >
        {user ? initials(user.displayName) : ""}
      </Link>
    </header>
  );
}
