import { z } from "zod";

// Plain z.number() (not z.coerce.number()) so the schema's input and output
// types match exactly — react-hook-form's useForm<BatteryFormValues> needs
// that identity. Number <input>s use `valueAsNumber` on register() instead to
// produce an actual number before validation runs.
const nonNegative = z.number().min(0, "Must be zero or more");

export const batteryDataSchema = z.object({
  productIdentifier: z.object({
    batteryModel: z.string().min(1, "Required"),
    serialOrBatch: z.string().min(1, "Required"),
    batteryCategory: z.enum(["EV", "LMT", "industrial", "portable"]),
  }),
  manufacturerInfo: z.object({
    name: z.string().min(1, "Required"),
    euRegistrationId: z.string().min(1, "Required"),
    manufacturingSite: z.string().min(1, "Required"),
  }),
  materialsComposition: z.object({
    chemistry: z.enum(["NMC", "LFP", "NCA", "NiMH", "LeadAcid"]),
    criticalRawMaterials: z.array(z.string()),
    hazardousSubstances: z.array(z.string()),
  }),
  carbonFootprint: z.object({
    totalKgCo2Equivalent: nonNegative,
    methodologyReference: z.string().min(1, "Required"),
  }),
  recycledContent: z.object({
    cobaltPercent: nonNegative.max(100),
    lithiumPercent: nonNegative.max(100),
    nickelPercent: nonNegative.max(100),
    leadPercent: nonNegative.max(100),
  }),
  performanceDurability: z.object({
    ratedCapacityAh: nonNegative,
    expectedCycleLife: nonNegative,
    warrantyYears: nonNegative,
  }),
  collectionTakeback: z.object({
    takebackSchemeName: z.string().min(1, "Required"),
    instructions: z.string().min(1, "Required"),
  }),
  dueDiligence: z.object({
    policyReference: z.string().min(1, "Required"),
    lastAuditDate: z.string().min(1, "Required"),
  }),
  dismantlingSecondLife: z.object({
    dismantlingInstructions: z.string().min(1, "Required"),
    secondLifeSuitability: z.string().min(1, "Required"),
  }),
});

export type BatteryFormValues = z.infer<typeof batteryDataSchema>;

export const stepFieldGroups: (keyof BatteryFormValues)[][] = [
  ["productIdentifier", "manufacturerInfo"],
  ["materialsComposition", "carbonFootprint", "recycledContent"],
  ["performanceDurability", "collectionTakeback", "dismantlingSecondLife"],
  ["dueDiligence"],
];

export const wizardStepTitles = ["Identity", "Materials", "Performance", "Compliance", "Review"];
