import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { brutal, colors } from "@/theme/tokens";

interface ChipSelectProps {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}

export function ChipSelect({ label, options, value, onChange }: ChipSelectProps) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.label}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <TouchableOpacity
              key={opt.value}
              onPress={() => onChange(opt.value)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt.label.toUpperCase()}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: "700", color: colors.ink2 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: brutal.borderWidth - 0.5,
    borderColor: colors.border,
    backgroundColor: colors.bg1,
  },
  chipActive: {
    backgroundColor: colors.yellow,
  },
  chipText: { fontSize: 12, fontWeight: "800", color: colors.ink1 },
  chipTextActive: { color: colors.yellowInk },
});
