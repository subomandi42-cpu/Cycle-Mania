import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, Stack } from "expo-router";
import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BikeSprite } from "@/components/BikeSprite";
import { GameButton } from "@/components/GameButton";
import {
  MAX_LEVEL,
  UPGRADE_INFO,
  UpgradeKey,
  deriveStats,
  upgradeCost,
} from "@/constants/game";
import { useGame } from "@/contexts/GameContext";
import { useColors } from "@/hooks/useColors";

const KEYS: UpgradeKey[] = ["tires", "frame", "gear"];

export default function GarageScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { state, buyUpgrade } = useGame();
  const stats = deriveStats(state.upgrades);

  const webBotPad = Platform.OS === "web" ? 34 : 0;

  return (
    <View style={[{ flex: 1 }, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 12 + (Platform.OS === "web" ? 67 : 0),
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
              GARAGE
            </Text>
            <Text style={[styles.title, { color: colors.foreground }]}>
              Tune Your Ride
            </Text>
          </View>
          <View
            style={[
              styles.coinChip,
              { backgroundColor: colors.primary, borderRadius: 999 },
            ]}
          >
            <Feather name="circle" size={14} color={colors.primaryForeground} />
            <Text
              style={[
                styles.coinChipText,
                { color: colors.primaryForeground },
              ]}
            >
              {state.coins}
            </Text>
          </View>
        </View>

        {/* Bike preview card */}
        <View
          style={[
            styles.preview,
            { borderColor: colors.border, borderRadius: 24 },
          ]}
        >
          <LinearGradient
            colors={["#1a2150", "#070b1f"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <View
            style={{
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 18,
            }}
          >
            <BikeSprite size={170} color={colors.primary} frame="#fff" />
          </View>
          <View style={styles.previewStats}>
            <PreviewStat
              label="Top Speed"
              value={`${Math.round(stats.maxSpeed)}`}
              unit="km/h"
            />
            <PreviewStat
              label="Acceleration"
              value={`${stats.accel.toFixed(2)}`}
              unit="x"
            />
            <PreviewStat
              label="Grip"
              value={`${Math.round(stats.grip * 100)}`}
              unit="%"
            />
            <PreviewStat
              label="Draft Boost"
              value={`${stats.draftRecover.toFixed(2)}`}
              unit="x"
            />
          </View>
        </View>

        {/* Upgrade list */}
        <Text style={[styles.bigLabel, { color: colors.mutedForeground }]}>
          UPGRADES
        </Text>
        {KEYS.map((key) => {
          const info = UPGRADE_INFO[key];
          const lvl = state.upgrades[key];
          const maxed = lvl >= MAX_LEVEL;
          const cost = maxed ? 0 : upgradeCost(lvl);
          const canAfford = state.coins >= cost;
          return (
            <View
              key={key}
              style={[
                styles.upgrade,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View style={styles.upgradeRow}>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    backgroundColor: colors.primary + "22",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Feather
                    name={info.icon}
                    size={20}
                    color={colors.primary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.upgradeName, { color: colors.foreground }]}
                  >
                    {info.name}
                  </Text>
                  <Text
                    style={[
                      styles.upgradeSub,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    {info.subtitle}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text
                    style={[
                      styles.upgradeLevel,
                      { color: colors.foreground },
                    ]}
                  >
                    Lv {lvl}
                    <Text
                      style={{ color: colors.mutedForeground, fontSize: 12 }}
                    >
                      {" "}
                      / {MAX_LEVEL}
                    </Text>
                  </Text>
                </View>
              </View>

              {/* Level pips */}
              <View style={styles.pips}>
                {Array.from({ length: MAX_LEVEL }).map((_, i) => (
                  <View
                    key={i}
                    style={{
                      flex: 1,
                      height: 6,
                      borderRadius: 999,
                      backgroundColor:
                        i < lvl ? colors.primary : colors.muted,
                    }}
                  />
                ))}
              </View>

              <GameButton
                label={
                  maxed
                    ? "Maxed Out"
                    : canAfford
                      ? `Upgrade — ${cost} coins`
                      : `Need ${cost - state.coins} more`
                }
                icon={maxed ? "check" : canAfford ? "arrow-up" : "lock"}
                disabled={maxed || !canAfford}
                variant={maxed || !canAfford ? "secondary" : "primary"}
                onPress={() => {
                  if (maxed) return;
                  buyUpgrade(key, cost);
                }}
                style={{ marginTop: 12 }}
              />
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

function PreviewStat({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <View style={styles.previewStat}>
      <Text style={styles.previewStatLabel}>{label}</Text>
      <Text style={styles.previewStatVal}>
        {value}
        <Text style={styles.previewStatUnit}> {unit}</Text>
      </Text>
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
  coinChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  coinChipText: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
  },
  preview: {
    borderWidth: 1,
    overflow: "hidden",
    paddingBottom: 16,
  },
  previewStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingHorizontal: 16,
    marginTop: 4,
  },
  previewStat: {
    flexBasis: "47%",
    flexGrow: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  previewStatLabel: {
    color: "#bcc4e8",
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  previewStatVal: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    marginTop: 4,
  },
  previewStatUnit: {
    fontSize: 11,
    color: "#bcc4e8",
    fontFamily: "Inter_500Medium",
  },
  bigLabel: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 2.5,
    marginTop: 8,
  },
  upgrade: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
  },
  upgradeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  upgradeName: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  upgradeSub: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    marginTop: 2,
  },
  upgradeLevel: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  pips: {
    flexDirection: "row",
    gap: 6,
    marginTop: 12,
  },
});
