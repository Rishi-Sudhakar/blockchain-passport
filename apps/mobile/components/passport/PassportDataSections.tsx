import { StyleSheet, Text, View } from "react-native";
import { GlassCard } from "@/components/ui/GlassCard";
import type { BatteryData } from "@/lib/api/types";
import { colors } from "@/theme/tokens";

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={2}>
        {value === "" || value === undefined ? "—" : String(value)}
      </Text>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <GlassCard style={{ gap: 2 }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </GlassCard>
  );
}

export function PassportDataSections({ data }: { data: BatteryData }) {
  return (
    <View style={{ gap: 12 }}>
      <Section title="Product identifier">
        <Row label="Battery model" value={data.productIdentifier.batteryModel} />
        <Row label="Serial / batch" value={data.productIdentifier.serialOrBatch} />
        <Row label="Category" value={data.productIdentifier.batteryCategory} />
      </Section>
      <Section title="Manufacturer">
        <Row label="Name" value={data.manufacturerInfo.name} />
        <Row label="EU registration ID" value={data.manufacturerInfo.euRegistrationId} />
        <Row label="Manufacturing site" value={data.manufacturerInfo.manufacturingSite} />
      </Section>
      <Section title="Materials composition">
        <Row label="Chemistry" value={data.materialsComposition.chemistry} />
        <Row label="Critical raw materials" value={data.materialsComposition.criticalRawMaterials.join(", ") || "None declared"} />
        <Row label="Hazardous substances" value={data.materialsComposition.hazardousSubstances.join(", ") || "None declared"} />
      </Section>
      <Section title="Carbon footprint">
        <Row label="Total" value={`${data.carbonFootprint.totalKgCo2Equivalent} kg CO2e`} />
        <Row label="Methodology" value={data.carbonFootprint.methodologyReference} />
      </Section>
      <Section title="Recycled content">
        <Row label="Cobalt" value={`${data.recycledContent.cobaltPercent}%`} />
        <Row label="Lithium" value={`${data.recycledContent.lithiumPercent}%`} />
        <Row label="Nickel" value={`${data.recycledContent.nickelPercent}%`} />
        <Row label="Lead" value={`${data.recycledContent.leadPercent}%`} />
      </Section>
      <Section title="Performance & durability">
        <Row label="Rated capacity" value={`${data.performanceDurability.ratedCapacityAh} Ah`} />
        <Row label="Expected cycle life" value={data.performanceDurability.expectedCycleLife} />
        <Row label="Warranty" value={`${data.performanceDurability.warrantyYears} yrs`} />
      </Section>
      <Section title="Collection & takeback">
        <Row label="Scheme" value={data.collectionTakeback.takebackSchemeName} />
        <Row label="Instructions" value={data.collectionTakeback.instructions} />
      </Section>
      <Section title="Due diligence">
        <Row label="Policy reference" value={data.dueDiligence.policyReference} />
        <Row label="Last audit" value={data.dueDiligence.lastAuditDate} />
      </Section>
      <Section title="Dismantling & second life">
        <Row label="Dismantling" value={data.dismantlingSecondLife.dismantlingInstructions} />
        <Row label="Second-life suitability" value={data.dismantlingSecondLife.secondLifeSuitability} />
      </Section>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { fontSize: 13, fontWeight: "600", color: colors.ink2, marginBottom: 4 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  rowLabel: { fontSize: 13, color: colors.ink2, flexShrink: 0 },
  rowValue: { fontSize: 13, fontWeight: "500", color: colors.ink0, flex: 1, textAlign: "right" },
});
