import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";

import { useColors } from "@/hooks/useColors";

type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "lg";

type Props = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  icon?: keyof typeof Feather.glyphMap;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  testID?: string;
};

export function GameButton({
  label,
  onPress,
  variant = "primary",
  size = "md",
  icon,
  disabled,
  loading,
  style,
  testID,
}: Props) {
  const colors = useColors();

  const palette = {
    primary: {
      bg: colors.primary,
      text: colors.primaryForeground,
      border: colors.primary,
      shadow: "#7fbf00",
      glow: "rgba(198,255,58,0.45)",
    },
    secondary: {
      bg: colors.secondary,
      text: colors.secondaryForeground,
      border: colors.border,
      shadow: "#0a0e27",
      glow: "rgba(10,14,39,0.55)",
    },
    ghost: {
      bg: "transparent",
      text: colors.foreground,
      border: colors.border,
      shadow: "transparent",
      glow: "transparent",
    },
  }[variant];

  const sizing = {
    md: { paddingV: 14, paddingH: 18, font: 15, iconSize: 18, radius: 18 },
    lg: { paddingV: 20, paddingH: 22, font: 17, iconSize: 22, radius: 22 },
  }[size];

  const handlePress = () => {
    if (disabled || loading) return;
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    onPress?.();
  };

  // Gamey "raised plate" shadow: a hard color offset (the chunky 3D base)
  // plus a soft drop shadow for ambient depth. On press we collapse the
  // hard offset and translate the button down to feel satisfying.
  const restingShadow =
    variant === "ghost"
      ? "none"
      : `0px 4px 0px ${palette.shadow}, 0px 8px 14px ${palette.glow}`;
  const pressedShadow =
    variant === "ghost"
      ? "none"
      : `0px 1px 0px ${palette.shadow}, 0px 2px 4px ${palette.glow}`;

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      testID={testID}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: palette.bg,
          borderColor: palette.border,
          borderRadius: sizing.radius,
          paddingVertical: sizing.paddingV,
          paddingHorizontal: sizing.paddingH,
          opacity: disabled ? 0.55 : 1,
          transform: pressed
            ? [{ translateY: 3 }, { scale: 0.99 }]
            : undefined,
          // boxShadow is supported on web + RN 0.76+. We keep elevation as a
          // safe Android fallback so the depth still reads on older devices.
          boxShadow: pressed ? pressedShadow : restingShadow,
          elevation: variant === "ghost" ? 0 : pressed ? 1 : 4,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.text} />
      ) : (
        <View style={styles.row}>
          {icon ? (
            <Feather
              name={icon}
              size={sizing.iconSize}
              color={palette.text}
              style={{ marginRight: 8 }}
            />
          ) : null}
          <Text
            style={{
              color: palette.text,
              fontFamily: "Inter_700Bold",
              fontSize: sizing.font,
              letterSpacing: 0.5,
            }}
          >
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
});
