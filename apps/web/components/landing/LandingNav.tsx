"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { BrandMark } from "./BrandMark";

export function LandingNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-bg-0/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2.5">
          <BrandMark size={30} />
          <span className="text-[15px] font-semibold text-ink-0">Passport</span>
        </Link>
        <nav className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/verify"
            className="hidden px-3 py-2 text-[14px] font-medium text-ink-2 hover:text-ink-0 sm:inline-block"
          >
            Verify a passport
          </Link>
          <Link href="/auth/login">
            <Button size="sm" variant="glass">
              Log in
            </Button>
          </Link>
          <Link href="/auth/register" className="hidden sm:block">
            <Button size="sm">Get started</Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}
