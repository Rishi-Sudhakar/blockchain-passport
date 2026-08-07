"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { BrandMark } from "@/components/landing/BrandMark";
import { LandingNav } from "@/components/landing/LandingNav";
import { PassportMockup } from "@/components/landing/PassportMockup";
import { StepCard } from "@/components/landing/StepCard";
import { FeatureCard } from "@/components/landing/FeatureCard";
import {
  IconCertify,
  IconChecklist,
  IconDevices,
  IconFingerprint,
  IconFlag,
  IconIssue,
  IconLink,
  IconScan,
} from "@/components/landing/icons";
import { useSession } from "@/lib/auth/session";

const steps = [
  {
    title: "Issue",
    description: "Manufacturers fill out a guided EU Battery Regulation wizard to draft a digital product passport.",
    icon: <IconIssue />,
  },
  {
    title: "Certify",
    description: "A certifier reviews the submission and signs off — approval or rejection is recorded permanently.",
    icon: <IconCertify />,
  },
  {
    title: "Verify",
    description: "Anyone can scan the passport's QR code to see compliance data and its full chain of custody.",
    icon: <IconScan />,
  },
];

const features = [
  {
    title: "Tamper-evident ledger",
    description: "Every state change is hashed, chained, and signed — altering history breaks the chain visibly.",
    icon: <IconLink />,
  },
  {
    title: "Passkey security",
    description: "Face ID, Touch ID, or Windows Hello — no passwords, and your signing key never leaves your device.",
    icon: <IconFingerprint />,
  },
  {
    title: "Built for EU Battery Regulation",
    description: "Materials, carbon footprint, recycled content, durability, and due diligence — modeled end to end.",
    icon: <IconFlag />,
  },
  {
    title: "Multi-device signing",
    description: "Add a signing key per device. Revoke one without losing access to the others.",
    icon: <IconDevices />,
  },
  {
    title: "Public verification",
    description: "No account needed — scan a code or look one up to see verified compliance data instantly.",
    icon: <IconScan />,
  },
  {
    title: "Built-in certifier workflow",
    description: "A dedicated review queue, approval/rejection notes, and a clear audit trail for every decision.",
    icon: <IconChecklist />,
  },
];

function FadeUp({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

export default function LandingPage() {
  const { user, isLoading } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) router.replace("/dashboard");
  }, [isLoading, user, router]);

  return (
    <main className="flex min-h-screen flex-col">
      <LandingNav />

      {/* Hero */}
      <section className="mx-auto flex w-full max-w-6xl flex-col-reverse items-center gap-12 px-6 py-16 lg:flex-row lg:gap-8 lg:py-28">
        <motion.div
          className="flex-1 space-y-6 text-center lg:text-left"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="text-[36px] font-semibold leading-[1.1] tracking-tight text-ink-0 sm:text-[46px] lg:text-[52px]">
            Every product,
            <br />
            <span className="text-accent-teal">verifiably compliant.</span>
          </h1>
          <p className="mx-auto max-w-md text-[16px] leading-relaxed text-ink-2 lg:mx-0">
            Issue digital product passports, get them certified, and let anyone verify their
            chain of custody — secured by a tamper-evident, cryptographically signed ledger.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <Link href="/auth/register">
              <Button size="lg" fullWidth className="sm:w-auto">
                Get started
              </Button>
            </Link>
            <Link href="/verify">
              <Button size="lg" variant="glass" fullWidth className="sm:w-auto">
                Verify a passport
              </Button>
            </Link>
          </div>
        </motion.div>

        <div className="flex flex-1 items-center justify-center">
          <PassportMockup />
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto w-full max-w-6xl px-6 py-16">
        <FadeUp>
          <div className="mb-10 max-w-lg">
            <p className="text-[13px] font-semibold uppercase tracking-wider text-accent-teal">How it works</p>
            <h2 className="mt-2 text-[26px] font-semibold tracking-tight text-ink-0">
              From factory floor to public record, in three steps.
            </h2>
          </div>
        </FadeUp>
        <div className="grid gap-4 sm:grid-cols-3">
          {steps.map((step, i) => (
            <StepCard key={step.title} index={i} title={step.title} description={step.description} icon={step.icon} />
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto w-full max-w-6xl px-6 py-16">
        <FadeUp>
          <div className="mb-10 max-w-lg">
            <p className="text-[13px] font-semibold uppercase tracking-wider text-accent-teal">Why it holds up</p>
            <h2 className="mt-2 text-[26px] font-semibold tracking-tight text-ink-0">
              Compliance data nobody can quietly rewrite.
            </h2>
          </div>
        </FadeUp>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <FeatureCard key={f.title} index={i} title={f.title} description={f.description} icon={f.icon} />
          ))}
        </div>
      </section>

      {/* Trust / ledger callout */}
      <section className="mx-auto w-full max-w-6xl px-6 py-16">
        <FadeUp>
          <GlassCard tone="strong" className="flex flex-col items-center gap-6 p-10 text-center lg:flex-row lg:text-left">
            <div className="flex-1 space-y-3">
              <h2 className="text-[24px] font-semibold tracking-tight text-ink-0">
                Every change is hashed, signed, and chained.
              </h2>
              <p className="max-w-md text-[14px] leading-relaxed text-ink-2">
                Tamper with a single stored record and the chain visibly breaks at that exact
                point — verifiable by anyone, instantly, without trusting us.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-[16px] border border-white/[0.1] bg-white/[0.04] px-5 py-4">
              <span className="text-xl text-success">✓</span>
              <div className="text-left">
                <p className="text-[13px] font-semibold text-success">Chain verified</p>
                <p className="text-[11px] text-ink-3">4 records, no tampering detected</p>
              </div>
            </div>
          </GlassCard>
        </FadeUp>
      </section>

      {/* Final CTA */}
      <section className="mx-auto w-full max-w-6xl px-6 py-16 text-center">
        <FadeUp>
          <h2 className="text-[28px] font-semibold tracking-tight text-ink-0">Ready to issue your first passport?</h2>
          <p className="mx-auto mt-2 max-w-sm text-[14px] text-ink-2">
            Free to try. Passkey sign-up takes under a minute.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/auth/register">
              <Button size="lg">Get started</Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="glass">
                I already have an account
              </Button>
            </Link>
          </div>
        </FadeUp>
      </section>

      <footer className="border-t border-white/[0.08] px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <BrandMark size={22} />
            <span className="text-[13px] font-medium text-ink-1">Passport</span>
          </div>
          <p className="text-[12px] text-ink-3">Demo build — not for production compliance use.</p>
        </div>
      </footer>
    </main>
  );
}
