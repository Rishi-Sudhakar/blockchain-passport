"use client";

import { useRouter } from "next/navigation";
import { BatteryWizardForm } from "@/components/passport/wizard/BatteryWizardForm";
import { ApiError } from "@/lib/api/client";
import { passportApi } from "@/lib/api/resources";
import type { BatteryFormValues } from "@/lib/validation/battery";

const defaultValues: BatteryFormValues = {
  productIdentifier: { batteryModel: "", serialOrBatch: "", batteryCategory: "EV" },
  manufacturerInfo: { name: "", euRegistrationId: "", manufacturingSite: "" },
  materialsComposition: { chemistry: "NMC", criticalRawMaterials: [], hazardousSubstances: [] },
  carbonFootprint: { totalKgCo2Equivalent: 0, methodologyReference: "" },
  recycledContent: { cobaltPercent: 0, lithiumPercent: 0, nickelPercent: 0, leadPercent: 0 },
  performanceDurability: { ratedCapacityAh: 0, expectedCycleLife: 0, warrantyYears: 0 },
  collectionTakeback: { takebackSchemeName: "", instructions: "" },
  dueDiligence: { policyReference: "", lastAuditDate: "" },
  dismantlingSecondLife: { dismantlingInstructions: "", secondLifeSuitability: "" },
};

export default function NewPassportPage() {
  const router = useRouter();

  return (
    <BatteryWizardForm
      title="New passport"
      initialValues={defaultValues}
      submitLabel="Create draft"
      onSubmit={async (values) => {
        try {
          const { passport } = await passportApi.create({ category: "battery", data: values });
          router.replace(`/passports/${passport.id}`);
        } catch (err) {
          throw new Error(err instanceof ApiError ? err.message : "Couldn't create the draft. Try again.");
        }
      }}
    />
  );
}
