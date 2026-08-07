import type { StyleProp, ViewStyle } from "react-native";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { brutal, colors, radii } from "@/theme/tokens";

interface TextFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  keyboardType?: "default" | "numeric" | "decimal-pad" | "email-address";
  autoCapitalize?: "none" | "sentences" | "words";
  multiline?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  keyboardType = "default",
  autoCapitalize = "sentences",
  multiline,
  style,
}: TextFieldProps) {
  return (
    <View style={[{ gap: 6 }, style]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.ink3}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        multiline={multiline}
        style={[
          styles.input,
          multiline && { height: 90, textAlignVertical: "top", paddingTop: 12 },
          error && { borderColor: colors.danger },
        ]}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: "700", color: colors.ink2 },
  input: {
    height: 50,
    borderRadius: radii.md,
    borderWidth: brutal.borderWidth,
    borderColor: colors.border,
    backgroundColor: colors.bg1,
    paddingHorizontal: 16,
    fontSize: 15,
    fontWeight: "600",
    color: colors.ink0,
  },
  error: { fontSize: 12, fontWeight: "700", color: colors.danger },
});
