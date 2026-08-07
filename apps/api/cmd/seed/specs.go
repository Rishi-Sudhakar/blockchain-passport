package main

import (
	"context"
	"encoding/json"

	"blockchain-passport/api/internal/certification"
	"blockchain-passport/api/internal/identity"
	"blockchain-passport/api/internal/passport"
)

type mockSpec struct {
	data              passport.BatteryData
	target            passport.Status // final status this spec should end up at
	rejectedFirst     bool            // demo the reject path; result stays "draft"
	certificationNote string
}

func (m mockSpec) run(
	ctx context.Context,
	passportSvc *passport.Service,
	certSvc *certification.Service,
	mfgUser, certUser *identity.User,
	mfgSigner, certSigner *seedSigner,
) error {
	dataJSON, err := json.Marshal(m.data)
	if err != nil {
		return err
	}

	p, _, err := passportSvc.CreateDraft(ctx, mfgUser, "battery", dataJSON)
	if err != nil {
		return err
	}
	if m.target == passport.StatusDraft && !m.rejectedFirst {
		return nil
	}

	if err := submitPassport(ctx, passportSvc, mfgUser, mfgSigner, p.ID, dataJSON); err != nil {
		return err
	}

	if m.rejectedFirst {
		return decidePassport(ctx, certSvc, certUser, certSigner, p.ID, false, m.certificationNote)
	}
	if m.target == passport.StatusSubmitted {
		return nil
	}

	if err := decidePassport(ctx, certSvc, certUser, certSigner, p.ID, true, m.certificationNote); err != nil {
		return err
	}
	if m.target == passport.StatusCertified {
		return nil
	}

	if err := publishPassport(ctx, passportSvc, mfgUser, mfgSigner, p.ID, dataJSON); err != nil {
		return err
	}
	switch m.target {
	case passport.StatusPublished:
		return nil
	case passport.StatusAmended:
		amended := m.data
		amended.PerformanceDurability.RatedCapacityAh += 5
		amended.PerformanceDurability.ExpectedCycleLife += 200
		amendedJSON, err := json.Marshal(amended)
		if err != nil {
			return err
		}
		return amendPassport(ctx, passportSvc, mfgUser, mfgSigner, p.ID, amendedJSON)
	case passport.StatusEndOfLife:
		return endOfLifePassport(ctx, passportSvc, mfgUser, mfgSigner, p.ID, dataJSON)
	}
	return nil
}

