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
  BIKE_COLOR_ORDER,
  BIKE_COLORS,
  BikeColorId,
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
  const {
    state,
    buyUpgrade,
    buyBikeColor,
    selectBikeColor,
    selectedColorHex,
  } = useGame();
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
            <BikeSprite size={170} color={selectedColorHex} frame="#fff" />
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

        {/* Paint Shop */}
        <Text style={[styles.bigLabel, { color: colors.mutedForeground }]}>
          PAINT SHOP
        </Text>
        <View style={styles.colorGrid}>
          {BIKE_COLOR_ORDER.map((id) => (
            <PaintCard
              key={id}
              id={id}
              owned={state.ownedColors.includes(id)}
              selected={state.selectedColor === id}
              coins={state.coins}
              onBuy={() => buyBikeColor(id)}
              onEquip={() => selectBikeColor(id)}
            />
          ))}
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

function PaintCard({
  id,
  owned,
  selected,
  coins,
  onBuy,
  onEquip,
}: {
  id: BikeColorId;
  owned: boolean;
  selected: boolean;
  coins: number;
  onBuy: () => void;
  onEquip: () => void;
}) {
  const colors = useColors();
  const def = BIKE_COLORS[id];
  const canAfford = coins >= def.cost;

  return (
    <View
      style={[
        styles.colorCard,
        {
          backgroundColor: colors.card,
          borderColor: selected ? def.color : colors.border,
          borderWidth: selected ? 2 : 1,
        },
      ]}
    >
      {selected && (
        <View
          style={[
            styles.selectedBadge,
            {
              backgroundColor: def.color,
            },
          ]}
        >
          <Feather name="check" size={10} color="#070b1f" />
          <Text style={styles.selectedBadgeText}>EQUIPPED</Text>
        </View>
      )}

      <View
        style={[
          styles.swatch,
          { backgroundColor: "#0a0e27", borderColor: def.color },
        ]}
      >
        <BikeSprite size={66} color={def.color} frame="#fff" />
      </View>

      <Text style={[styles.colorName, { color: colors.foreground }]}>
        {def.name}
      </Text>

      {owned ? (
        selected ? (
          <View
            style={[
              styles.colorChipNeutral,
              { backgroundColor: colors.muted, borderColor: colors.border },
            ]}
          >
            <Feather name="check" size={11} color={colors.mutedForeground} />
            <Text
              style={[styles.colorChipText, { color: colors.mutedForeground }]}
            >
              In use
            </Text>
          </View>
        ) : (
          <Pressable
            onPress={onEquip}
            style={({ pressed }) => [
              styles.equipBtn,
              {
                backgroundColor: def.color,
                opacity: pressed ? 0.85 : 1,
                transform: pressed ? [{ scale: 0.98 }] : undefined,
              },
            ]}
          >
            <Feather name="check-circle" size={13} color="#070b1f" />
            <Text style={styles.equipBtnText}>Equip</Text>
          </Pressable>
        )
      ) : def.cost === 0 ? (
        <View
          style={[
            styles.colorChipNeutral,
            { backgroundColor: colors.muted, borderColor: colors.border },
          ]}
        >
          <Feather name="gift" size={11} color={colors.mutedForeground} />
          <Text
            style={[styles.colorChipText, { color: colors.mutedForeground }]}
          >
            Free
          </Text>
        </View>
      ) : (
        <Pressable
          onPress={canAfford ? onBuy : undefined}
          disabled={!canAfford}
          style={({ pressed }) => [
            styles.buyBtn,
            {
              backgroundColor: canAfford ? def.color : colors.muted,
              borderColor: canAfford ? def.color : colors.border,
              opacity: !canAfford ? 0.7 : pressed ? 0.85 : 1,
              transform: pressed ? [{ scale: 0.98 }] : undefined,
            },
          ]}
        >
          <Feather
            name={canAfford ? "shopping-bag" : "lock"}
            size={13}
            color={canAfford ? "#070b1f" : colors.mutedForeground}
          />
          <Text
            style={[
              styles.buyBtnText,
              { color: canAfford ? "#070b1f" : colors.mutedForeground },
            ]}
          >
            {canAfford
              ? `${def.cost} coins`
              : `Need ${def.cost - coins} more`}
          </Text>
        </Pressable>
      )}
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
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  colorCard: {
    flexBasis: "48%",
    flexGrow: 1,
    borderRadius: 18,
    padding: 12,
    alignItems: "center",
    gap: 10,
    position: "relative",
  },
  selectedBadge: {
    position: "absolute",
    top: -6,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    zIndex: 1,
  },
  selectedBadgeText: {
    color: "#070b1f",
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.8,
  },
  swatch: {
    width: "100%",
    aspectRatio: 1.6,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  colorName: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  buyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    width: "100%",
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  buyBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    letterSpacing: 0.4,
  },
  equipBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    width: "100%",
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  equipBtnText: {
    color: "#070b1f",
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    letterSpacing: 0.4,
  },
  colorChipNeutral: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    width: "100%",
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  colorChipText: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    letterSpacing: 0.4,
  },
});
