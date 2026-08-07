"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import type { BatteryData } from "@/lib/api/types";

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between border-b border-white/[0.06] py-2.5 last:border-0">
      <span className="text-[13px] text-ink-2">{label}</span>
      <span className="max-w-[60%] text-right text-[13px] font-medium text-ink-0">
        {value === "" || value === undefined ? "—" : value}
      </span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <GlassCard>
      <p className="mb-1 text-[13px] font-semibold text-ink-2">{title}</p>
      {children}
    </GlassCard>
  );
}

export function PassportDataSections({ data }: { data: BatteryData }) {
  return (
    <div className="space-y-3">
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
        <Row label="Total" value={`${data.carbonFootprint.totalKgCo2Equivalent} kg CO₂e`} />
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
    </div>
  );
}
