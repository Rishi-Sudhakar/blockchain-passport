import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TopBar } from "@/components/shell/TopBar";
import { Button } from "@/components/ui/Button";
import { ChipSelect } from "@/components/ui/ChipSelect";
import { GlassCard } from "@/components/ui/GlassCard";
import { StepIndicator } from "@/components/ui/StepIndicator";
import { TextField } from "@/components/ui/TextField";
import type { BatteryData } from "@/lib/api/types";
import { stepIsValid, wizardStepTitles } from "@/lib/validation/battery";
import { colors } from "@/theme/tokens";

type Section = keyof BatteryData;

interface BatteryWizardFormProps {
  title: string;
  initialValues: BatteryData;
  submitLabel: string;
  onSubmit: (values: BatteryData) => Promise<void>;
}

export function BatteryWizardForm({ title, initialValues, submitLabel, onSubmit }: BatteryWizardFormProps) {
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<BatteryData>(initialValues);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const patch = <S extends Section>(section: S, field: keyof BatteryData[S], value: string | number) => {
    setData((prev) => ({ ...prev, [section]: { ...prev[section], [field]: value } }));
  };

  const lastStep = wizardStepTitles.length - 1;
  const canContinue = stepIsValid(step, data);

  const goNext = () => {
    if (!canContinue) return;
    setStep((s) => Math.min(s + 1, lastStep));
  };
  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
      setSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 140 }}>
        <TopBar title={title} />
        <View style={styles.content}>
          <StepIndicator steps={wizardStepTitles} current={step} />

          <Animated.View key={step} entering={FadeIn.duration(250)} style={{ gap: 12 }}>
            {step === 0 && (
              <>
                <GlassCard style={styles.card}>
                  <Text style={styles.cardTitle}>Product identifier</Text>
                  <TextField label="Battery model" value={data.productIdentifier.batteryModel} onChangeText={(v) => patch("productIdentifier", "batteryModel", v)} />
                  <TextField label="Serial or batch number" value={data.productIdentifier.serialOrBatch} onChangeText={(v) => patch("productIdentifier", "serialOrBatch", v)} />
                  <ChipSelect
                    label="Battery category"
                    value={data.productIdentifier.batteryCategory}
                    onChange={(v) => patch("productIdentifier", "batteryCategory", v)}
                    options={[
                      { value: "EV", label: "Electric vehicle" },
                      { value: "LMT", label: "Light transport" },
                      { value: "industrial", label: "Industrial" },
                      { value: "portable", label: "Portable" },
                    ]}
                  />
                </GlassCard>
                <GlassCard style={styles.card}>
                  <Text style={styles.cardTitle}>Manufacturer</Text>
                  <TextField label="Manufacturer name" value={data.manufacturerInfo.name} onChangeText={(v) => patch("manufacturerInfo", "name", v)} />
                  <TextField label="EU registration ID" value={data.manufacturerInfo.euRegistrationId} onChangeText={(v) => patch("manufacturerInfo", "euRegistrationId", v)} />
                  <TextField label="Manufacturing site" value={data.manufacturerInfo.manufacturingSite} onChangeText={(v) => patch("manufacturerInfo", "manufacturingSite", v)} />
                </GlassCard>
              </>
            )}

            {step === 1 && (
              <>
                <GlassCard style={styles.card}>
                  <Text style={styles.cardTitle}>Materials composition</Text>
                  <ChipSelect
                    label="Chemistry"
                    value={data.materialsComposition.chemistry}
                    onChange={(v) => patch("materialsComposition", "chemistry", v)}
                    options={[
                      { value: "NMC", label: "NMC" },
                      { value: "LFP", label: "LFP" },
                      { value: "NCA", label: "NCA" },
                      { value: "NiMH", label: "NiMH" },
                      { value: "LeadAcid", label: "Lead-acid" },
                    ]}
                  />
                </GlassCard>
                <GlassCard style={styles.card}>
                  <Text style={styles.cardTitle}>Carbon footprint</Text>
                  <TextField label="Total kg CO2 equivalent" keyboardType="decimal-pad" value={String(data.carbonFootprint.totalKgCo2Equivalent)} onChangeText={(v) => patch("carbonFootprint", "totalKgCo2Equivalent", Number(v) || 0)} />
                  <TextField label="Methodology reference" value={data.carbonFootprint.methodologyReference} onChangeText={(v) => patch("carbonFootprint", "methodologyReference", v)} />
                </GlassCard>
                <GlassCard style={styles.card}>
                  <Text style={styles.cardTitle}>Recycled content (%)</Text>
                  <View style={styles.grid2}>
                    <TextField label="Cobalt" keyboardType="decimal-pad" value={String(data.recycledContent.cobaltPercent)} onChangeText={(v) => patch("recycledContent", "cobaltPercent", Number(v) || 0)} style={styles.gridItem} />
                    <TextField label="Lithium" keyboardType="decimal-pad" value={String(data.recycledContent.lithiumPercent)} onChangeText={(v) => patch("recycledContent", "lithiumPercent", Number(v) || 0)} style={styles.gridItem} />
                    <TextField label="Nickel" keyboardType="decimal-pad" value={String(data.recycledContent.nickelPercent)} onChangeText={(v) => patch("recycledContent", "nickelPercent", Number(v) || 0)} style={styles.gridItem} />
                    <TextField label="Lead" keyboardType="decimal-pad" value={String(data.recycledContent.leadPercent)} onChangeText={(v) => patch("recycledContent", "leadPercent", Number(v) || 0)} style={styles.gridItem} />
                  </View>
                </GlassCard>
              </>
            )}

            {step === 2 && (
              <>
                <GlassCard style={styles.card}>
                  <Text style={styles.cardTitle}>Performance & durability</Text>
                  <TextField label="Rated capacity (Ah)" keyboardType="decimal-pad" value={String(data.performanceDurability.ratedCapacityAh)} onChangeText={(v) => patch("performanceDurability", "ratedCapacityAh", Number(v) || 0)} />
                  <TextField label="Expected cycle life" keyboardType="numeric" value={String(data.performanceDurability.expectedCycleLife)} onChangeText={(v) => patch("performanceDurability", "expectedCycleLife", Number(v) || 0)} />
                  <TextField label="Warranty (years)" keyboardType="decimal-pad" value={String(data.performanceDurability.warrantyYears)} onChangeText={(v) => patch("performanceDurability", "warrantyYears", Number(v) || 0)} />
                </GlassCard>
                <GlassCard style={styles.card}>
                  <Text style={styles.cardTitle}>Collection & takeback</Text>
                  <TextField label="Takeback scheme name" value={data.collectionTakeback.takebackSchemeName} onChangeText={(v) => patch("collectionTakeback", "takebackSchemeName", v)} />
                  <TextField label="Instructions" value={data.collectionTakeback.instructions} onChangeText={(v) => patch("collectionTakeback", "instructions", v)} multiline />
                </GlassCard>
                <GlassCard style={styles.card}>
                  <Text style={styles.cardTitle}>Dismantling & second life</Text>
                  <TextField label="Dismantling instructions" value={data.dismantlingSecondLife.dismantlingInstructions} onChangeText={(v) => patch("dismantlingSecondLife", "dismantlingInstructions", v)} multiline />
                  <TextField label="Second-life suitability" value={data.dismantlingSecondLife.secondLifeSuitability} onChangeText={(v) => patch("dismantlingSecondLife", "secondLifeSuitability", v)} multiline />
                </GlassCard>
              </>
            )}

            {step === 3 && (
              <GlassCard style={styles.card}>
                <Text style={styles.cardTitle}>Due diligence</Text>
                <TextField label="Policy reference" value={data.dueDiligence.policyReference} onChangeText={(v) => patch("dueDiligence", "policyReference", v)} />
                <TextField label="Last audit date (YYYY-MM-DD)" value={data.dueDiligence.lastAuditDate} onChangeText={(v) => patch("dueDiligence", "lastAuditDate", v)} />
              </GlassCard>
            )}

            {step === 4 && (
              <View style={{ gap: 10 }}>
                <ReviewRow label="Battery model" value={data.productIdentifier.batteryModel} />
                <ReviewRow label="Manufacturer" value={data.manufacturerInfo.name} />
                <ReviewRow label="Chemistry" value={data.materialsComposition.chemistry} />
                <ReviewRow label="Carbon footprint" value={`${data.carbonFootprint.totalKgCo2Equivalent} kg CO2e`} />
                <ReviewRow label="Rated capacity" value={`${data.performanceDurability.ratedCapacityAh} Ah`} />
                <ReviewRow label="Due diligence policy" value={data.dueDiligence.policyReference} />
                {error && <Text style={styles.error}>{error}</Text>}
              </View>
            )}
          </Animated.View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        {step > 0 && <Button title="Back" variant="glass" style={{ flex: 1 }} onPress={goBack} />}
        {step < lastStep ? (
          <Button title="Continue" style={{ flex: 1 }} disabled={!canContinue} onPress={goNext} />
        ) : (
          <Button title={submitLabel} style={{ flex: 1 }} loading={submitting} onPress={submit} />
        )}
      </View>
    </View>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <GlassCard style={styles.reviewRow}>
      <Text style={styles.reviewLabel}>{label}</Text>
      <Text style={styles.reviewValue}>{value || "—"}</Text>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, gap: 16 },
  card: { gap: 14 },
  cardTitle: { fontSize: 13, fontWeight: "600", color: colors.ink2 },
  grid2: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  gridItem: { width: "47%" },
  reviewRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 12 },
  reviewLabel: { fontSize: 13, color: colors.ink2 },
  reviewValue: { fontSize: 14, fontWeight: "500", color: colors.ink0 },
  error: { fontSize: 13, color: colors.danger },
  footer: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
    backgroundColor: colors.bg0,
  },
});
