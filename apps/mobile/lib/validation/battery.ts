import type { BatteryData } from "@/lib/api/types";

export const defaultBatteryData = (): BatteryData => ({
  productIdentifier: { batteryModel: "", serialOrBatch: "", batteryCategory: "EV" },
  manufacturerInfo: { name: "", euRegistrationId: "", manufacturingSite: "" },
  materialsComposition: { chemistry: "NMC", criticalRawMaterials: [], hazardousSubstances: [] },
  carbonFootprint: { totalKgCo2Equivalent: 0, methodologyReference: "" },
  recycledContent: { cobaltPercent: 0, lithiumPercent: 0, nickelPercent: 0, leadPercent: 0 },
  performanceDurability: { ratedCapacityAh: 0, expectedCycleLife: 0, warrantyYears: 0 },
  collectionTakeback: { takebackSchemeName: "", instructions: "" },
  dueDiligence: { policyReference: "", lastAuditDate: "" },
  dismantlingSecondLife: { dismantlingInstructions: "", secondLifeSuitability: "" },
});

export const wizardStepTitles = ["Identity", "Materials", "Performance", "Compliance", "Review"];

// Required string fields per step, checked before allowing "Continue" — kept
// intentionally lenient (presence only, no format rules) to match the web
// wizard's validation depth.
export function stepIsValid(step: number, data: BatteryData): boolean {
  switch (step) {
    case 0:
      return (
        data.productIdentifier.batteryModel.trim().length > 0 &&
        data.productIdentifier.serialOrBatch.trim().length > 0 &&
        data.manufacturerInfo.name.trim().length > 0 &&
        data.manufacturerInfo.euRegistrationId.trim().length > 0 &&
        data.manufacturerInfo.manufacturingSite.trim().length > 0
      );
    case 1:
      return data.carbonFootprint.methodologyReference.trim().length > 0;
    case 2:
      return (
        data.collectionTakeback.takebackSchemeName.trim().length > 0 &&
        data.collectionTakeback.instructions.trim().length > 0 &&
        data.dismantlingSecondLife.dismantlingInstructions.trim().length > 0 &&
        data.dismantlingSecondLife.secondLifeSuitability.trim().length > 0
      );
    case 3:
      return data.dueDiligence.policyReference.trim().length > 0 && data.dueDiligence.lastAuditDate.trim().length > 0;
    default:
      return true;
  }
}
