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
    },
    secondary: {
      bg: colors.secondary,
      text: colors.secondaryForeground,
      border: colors.border,
    },
    ghost: {
      bg: "transparent",
      text: colors.foreground,
      border: colors.border,
    },
  }[variant];

  const sizing = {
    md: { paddingV: 14, paddingH: 18, font: 15, iconSize: 18 },
    lg: { paddingV: 20, paddingH: 22, font: 17, iconSize: 22 },
  }[size];

  const handlePress = () => {
    if (disabled || loading) return;
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    onPress?.();
  };

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
          borderRadius: colors.radius,
          paddingVertical: sizing.paddingV,
          paddingHorizontal: sizing.paddingH,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
          transform: pressed ? [{ scale: 0.98 }] : undefined,
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
