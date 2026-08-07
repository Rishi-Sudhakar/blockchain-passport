"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { SelectField } from "@/components/ui/SelectField";
import { StepIndicator } from "@/components/ui/StepIndicator";
import { TextAreaField } from "@/components/ui/TextAreaField";
import { TextField } from "@/components/ui/TextField";
import { TopBar } from "@/components/shell/TopBar";
import { batteryDataSchema, stepFieldGroups, wizardStepTitles, type BatteryFormValues } from "@/lib/validation/battery";

interface BatteryWizardFormProps {
  title: string;
  initialValues: BatteryFormValues;
  submitLabel: string;
  onSubmit: (values: BatteryFormValues) => Promise<void>;
}

export function BatteryWizardForm({ title, initialValues, submitLabel, onSubmit }: BatteryWizardFormProps) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    trigger,
    getValues,
    formState: { errors },
  } = useForm<BatteryFormValues>({ resolver: zodResolver(batteryDataSchema), defaultValues: initialValues });

  const lastStep = wizardStepTitles.length - 1;

  const goNext = async () => {
    if (step < stepFieldGroups.length) {
      const valid = await trigger(stepFieldGroups[step]);
      if (!valid) return;
    }
    setDirection(1);
    setStep((s) => Math.min(s + 1, lastStep));
  };

  const goBack = () => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 0));
  };

  const submit = handleSubmit(async (values) => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit(values);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong. Try again.");
      setSubmitting(false);
    }
  });

  const v = getValues();

  return (
    <div>
      <TopBar title={title} />
      <div className="space-y-6 px-5">
        <StepIndicator steps={wizardStepTitles} current={step} />

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            initial={{ opacity: 0, x: direction * 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -24 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-4"
          >
            {step === 0 && (
              <>
                <GlassCard className="space-y-4">
                  <p className="text-[13px] font-extrabold text-ink-2">Product identifier</p>
                  <TextField label="Battery model" {...register("productIdentifier.batteryModel")} error={errors.productIdentifier?.batteryModel?.message} />
                  <TextField label="Serial or batch number" {...register("productIdentifier.serialOrBatch")} error={errors.productIdentifier?.serialOrBatch?.message} />
                  <SelectField
                    label="Battery category"
                    {...register("productIdentifier.batteryCategory")}
                    options={[
                      { value: "EV", label: "Electric vehicle" },
                      { value: "LMT", label: "Light means of transport" },
                      { value: "industrial", label: "Industrial" },
                      { value: "portable", label: "Portable" },
                    ]}
                  />
                </GlassCard>
                <GlassCard className="space-y-4">
                  <p className="text-[13px] font-extrabold text-ink-2">Manufacturer</p>
                  <TextField label="Manufacturer name" {...register("manufacturerInfo.name")} error={errors.manufacturerInfo?.name?.message} />
                  <TextField label="EU registration ID" {...register("manufacturerInfo.euRegistrationId")} error={errors.manufacturerInfo?.euRegistrationId?.message} />
                  <TextField label="Manufacturing site" {...register("manufacturerInfo.manufacturingSite")} error={errors.manufacturerInfo?.manufacturingSite?.message} />
                </GlassCard>
              </>
            )}

            {step === 1 && (
              <>
                <GlassCard className="space-y-4">
                  <p className="text-[13px] font-extrabold text-ink-2">Materials composition</p>
                  <SelectField
                    label="Chemistry"
                    {...register("materialsComposition.chemistry")}
                    options={[
                      { value: "NMC", label: "NMC (Nickel Manganese Cobalt)" },
                      { value: "LFP", label: "LFP (Lithium Iron Phosphate)" },
                      { value: "NCA", label: "NCA (Nickel Cobalt Aluminium)" },
                      { value: "NiMH", label: "NiMH" },
                      { value: "LeadAcid", label: "Lead-acid" },
                    ]}
                  />
                </GlassCard>
                <GlassCard className="space-y-4">
                  <p className="text-[13px] font-extrabold text-ink-2">Carbon footprint</p>
                  <TextField label="Total kg CO₂ equivalent" type="number" step="0.01" {...register("carbonFootprint.totalKgCo2Equivalent", { valueAsNumber: true })} error={errors.carbonFootprint?.totalKgCo2Equivalent?.message} />
                  <TextField label="Methodology reference" {...register("carbonFootprint.methodologyReference")} error={errors.carbonFootprint?.methodologyReference?.message} />
                </GlassCard>
                <GlassCard className="space-y-4">
                  <p className="text-[13px] font-extrabold text-ink-2">Recycled content</p>
                  <div className="grid grid-cols-2 gap-4">
                    <TextField label="Cobalt %" type="number" step="0.1" {...register("recycledContent.cobaltPercent", { valueAsNumber: true })} error={errors.recycledContent?.cobaltPercent?.message} />
                    <TextField label="Lithium %" type="number" step="0.1" {...register("recycledContent.lithiumPercent", { valueAsNumber: true })} error={errors.recycledContent?.lithiumPercent?.message} />
                    <TextField label="Nickel %" type="number" step="0.1" {...register("recycledContent.nickelPercent", { valueAsNumber: true })} error={errors.recycledContent?.nickelPercent?.message} />
                    <TextField label="Lead %" type="number" step="0.1" {...register("recycledContent.leadPercent", { valueAsNumber: true })} error={errors.recycledContent?.leadPercent?.message} />
                  </div>
                </GlassCard>
              </>
            )}

            {step === 2 && (
              <>
                <GlassCard className="space-y-4">
                  <p className="text-[13px] font-extrabold text-ink-2">Performance &amp; durability</p>
                  <TextField label="Rated capacity (Ah)" type="number" step="0.1" {...register("performanceDurability.ratedCapacityAh", { valueAsNumber: true })} error={errors.performanceDurability?.ratedCapacityAh?.message} />
                  <TextField label="Expected cycle life" type="number" {...register("performanceDurability.expectedCycleLife", { valueAsNumber: true })} error={errors.performanceDurability?.expectedCycleLife?.message} />
                  <TextField label="Warranty (years)" type="number" step="0.5" {...register("performanceDurability.warrantyYears", { valueAsNumber: true })} error={errors.performanceDurability?.warrantyYears?.message} />
                </GlassCard>
                <GlassCard className="space-y-4">
                  <p className="text-[13px] font-extrabold text-ink-2">Collection &amp; takeback</p>
                  <TextField label="Takeback scheme name" {...register("collectionTakeback.takebackSchemeName")} error={errors.collectionTakeback?.takebackSchemeName?.message} />
                  <TextAreaField label="Instructions" {...register("collectionTakeback.instructions")} error={errors.collectionTakeback?.instructions?.message} />
                </GlassCard>
                <GlassCard className="space-y-4">
                  <p className="text-[13px] font-extrabold text-ink-2">Dismantling &amp; second life</p>
                  <TextAreaField label="Dismantling instructions" {...register("dismantlingSecondLife.dismantlingInstructions")} error={errors.dismantlingSecondLife?.dismantlingInstructions?.message} />
                  <TextAreaField label="Second-life suitability" {...register("dismantlingSecondLife.secondLifeSuitability")} error={errors.dismantlingSecondLife?.secondLifeSuitability?.message} />
                </GlassCard>
              </>
            )}

            {step === 3 && (
              <GlassCard className="space-y-4">
                <p className="text-[13px] font-extrabold text-ink-2">Due diligence</p>
                <TextField label="Policy reference" {...register("dueDiligence.policyReference")} error={errors.dueDiligence?.policyReference?.message} />
                <TextField label="Last audit date" type="date" {...register("dueDiligence.lastAuditDate")} error={errors.dueDiligence?.lastAuditDate?.message} />
              </GlassCard>
            )}

            {step === 4 && (
              <div className="space-y-3">
                <ReviewRow label="Battery model" value={v.productIdentifier.batteryModel} />
                <ReviewRow label="Manufacturer" value={v.manufacturerInfo.name} />
                <ReviewRow label="Chemistry" value={v.materialsComposition.chemistry} />
                <ReviewRow label="Carbon footprint" value={`${v.carbonFootprint.totalKgCo2Equivalent} kg CO₂e`} />
                <ReviewRow label="Rated capacity" value={`${v.performanceDurability.ratedCapacityAh} Ah`} />
                <ReviewRow label="Due diligence policy" value={v.dueDiligence.policyReference} />
                {submitError && <p className="text-[13px] font-semibold text-danger">{submitError}</p>}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="flex gap-3 pb-6">
          {step > 0 && (
            <Button variant="glass" onClick={goBack} className="flex-1">
              Back
            </Button>
          )}
          {step < lastStep ? (
            <Button onClick={goNext} className="flex-1">
              Continue
            </Button>
          ) : (
            <Button onClick={submit} loading={submitting} className="flex-1">
              {submitLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <GlassCard className="flex items-center justify-between py-3">
      <span className="text-[13px] font-semibold text-ink-2">{label}</span>
      <span className="text-[14px] font-bold text-ink-0">{value || "Not provided"}</span>
    </GlassCard>
  );
}
