"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { TextAreaField } from "@/components/ui/TextAreaField";
import { NoSigningKeyError } from "@/lib/api/sign-and-commit";
import { useCertificationDecision, usePassportTransition } from "@/lib/api/hooks";
import type { Passport, PassportVersion, User } from "@/lib/api/types";

export function PassportActions({
  passport,
  versions,
  user,
}: {
  passport: Passport;
  versions: PassportVersion[];
  user: User;
}) {
  const transition = usePassportTransition(passport.id);
  const decision = useCertificationDecision(passport.id);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const isOwnerOrg = user.organizationId === passport.organizationId;
  const isManufacturerOwner = (user.role === "manufacturer" || user.role === "admin") && isOwnerOrg;
  const isCertifier = user.role === "certifier" || user.role === "admin";
  const currentData = versions.at(-1)?.data;

  const runTransition = async (eventType: string) => {
    setError(null);
    try {
      await transition.mutateAsync({ eventType, data: currentData });
    } catch (err) {
      setError(describeError(err));
    }
  };

  const runDecision = async (approve: boolean) => {
    setError(null);
    try {
      await decision.mutateAsync({ approve, notes });
      setNotes("");
    } catch (err) {
      setError(describeError(err));
    }
  };

  const busy = transition.isPending || decision.isPending;

  if (passport.status === "draft" && isManufacturerOwner) {
    return (
      <ActionCard error={error}>
        <div className="flex gap-3">
          <Link href={`/passports/${passport.id}/edit`} className="flex-1">
            <Button variant="glass" fullWidth>
              Edit draft
            </Button>
          </Link>
          <Button className="flex-1" loading={busy} onClick={() => runTransition("submit")}>
            Submit for certification
          </Button>
        </div>
      </ActionCard>
    );
  }

  if (passport.status === "submitted" && isCertifier) {
    return (
      <ActionCard error={error}>
        <p className="mb-3 text-[13px] font-semibold text-ink-2">Certifier review</p>
        <TextAreaField
          label="Notes"
          placeholder="Compliance notes for this decision…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <div className="mt-3 flex gap-3">
          <Button variant="danger" className="flex-1" loading={busy} onClick={() => runDecision(false)}>
            Reject
          </Button>
          <Button className="flex-1" loading={busy} onClick={() => runDecision(true)}>
            Approve
          </Button>
        </div>
      </ActionCard>
    );
  }

  if (passport.status === "submitted" && isManufacturerOwner) {
    return (
      <ActionCard error={error}>
        <p className="text-center text-[13px] text-ink-2">Awaiting certifier review.</p>
      </ActionCard>
    );
  }

  if (passport.status === "certified" && isManufacturerOwner) {
    return (
      <ActionCard error={error}>
        <Button fullWidth loading={busy} onClick={() => runTransition("publish")}>
          Publish passport
        </Button>
      </ActionCard>
    );
  }

  if ((passport.status === "published" || passport.status === "amended") && isManufacturerOwner) {
    return (
      <ActionCard error={error}>
        <div className="flex gap-3">
          <Link href={`/passports/${passport.id}/edit`} className="flex-1">
            <Button variant="glass" fullWidth>
              Amend
            </Button>
          </Link>
          <Button variant="danger" className="flex-1" loading={busy} onClick={() => runTransition("end_of_life")}>
            End of life
          </Button>
        </div>
      </ActionCard>
    );
  }

  return null;
}

function ActionCard({ error, children }: { error: string | null; children: React.ReactNode }) {
  return (
    <GlassCard>
      {children}
      {error && <p className="mt-3 text-[13px] text-danger">{error}</p>}
    </GlassCard>
  );
}

function describeError(err: unknown): string {
  if (err instanceof NoSigningKeyError) return err.message;
  if (err instanceof Error) return err.message;
  return "Something went wrong. Please try again.";
}