var specs = []mockSpec{
	{
		target: passport.StatusDraft,
		data: passport.BatteryData{
			ProductIdentifier:     passport.ProductIdentifier{BatteryModel: "PowerCell X1", SerialOrBatch: "PC-X1-0042", BatteryCategory: "EV"},
			ManufacturerInfo:      passport.ManufacturerInfo{Name: "Acme Battery Co.", EURegistrationID: "EU-REG-88213", ManufacturingSite: "Gothenburg, Sweden"},
			MaterialsComposition:  passport.MaterialsComposition{Chemistry: "NMC", CriticalRawMaterials: []string{"Cobalt", "Lithium", "Nickel"}, HazardousSubstances: []string{"Electrolyte solvent"}},
			CarbonFootprint:       passport.CarbonFootprint{TotalKgCO2Equivalent: 61.4, MethodologyReference: "PEFCR Batteries v1.2"},
			RecycledContent:       passport.RecycledContent{CobaltPercent: 16, LithiumPercent: 4, NickelPercent: 12, LeadPercent: 0},
			PerformanceDurability: passport.PerformanceDurability{RatedCapacityAh: 78, ExpectedCycleLife: 1800, WarrantyYears: 8},
			CollectionTakeback:    passport.CollectionTakeback{TakebackSchemeName: "Acme Reclaim Network", Instructions: "Return to any authorized Acme service center."},
			DueDiligence:          passport.DueDiligence{PolicyReference: "ACME-DD-2025-01", LastAuditDate: "2025-11-02"},
			DismantlingSecondLife: passport.DismantlingSecondLife{DismantlingInstructions: "Disconnect HV interlock before module removal.", SecondLifeSuitability: "Suitable for stationary storage after 80% SOH."},
		},
	},
	{
		target: passport.StatusDraft,
		data: passport.BatteryData{
			ProductIdentifier:     passport.ProductIdentifier{BatteryModel: "PowerCell X2", SerialOrBatch: "PC-X2-0091", BatteryCategory: "EV"},
			ManufacturerInfo:      passport.ManufacturerInfo{Name: "Acme Battery Co.", EURegistrationID: "EU-REG-88213", ManufacturingSite: "Gothenburg, Sweden"},
			MaterialsComposition:  passport.MaterialsComposition{Chemistry: "NMC", CriticalRawMaterials: []string{"Cobalt", "Lithium"}, HazardousSubstances: []string{"Electrolyte solvent"}},
			CarbonFootprint:       passport.CarbonFootprint{TotalKgCO2Equivalent: 58.9, MethodologyReference: "PEFCR Batteries v1.2"},
			RecycledContent:       passport.RecycledContent{CobaltPercent: 18, LithiumPercent: 5, NickelPercent: 14, LeadPercent: 0},
			PerformanceDurability: passport.PerformanceDurability{RatedCapacityAh: 82, ExpectedCycleLife: 1900, WarrantyYears: 8},
			CollectionTakeback:    passport.CollectionTakeback{TakebackSchemeName: "Acme Reclaim Network", Instructions: "Return to any authorized Acme service center."},
			DueDiligence:          passport.DueDiligence{PolicyReference: "ACME-DD-2025-01", LastAuditDate: "2025-11-02"},
			DismantlingSecondLife: passport.DismantlingSecondLife{DismantlingInstructions: "Disconnect HV interlock before module removal.", SecondLifeSuitability: "Suitable for stationary storage after 80% SOH."},
		},
	},
	{
		target: passport.StatusSubmitted,
		data: passport.BatteryData{
			ProductIdentifier:     passport.ProductIdentifier{BatteryModel: "UrbanRide L200", SerialOrBatch: "UR-L200-1187", BatteryCategory: "LMT"},
			ManufacturerInfo:      passport.ManufacturerInfo{Name: "Acme Battery Co.", EURegistrationID: "EU-REG-88213", ManufacturingSite: "Tilburg, Netherlands"},
			MaterialsComposition:  passport.MaterialsComposition{Chemistry: "LFP", CriticalRawMaterials: []string{"Lithium"}, HazardousSubstances: []string{}},
			CarbonFootprint:       passport.CarbonFootprint{TotalKgCO2Equivalent: 22.1, MethodologyReference: "PEFCR Batteries v1.2"},
			RecycledContent:       passport.RecycledContent{CobaltPercent: 0, LithiumPercent: 6, NickelPercent: 0, LeadPercent: 0},
			PerformanceDurability: passport.PerformanceDurability{RatedCapacityAh: 14, ExpectedCycleLife: 2500, WarrantyYears: 5},
			CollectionTakeback:    passport.CollectionTakeback{TakebackSchemeName: "UrbanRide Trade-In", Instructions: "Drop off at any partner e-bike retailer."},
			DueDiligence:          passport.DueDiligence{PolicyReference: "ACME-DD-2025-02", LastAuditDate: "2025-10-14"},
			DismantlingSecondLife: passport.DismantlingSecondLife{DismantlingInstructions: "Remove BMS before shredding.", SecondLifeSuitability: "Not recommended for second life."},
		},
	},
	{
		target: passport.StatusSubmitted,
		data: passport.BatteryData{
			ProductIdentifier:     passport.ProductIdentifier{BatteryModel: "GridStore 500", SerialOrBatch: "GS-500-0007", BatteryCategory: "industrial"},
			ManufacturerInfo:      passport.ManufacturerInfo{Name: "Acme Battery Co.", EURegistrationID: "EU-REG-88213", ManufacturingSite: "Wrocław, Poland"},
			MaterialsComposition:  passport.MaterialsComposition{Chemistry: "LFP", CriticalRawMaterials: []string{"Lithium", "Graphite"}, HazardousSubstances: []string{}},
			CarbonFootprint:       passport.CarbonFootprint{TotalKgCO2Equivalent: 340.5, MethodologyReference: "PEFCR Batteries v1.2"},
			RecycledContent:       passport.RecycledContent{CobaltPercent: 0, LithiumPercent: 8, NickelPercent: 0, LeadPercent: 0},
			PerformanceDurability: passport.PerformanceDurability{RatedCapacityAh: 500, ExpectedCycleLife: 6000, WarrantyYears: 12},
			CollectionTakeback:    passport.CollectionTakeback{TakebackSchemeName: "Acme Industrial Recovery", Instructions: "Contact logistics for palletized freight return."},
			DueDiligence:          passport.DueDiligence{PolicyReference: "ACME-DD-2025-03", LastAuditDate: "2025-09-30"},
			DismantlingSecondLife: passport.DismantlingSecondLife{DismantlingInstructions: "Rack-mounted; isolate before extraction.", SecondLifeSuitability: "Suitable for microgrid reuse."},
		},
	},
	{
		target:            passport.StatusDraft,
		rejectedFirst:     true,
		certificationNote: "Missing due diligence audit trail for cobalt sourcing — resubmit with updated documentation.",
		data: passport.BatteryData{
			ProductIdentifier:     passport.ProductIdentifier{BatteryModel: "PocketVolt Mini", SerialOrBatch: "PV-MINI-2290", BatteryCategory: "portable"},
			ManufacturerInfo:      passport.ManufacturerInfo{Name: "Acme Battery Co.", EURegistrationID: "EU-REG-88213", ManufacturingSite: "Shenzhen, China"},
			MaterialsComposition:  passport.MaterialsComposition{Chemistry: "NiMH", CriticalRawMaterials: []string{"Nickel"}, HazardousSubstances: []string{"Cadmium trace"}},
			CarbonFootprint:       passport.CarbonFootprint{TotalKgCO2Equivalent: 3.2, MethodologyReference: "PEFCR Batteries v1.2"},
			RecycledContent:       passport.RecycledContent{CobaltPercent: 0, LithiumPercent: 0, NickelPercent: 9, LeadPercent: 0},
			PerformanceDurability: passport.PerformanceDurability{RatedCapacityAh: 2.5, ExpectedCycleLife: 500, WarrantyYears: 2},
			CollectionTakeback:    passport.CollectionTakeback{TakebackSchemeName: "Retail Battery Drop Box", Instructions: "Deposit at any participating retailer collection point."},
			DueDiligence:          passport.DueDiligence{PolicyReference: "ACME-DD-2025-04", LastAuditDate: "2025-06-01"},
			DismantlingSecondLife: passport.DismantlingSecondLife{DismantlingInstructions: "Manual cell separation.", SecondLifeSuitability: "Not suitable for second life."},
		},
	},
	{
		target:            passport.StatusCertified,
		certificationNote: "Materials and durability data verified against supplier documentation.",
		data: passport.BatteryData{
			ProductIdentifier:     passport.ProductIdentifier{BatteryModel: "CellMatrix 4680", SerialOrBatch: "CM-4680-3301", BatteryCategory: "EV"},
			ManufacturerInfo:      passport.ManufacturerInfo{Name: "Acme Battery Co.", EURegistrationID: "EU-REG-88213", ManufacturingSite: "Gothenburg, Sweden"},
			MaterialsComposition:  passport.MaterialsComposition{Chemistry: "NMC", CriticalRawMaterials: []string{"Cobalt", "Lithium", "Nickel", "Manganese"}, HazardousSubstances: []string{"Electrolyte solvent"}},
			CarbonFootprint:       passport.CarbonFootprint{TotalKgCO2Equivalent: 66.7, MethodologyReference: "PEFCR Batteries v1.2"},
			RecycledContent:       passport.RecycledContent{CobaltPercent: 22, LithiumPercent: 6, NickelPercent: 16, LeadPercent: 0},
			PerformanceDurability: passport.PerformanceDurability{RatedCapacityAh: 75, ExpectedCycleLife: 2000, WarrantyYears: 10},
			CollectionTakeback:    passport.CollectionTakeback{TakebackSchemeName: "Acme Reclaim Network", Instructions: "Return to any authorized Acme service center."},
			DueDiligence:          passport.DueDiligence{PolicyReference: "ACME-DD-2025-05", LastAuditDate: "2025-12-01"},
			DismantlingSecondLife: passport.DismantlingSecondLife{DismantlingInstructions: "Cylindrical cell format; use certified discharge fixture.", SecondLifeSuitability: "Suitable for stationary storage after 80% SOH."},
		},
	},
	{
		target:            passport.StatusCertified,
		certificationNote: "Compliant with EU Battery Regulation Article 10 durability requirements.",
		data: passport.BatteryData{
			ProductIdentifier:     passport.ProductIdentifier{BatteryModel: "FleetPack 350", SerialOrBatch: "FP-350-0456", BatteryCategory: "industrial"},
			ManufacturerInfo:      passport.ManufacturerInfo{Name: "Acme Battery Co.", EURegistrationID: "EU-REG-88213", ManufacturingSite: "Wrocław, Poland"},
			MaterialsComposition:  passport.MaterialsComposition{Chemistry: "LFP", CriticalRawMaterials: []string{"Lithium", "Graphite"}, HazardousSubstances: []string{}},
			CarbonFootprint:       passport.CarbonFootprint{TotalKgCO2Equivalent: 210.3, MethodologyReference: "PEFCR Batteries v1.2"},
			RecycledContent:       passport.RecycledContent{CobaltPercent: 0, LithiumPercent: 7, NickelPercent: 0, LeadPercent: 0},
			PerformanceDurability: passport.PerformanceDurability{RatedCapacityAh: 350, ExpectedCycleLife: 5500, WarrantyYears: 10},
			CollectionTakeback:    passport.CollectionTakeback{TakebackSchemeName: "Acme Industrial Recovery", Instructions: "Contact logistics for palletized freight return."},
			DueDiligence:          passport.DueDiligence{PolicyReference: "ACME-DD-2025-06", LastAuditDate: "2025-11-20"},
			DismantlingSecondLife: passport.DismantlingSecondLife{DismantlingInstructions: "Rack-mounted; isolate before extraction.", SecondLifeSuitability: "Suitable for microgrid reuse."},
		},
	},
	{
		target:            passport.StatusPublished,
		certificationNote: "Full compliance dossier reviewed and approved.",
		data: passport.BatteryData{
			ProductIdentifier:     passport.ProductIdentifier{BatteryModel: "UrbanRide L100", SerialOrBatch: "UR-L100-0032", BatteryCategory: "LMT"},
			ManufacturerInfo:      passport.ManufacturerInfo{Name: "Acme Battery Co.", EURegistrationID: "EU-REG-88213", ManufacturingSite: "Tilburg, Netherlands"},
			MaterialsComposition:  passport.MaterialsComposition{Chemistry: "LFP", CriticalRawMaterials: []string{"Lithium"}, HazardousSubstances: []string{}},
			CarbonFootprint:       passport.CarbonFootprint{TotalKgCO2Equivalent: 19.8, MethodologyReference: "PEFCR Batteries v1.2"},
			RecycledContent:       passport.RecycledContent{CobaltPercent: 0, LithiumPercent: 5, NickelPercent: 0, LeadPercent: 0},
			PerformanceDurability: passport.PerformanceDurability{RatedCapacityAh: 10, ExpectedCycleLife: 2200, WarrantyYears: 5},
			CollectionTakeback:    passport.CollectionTakeback{TakebackSchemeName: "UrbanRide Trade-In", Instructions: "Drop off at any partner e-bike retailer."},
			DueDiligence:          passport.DueDiligence{PolicyReference: "ACME-DD-2025-07", LastAuditDate: "2025-08-18"},
			DismantlingSecondLife: passport.DismantlingSecondLife{DismantlingInstructions: "Remove BMS before shredding.", SecondLifeSuitability: "Not recommended for second life."},
		},
	},
	{
		target:            passport.StatusAmended,
		certificationNote: "Approved after initial review.",
		data: passport.BatteryData{
			ProductIdentifier:     passport.ProductIdentifier{BatteryModel: "PowerCell X0", SerialOrBatch: "PC-X0-0001", BatteryCategory: "EV"},
			ManufacturerInfo:      passport.ManufacturerInfo{Name: "Acme Battery Co.", EURegistrationID: "EU-REG-88213", ManufacturingSite: "Gothenburg, Sweden"},
			MaterialsComposition:  passport.MaterialsComposition{Chemistry: "NMC", CriticalRawMaterials: []string{"Cobalt", "Lithium", "Nickel"}, HazardousSubstances: []string{"Electrolyte solvent"}},
			CarbonFootprint:       passport.CarbonFootprint{TotalKgCO2Equivalent: 60.2, MethodologyReference: "PEFCR Batteries v1.2"},
			RecycledContent:       passport.RecycledContent{CobaltPercent: 15, LithiumPercent: 4, NickelPercent: 11, LeadPercent: 0},
			PerformanceDurability: passport.PerformanceDurability{RatedCapacityAh: 70, ExpectedCycleLife: 1700, WarrantyYears: 8},
			CollectionTakeback:    passport.CollectionTakeback{TakebackSchemeName: "Acme Reclaim Network", Instructions: "Return to any authorized Acme service center."},
			DueDiligence:          passport.DueDiligence{PolicyReference: "ACME-DD-2024-11", LastAuditDate: "2025-01-15"},
			DismantlingSecondLife: passport.DismantlingSecondLife{DismantlingInstructions: "Disconnect HV interlock before module removal.", SecondLifeSuitability: "Suitable for stationary storage after 80% SOH."},
		},
	},
	{
		target:            passport.StatusEndOfLife,
		certificationNote: "Approved — legacy chemistry, monitor for phase-out.",
		data: passport.BatteryData{
			ProductIdentifier:     passport.ProductIdentifier{BatteryModel: "LegacyCell A1", SerialOrBatch: "LC-A1-9001", BatteryCategory: "portable"},
			ManufacturerInfo:      passport.ManufacturerInfo{Name: "Acme Battery Co.", EURegistrationID: "EU-REG-88213", ManufacturingSite: "Turin, Italy"},
			MaterialsComposition:  passport.MaterialsComposition{Chemistry: "LeadAcid", CriticalRawMaterials: []string{"Lead"}, HazardousSubstances: []string{"Lead", "Sulfuric acid"}},
			CarbonFootprint:       passport.CarbonFootprint{TotalKgCO2Equivalent: 12.4, MethodologyReference: "PEFCR Batteries v1.2"},
			RecycledContent:       passport.RecycledContent{CobaltPercent: 0, LithiumPercent: 0, NickelPercent: 0, LeadPercent: 65},
			PerformanceDurability: passport.PerformanceDurability{RatedCapacityAh: 45, ExpectedCycleLife: 400, WarrantyYears: 3},
			CollectionTakeback:    passport.CollectionTakeback{TakebackSchemeName: "Retail Battery Drop Box", Instructions: "Deposit at any participating retailer collection point — mandatory take-back for lead-acid."},
			DueDiligence:          passport.DueDiligence{PolicyReference: "ACME-DD-2023-02", LastAuditDate: "2024-05-10"},
			DismantlingSecondLife: passport.DismantlingSecondLife{DismantlingInstructions: "Drain acid before crushing; lead smelter recovery.", SecondLifeSuitability: "Not suitable — end of life only."},
		},
	},
}
