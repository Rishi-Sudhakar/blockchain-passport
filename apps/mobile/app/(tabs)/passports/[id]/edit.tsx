import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { BatteryWizardForm } from "@/components/passport/wizard/BatteryWizardForm";
import { usePassport, usePassportTransition } from "@/lib/api/hooks";
import { passportApi } from "@/lib/api/resources";
import type { BatteryData } from "@/lib/api/types";
import { colors } from "@/theme/tokens";

export default function EditPassportScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading } = usePassport(id);
  const transition = usePassportTransition(id);

  if (isLoading || !data) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.accentTeal} />
      </View>
    );
  }

  const { passport, versions } = data;
  const currentData = versions.at(-1)?.data as BatteryData;
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
        router.replace(`/(tabs)/passports/${id}`);
      }}
    />
  );
}
