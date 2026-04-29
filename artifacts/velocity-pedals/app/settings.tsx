import { Feather } from "@expo/vector-icons";
import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";
import { router, Stack } from "expo-router";
import React from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GameButton } from "@/components/GameButton";
import { CAREER_STAGES } from "@/constants/game";
import { useGame } from "@/contexts/GameContext";
import { useColors } from "@/hooks/useColors";

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { state, reset } = useGame();

  const webTopPad = Platform.OS === "web" ? 67 : 0;
  const webBotPad = Platform.OS === "web" ? 34 : 0;

  const version =
    (Constants.expoConfig?.version as string | undefined) ?? "1.0.0";

  const careerLabel =
    state.careerStage >= CAREER_STAGES.length
      ? "All stages cleared"
      : `Stage ${state.careerStage + 1} of ${CAREER_STAGES.length}`;

  const performReset = () => {
    reset();
    router.replace("/");
  };

  const handleReset = () => {
    if (Platform.OS === "web") {
      const ok =
        typeof window !== "undefined" &&
        window.confirm(
          "Reset save data?\n\nThis wipes your coins, upgrades, paint colors, career progress and best times. This cannot be undone.",
        );
      if (ok) performReset();
      return;
    }
    Alert.alert(
      "Reset save data?",
      "This wipes your coins, upgrades, paint colors, career progress and best times. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Reset", style: "destructive", onPress: performReset },
      ],
    );
  };

  return (
    <View style={[{ flex: 1 }, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 12 + webTopPad,
          paddingBottom: insets.bottom + 32 + webBotPad,
          paddingHorizontal: 18,
          gap: 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headRow}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backBtn,
              {
                borderColor: colors.border,
                backgroundColor: pressed ? colors.secondary : "transparent",
              },
            ]}
            hitSlop={8}
          >
            <Feather name="arrow-left" size={18} color={colors.foreground} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>
              SETTINGS
            </Text>
            <Text style={[styles.title, { color: colors.foreground }]}>
              App & Save Data
            </Text>
          </View>
        </View>

        {/* Save data summary */}
        <View
          style={[
            styles.card,
            {
              borderColor: colors.border,
              borderRadius: 24,
              overflow: "hidden",
            },
          ]}
        >
          <LinearGradient
            colors={["#1a2150", "#070b1f"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={{ padding: 18 }}>
            <Text style={styles.cardLabel}>YOUR PROGRESS</Text>
            <Text style={styles.cardTitle}>Save Data</Text>

            <View style={styles.statGrid}>
              <Stat label="Coins" value={`${state.coins}`} icon="circle" />
              <Stat
                label="Distance"
                value={`${(state.totalDistance / 1000).toFixed(1)} km`}
                icon="map"
              />
              <Stat
                label="Races"
                value={`${state.totalRaces}`}
                icon="award"
              />
              <Stat
                label="Career"
                value={careerLabel}
                icon="flag"
                small
              />
              <Stat
                label="Paint Colors"
                value={`${state.ownedColors.length} owned`}
                icon="droplet"
              />
              <Stat
                label="Upgrades"
                value={`${state.upgrades.tires + state.upgrades.frame + state.upgrades.gear} / 15 lvl`}
                icon="trending-up"
                small
              />
            </View>
          </View>
        </View>

        {/* Reset card */}
        <View
          style={[
            styles.dangerCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.dangerHead}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: "#ff2d9222",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Feather name="trash-2" size={20} color="#ff2d92" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.dangerTitle, { color: colors.foreground }]}>
                Reset Save
              </Text>
              <Text
                style={[
                  styles.dangerSub,
                  { color: colors.mutedForeground },
                ]}
              >
                Wipes coins, upgrades, paint colors, career and best times.
                Cannot be undone.
              </Text>
            </View>
          </View>
          <GameButton
            label="Reset Save Data"
            icon="rotate-ccw"
            variant="secondary"
            onPress={handleReset}
            style={{ marginTop: 14 }}
          />
        </View>

        {/* About */}
        <View
          style={[
            styles.aboutCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.aboutRow}>
            <Text style={[styles.aboutLabel, { color: colors.mutedForeground }]}>
              App
            </Text>
            <Text style={[styles.aboutValue, { color: colors.foreground }]}>
              Velocity Pedals
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.aboutRow}>
            <Text style={[styles.aboutLabel, { color: colors.mutedForeground }]}>
              Version
            </Text>
            <Text style={[styles.aboutValue, { color: colors.foreground }]}>
              {version}
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.aboutRow}>
            <Text style={[styles.aboutLabel, { color: colors.mutedForeground }]}>
              Platform
            </Text>
            <Text style={[styles.aboutValue, { color: colors.foreground }]}>
              {Platform.OS === "web"
                ? "Web preview"
                : Platform.OS === "ios"
                  ? "iOS"
                  : "Android"}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function Stat({
  label,
  value,
  icon,
  small,
}: {
  label: string;
  value: string;
  icon: keyof typeof Feather.glyphMap;
  small?: boolean;
}) {
  return (
    <View style={styles.statBox}>
      <View style={styles.statHead}>
        <Feather name={icon} size={11} color="#bcc4e8" />
        <Text style={styles.statLabel}>{label}</Text>
      </View>
      <Text style={[styles.statValue, small && { fontSize: 13 }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  headRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 4,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  eyebrow: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 2.5,
  },
  title: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    marginTop: 2,
  },
  card: {
    borderWidth: 1,
  },
  cardLabel: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 2.5,
    color: "#bcc4e8",
  },
  cardTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: "#ffffff",
    marginTop: 4,
    marginBottom: 14,
  },
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statBox: {
    flexBasis: "47%",
    flexGrow: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  statHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.4,
    color: "#bcc4e8",
    textTransform: "uppercase",
  },
  statValue: {
    color: "#ffffff",
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    marginTop: 4,
  },
  dangerCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
  },
  dangerHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dangerTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  dangerSub: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    marginTop: 2,
    lineHeight: 17,
  },
  aboutCard: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  aboutRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  aboutLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  aboutValue: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  divider: {
    height: 1,
    opacity: 0.5,
  },
});
