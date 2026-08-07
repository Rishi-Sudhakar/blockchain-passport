"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface Tab {
  href: string;
  label: string;
  icon: (active: boolean) => React.ReactNode;
}

function IconHome({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 11.5 12 4l8 7.5M6 10v9a1 1 0 0 0 1 1h3v-5a2 2 0 0 1 2-2v0a2 2 0 0 1 2 2v5h3a1 1 0 0 0 1-1v-9"
        stroke="currentColor"
        strokeWidth={active ? 2.1 : 1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconPassports({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="4.5" y="3.5" width="15" height="17" rx="2.5" stroke="currentColor" strokeWidth={active ? 2.1 : 1.7} />
      <circle cx="12" cy="10" r="2.4" stroke="currentColor" strokeWidth={active ? 2.1 : 1.7} />
      <path d="M8 17c.5-1.8 2-2.6 4-2.6s3.5.8 4 2.6" stroke="currentColor" strokeWidth={active ? 2.1 : 1.7} strokeLinecap="round" />
    </svg>
  );
}

function IconCertify({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="m9 12 2 2 4.5-5"
        stroke="currentColor"
        strokeWidth={active ? 2.1 : 1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth={active ? 2.1 : 1.7} />
    </svg>
  );
}

function IconProfile({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8.2" r="3.4" stroke="currentColor" strokeWidth={active ? 2.1 : 1.7} />
      <path d="M5 19c1-3.4 3.8-5 7-5s6 1.6 7 5" stroke="currentColor" strokeWidth={active ? 2.1 : 1.7} strokeLinecap="round" />
    </svg>
  );
}

const BASE_TABS: Tab[] = [
  { href: "/dashboard", label: "Home", icon: (a) => <IconHome active={a} /> },
  { href: "/passports", label: "Passports", icon: (a) => <IconPassports active={a} /> },
];

const CERTIFIER_TAB: Tab = {
  href: "/certification/queue",
  label: "Review",
  icon: (a) => <IconCertify active={a} />,
};

const PROFILE_TAB: Tab = { href: "/profile", label: "Profile", icon: (a) => <IconProfile active={a} /> };

export function BottomTabNav({ showCertifierTab }: { showCertifierTab: boolean }) {
  const pathname = usePathname();
  const tabs = [...BASE_TABS, ...(showCertifierTab ? [CERTIFIER_TAB] : []), PROFILE_TAB];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(env(safe-area-inset-bottom),16px)] pt-2">
      <div
        className="mx-auto flex max-w-md items-stretch justify-between rounded-[22px] border-[2.5px] border-border bg-bg-1 px-1.5 py-1.5"
        style={{ boxShadow: "6px 6px 0 0 var(--border)" }}
      >
        {tabs.map((tab) => {
          const active = pathname === tab.href || pathname.startsWith(tab.href + "/");
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="relative flex flex-1 flex-col items-center gap-1 rounded-[16px] py-2 text-ink-0"
            >
              <span className="relative z-10">{tab.icon(active)}</span>
              <span className="relative inline-flex items-center justify-center text-[11px] font-bold text-ink-0">
                {active && (
                  <motion.span
                    layoutId="tab-highlight"
                    className="absolute inset-x-[-4px] inset-y-[-2px] -z-10 rounded-[6px] bg-yellow"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
