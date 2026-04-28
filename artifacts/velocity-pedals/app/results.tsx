import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, Stack, useLocalSearchParams } from "expo-router";
import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GameButton } from "@/components/GameButton";
import { TRACKS, TrackId } from "@/constants/game";
import { useColors } from "@/hooks/useColors";

function fmt(t: number) {
  if (!isFinite(t)) return "—";
  const m = Math.floor(t / 60);
  const s = (t - m * 60).toFixed(2);
  return m > 0 ? `${m}:${s.padStart(5, "0")}` : `${s}s`;
}

export default function ResultsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    track?: string;
    mode?: string;
    finished?: string;
    time?: string;
    distance?: string;
    coins?: string;
    bonus?: string;
    best?: string;
    advanced?: string;
  }>();

  const trackId = (params.track as TrackId) ?? "urban";
  const track = TRACKS[trackId];
  const mode = params.mode ?? "quick";
  const finished = params.finished === "1";
  const time = Number(params.time ?? 0);
  const distance = Number(params.distance ?? 0);
  const coins = Number(params.coins ?? 0);
  const bonus = Number(params.bonus ?? 0);
  const best = params.best === "1";
  const advanced = params.advanced === "1";

  const total = coins + bonus;
  const webBotPad = Platform.OS === "web" ? 34 : 0;

  return (
    <View
      style={[styles.root, { backgroundColor: colors.background }]}
      pointerEvents="box-none"
    >
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={[track.skyTop + "55", colors.background]}
        style={StyleSheet.absoluteFill}
      />
      <View
        style={{
          flex: 1,
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 24 + webBotPad,
          paddingHorizontal: 24,
          justifyContent: "space-between",
        }}
      >
        <View style={{ alignItems: "center", marginTop: 24 }}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 999,
              backgroundColor: finished ? track.accent : colors.destructive,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 18,
            }}
          >
            <Feather
              name={finished ? "award" : "x"}
              size={40}
              color="#070b1f"
            />
          </View>
          <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>
            {track.name.toUpperCase()}
          </Text>
          <Text style={[styles.title, { color: colors.foreground }]}>
            {finished ? "Race Complete" : "Race Abandoned"}
          </Text>
          {best && finished && (
            <View
              style={[
                styles.bestBadge,
                { backgroundColor: track.accent + "30", borderColor: track.accent },
              ]}
            >
              <Feather name="trending-up" size={12} color={track.accent} />
              <Text style={[styles.bestBadgeText, { color: track.accent }]}>
                NEW BEST TIME
              </Text>
            </View>
          )}
          {advanced && (
            <View
              style={[
                styles.bestBadge,
                {
                  backgroundColor: colors.primary + "30",
                  borderColor: colors.primary,
                  marginTop: 8,
                },
              ]}
            >
              <Feather name="check" size={12} color={colors.primary} />
              <Text
                style={[styles.bestBadgeText, { color: colors.primary }]}
              >
                CAREER STAGE CLEARED
              </Text>
            </View>
          )}
        </View>

        <View style={{ gap: 10 }}>
          <ResultRow
            label="Time"
            value={fmt(time)}
            icon="clock"
            highlight={best}
          />
          <ResultRow
            label="Distance"
            value={`${distance} m`}
            icon="map"
          />
          <ResultRow
            label="Coins Collected"
            value={`${coins}`}
            icon="circle"
          />
          {bonus > 0 && (
            <ResultRow
              label="Career Bonus"
              value={`+${bonus}`}
              icon="award"
              highlight
            />
          )}
          <View
            style={[
              styles.totalRow,
              { backgroundColor: colors.primary, borderRadius: 18 },
            ]}
          >
            <Text
              style={[styles.totalLabel, { color: colors.primaryForeground }]}
            >
              EARNED
            </Text>
            <Text
              style={[styles.totalValue, { color: colors.primaryForeground }]}
            >
              +{total}
            </Text>
          </View>
        </View>

        <View style={{ gap: 10 }}>
          <GameButton
            label="Race Again"
            icon="rotate-cw"
            size="lg"
            onPress={() =>
              router.replace({
                pathname: "/race",
                params: { track: trackId, mode },
              })
            }
          />
          <GameButton
            label="Garage"
            icon="settings"
            variant="secondary"
            onPress={() => router.replace("/garage")}
          />
          <GameButton
            label="Home"
            icon="home"
            variant="ghost"
            onPress={() => router.replace("/")}
          />
        </View>
      </View>
    </View>
  );
}

function ResultRow({
  label,
  value,
  icon,
  highlight,
}: {
  label: string;
  value: string;
  icon: keyof typeof Feather.glyphMap;
  highlight?: boolean;
}) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: colors.card,
          borderColor: highlight ? colors.primary : colors.border,
          borderRadius: 14,
        },
      ]}
    >
      <Feather
        name={icon}
        size={16}
        color={highlight ? colors.primary : colors.mutedForeground}
      />
      <Text style={[styles.rowLabel, { color: colors.mutedForeground }]}>
        {label}
      </Text>
      <Text style={[styles.rowVal, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  eyebrow: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 3,
  },
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    marginTop: 6,
    letterSpacing: -0.5,
  },
  bestBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 14,
  },
  bestBadgeText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
    borderWidth: 1,
  },
  rowLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  rowVal: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginTop: 6,
  },
  totalLabel: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    letterSpacing: 2,
  },
  totalValue: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
  },
});
