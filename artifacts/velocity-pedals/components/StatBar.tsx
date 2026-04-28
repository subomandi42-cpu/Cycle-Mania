import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

type Props = {
  label: string;
  value: number;
  max: number;
  color: string;
  icon: keyof typeof Feather.glyphMap;
  pulsing?: boolean;
};

export function StatBar({ label, value, max, color, icon, pulsing }: Props) {
  const colors = useColors();
  const pct = Math.max(0, Math.min(1, value / max));
  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Feather name={icon} size={11} color={colors.mutedForeground} />
        <Text style={[styles.label, { color: colors.mutedForeground }]}>
          {label}
        </Text>
        <Text style={[styles.val, { color: colors.foreground }]}>
          {Math.round(value)}
        </Text>
      </View>
      <View
        style={[
          styles.track,
          { backgroundColor: colors.muted, borderRadius: 999 },
        ]}
      >
        <View
          style={{
            width: `${pct * 100}%`,
            height: "100%",
            backgroundColor: color,
            borderRadius: 999,
            opacity: pulsing && pct < 0.25 ? 0.65 : 1,
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, gap: 4 },
  head: { flexDirection: "row", alignItems: "center", gap: 5 },
  label: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  val: {
    marginLeft: "auto",
    fontSize: 12,
    fontFamily: "Inter_700Bold",
  },
  track: {
    height: 6,
    overflow: "hidden",
  },
});
