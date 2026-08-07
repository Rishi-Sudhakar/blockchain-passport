import { useRouter } from "expo-router";
import { BatteryWizardForm } from "@/components/passport/wizard/BatteryWizardForm";
import { passportApi } from "@/lib/api/resources";
import { defaultBatteryData } from "@/lib/validation/battery";

export default function NewPassportScreen() {
  const router = useRouter();

  return (
    <BatteryWizardForm
      title="New passport"
      initialValues={defaultBatteryData()}
      submitLabel="Create draft"
      onSubmit={async (values) => {
        const { passport } = await passportApi.create({ category: "battery", data: values });
        router.replace(`/(tabs)/passports/${passport.id}`);
      }}
    />
  );
}
