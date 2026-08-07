"use client";

import { useRouter } from "next/navigation";
import { BatteryWizardForm } from "@/components/passport/wizard/BatteryWizardForm";
import { usePassport, usePassportTransition } from "@/lib/api/hooks";
import { passportApi } from "@/lib/api/resources";
import type { BatteryFormValues } from "@/lib/validation/battery";

export function EditPassportClient({ id }: { id: string }) {
  const router = useRouter();
  const { data, isLoading } = usePassport(id);
  const transition = usePassportTransition(id);

  if (isLoading || !data) {
    return <div className="flex min-h-screen items-center justify-center text-ink-2">Loading…</div>;
  }

  const { passport, versions } = data;
  const currentData = (versions.at(-1)?.data ?? null) as BatteryFormValues | null;
  if (!currentData) {
    return <div className="flex min-h-screen items-center justify-center text-ink-2">No data to edit.</div>;
  }

  const isDraft = passport.status === "draft";

  return (
    <BatteryWizardForm
      title={isDraft ? "Edit draft" : "Amend passport"}
      initialValues={currentData}
      submitLabel={isDraft ? "Save draft" : "Sign & submit amendment"}
      onSubmit={async (values) => {
        if (isDraft) {
          await passportApi.updateDraft(id, values);
        } else {
          await transition.mutateAsync({ eventType: "amend", data: values });
        }
        router.replace(`/passports/${id}`);
      }}
    />
  );
}
