import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
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

import { BannerAdSlot } from "@/components/BannerAdSlot";
import { BikeSprite } from "@/components/BikeSprite";
import { GameButton } from "@/components/GameButton";
import {
  CAREER_STAGES,
  TRACK_ORDER,
  TRACKS,
  TrackId,
  deriveStats,
} from "@/constants/game";
import { useGame } from "@/contexts/GameContext";
import { useColors } from "@/hooks/useColors";

function formatTime(t: number) {
  if (!isFinite(t)) return "—";
  const mins = Math.floor(t / 60);
  const secs = (t - mins * 60).toFixed(1);
  return mins > 0 ? `${mins}:${secs.padStart(4, "0")}` : `${secs}s`;
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { state } = useGame();
  const stats = deriveStats(state.upgrades);
  const careerStage = state.careerStage;
  const careerDone = careerStage >= CAREER_STAGES.length;
  const nextStage = careerDone ? null : CAREER_STAGES[careerStage];

  const webTopPad = Platform.OS === "web" ? 67 : 0;
  const webBotPad = Platform.OS === "web" ? 34 : 0;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 12 + webTopPad,
          paddingBottom: insets.bottom + 110 + webBotPad,
          paddingHorizontal: 18,
          gap: 18,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View
          style={[
            styles.hero,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: 24,
            },
          ]}
        >
          <LinearGradient
            colors={["#1a2150", "#070b1f"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.heroRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.heroEyebrow, { color: colors.primary }]}>
                VELOCITY PEDALS
              </Text>
              <Text style={[styles.heroTitle, { color: colors.foreground }]}>
                Race the wind.{"\n"}Master the draft.
              </Text>
              <View style={styles.heroStats}>
                <View style={styles.heroStat}>
                  <Feather name="zap" size={12} color={colors.primary} />
                  <Text
                    style={[styles.heroStatText, { color: colors.foreground }]}
                  >
                    {state.coins} coins
                  </Text>
                </View>
                <View style={styles.heroStat}>
                  <Feather name="map" size={12} color={colors.primary} />
                  <Text
                    style={[styles.heroStatText, { color: colors.foreground }]}
                  >
                    {(state.totalDistance / 1000).toFixed(1)} km
                  </Text>
                </View>
                <View style={styles.heroStat}>
                  <Feather name="award" size={12} color={colors.primary} />
                  <Text
                    style={[styles.heroStatText, { color: colors.foreground }]}
                  >
                    {state.totalRaces} races
                  </Text>
                </View>
              </View>
            </View>
            <View style={{ alignItems: "center", justifyContent: "center" }}>
              <BikeSprite size={120} color={colors.primary} frame="#fff" />
            </View>
          </View>

          <GameButton
            label={
              nextStage
                ? `Career — ${nextStage.name}`
                : "Career — All stages cleared"
            }
            icon="play"
            size="lg"
            disabled={careerDone}
            onPress={() => {
              if (!nextStage) return;
              router.push({
                pathname: "/race",
                params: {
                  track: nextStage.trackId,
                  mode: "career",
                  stage: String(careerStage),
                },
              });
            }}
            style={{ marginTop: 16 }}
          />
        </View>

        {/* Bike summary */}
        <View
          style={[
            styles.section,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.sectionHead}>
            <View>
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
                YOUR RIDE
              </Text>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Performance Profile
              </Text>
            </View>
            <Pressable
              onPress={() => router.push("/garage")}
              style={({ pressed }) => [
                styles.headBtn,
                {
                  borderColor: colors.border,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Feather name="settings" size={14} color={colors.foreground} />
              <Text style={[styles.headBtnText, { color: colors.foreground }]}>
                Garage
              </Text>
            </Pressable>
          </View>

          <View style={styles.statGrid}>
            <PerfStat
              label="Top Speed"
              value={`${Math.round(stats.maxSpeed)} km/h`}
              icon="trending-up"
            />
            <PerfStat
              label="Acceleration"
              value={`${stats.accel.toFixed(2)}x`}
              icon="fast-forward"
            />
            <PerfStat
              label="Grip"
              value={`${Math.round(stats.grip * 100)}%`}
              icon="disc"
            />
            <PerfStat
              label="Stamina Use"
              value={`${stats.sprintCost.toFixed(2)}`}
              icon="zap"
            />
          </View>
        </View>

        {/* Tracks */}
        <Text style={[styles.bigLabel, { color: colors.mutedForeground }]}>
          QUICK RACE
        </Text>
        {TRACK_ORDER.map((tid) => {
          const t = TRACKS[tid];
          const best = state.bestTimes[tid];
          return (
            <Pressable
              key={tid}
              onPress={() =>
                router.push({
                  pathname: "/race",
                  params: { track: tid, mode: "quick" },
                })
              }
              style={({ pressed }) => [
                styles.trackCard,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.card,
                  opacity: pressed ? 0.85 : 1,
                  transform: pressed ? [{ scale: 0.99 }] : undefined,
                },
              ]}
            >
              <Image
                source={t.image}
                style={StyleSheet.absoluteFillObject}
                contentFit="cover"
              />
              <LinearGradient
                colors={["transparent", "rgba(7,11,31,0.85)"]}
                style={StyleSheet.absoluteFillObject}
              />
              <View style={styles.trackContent}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.trackName]}>{t.name}</Text>
                  <Text style={styles.trackSub}>{t.subtitle}</Text>
                  <View style={styles.trackMeta}>
                    <View
                      style={[
                        styles.metaChip,
                        { backgroundColor: t.accent + "22", borderColor: t.accent },
                      ]}
                    >
                      <Feather name="flag" size={10} color={t.accent} />
                      <Text style={[styles.metaText, { color: t.accent }]}>
                        {t.distance}m
                      </Text>
                    </View>
                    <View style={styles.metaChip}>
                      <Feather
                        name={
                          t.weather === "rain"
                            ? "cloud-rain"
                            : t.weather === "wind"
                              ? "wind"
                              : "sun"
                        }
                        size={10}
                        color="#7df0ff"
                      />
                      <Text style={[styles.metaText, { color: "#7df0ff" }]}>
                        {t.weather === "clear"
                          ? "CLEAR"
                          : t.weather.toUpperCase()}
                      </Text>
                    </View>
                    {best !== undefined && (
                      <View style={styles.metaChip}>
                        <Feather name="clock" size={10} color="#ffffff" />
                        <Text style={[styles.metaText, { color: "#ffffff" }]}>
                          BEST {formatTime(best)}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 999,
                    backgroundColor: t.accent,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Feather name="play" size={22} color="#070b1f" />
                </View>
              </View>
            </Pressable>
          );
        })}

        {/* Time Trial section */}
        <View
          style={[
            styles.section,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
            TIME TRIAL
          </Text>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Beat your personal best
          </Text>
          <View style={{ gap: 8, marginTop: 12 }}>
            {TRACK_ORDER.map((tid) => {
              const t = TRACKS[tid];
              const best = state.bestTimes[tid];
              return (
                <Pressable
                  key={tid}
                  onPress={() =>
                    router.push({
                      pathname: "/race",
                      params: { track: tid, mode: "trial" },
                    })
                  }
                  style={({ pressed }) => [
                    styles.trialRow,
                    {
                      borderColor: colors.border,
                      backgroundColor: pressed
                        ? colors.secondary
                        : "transparent",
                    },
                  ]}
                >
                  <View
                    style={{
                      width: 8,
                      height: 36,
                      backgroundColor: t.accent,
                      borderRadius: 4,
                    }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[styles.trialName, { color: colors.foreground }]}
                    >
                      {t.name}
                    </Text>
                    <Text
                      style={[
                        styles.trialBest,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      Best: {best !== undefined ? formatTime(best) : "no record"}
                    </Text>
                  </View>
                  <Feather
                    name="chevron-right"
                    size={18}
                    color={colors.mutedForeground}
                  />
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Career progress */}
        <View
          style={[
            styles.section,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
            CAREER
          </Text>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            World Grand Tour
          </Text>
          <Text
            style={[styles.careerProgress, { color: colors.mutedForeground }]}
          >
            Stage {Math.min(careerStage + 1, CAREER_STAGES.length)} of{" "}
            {CAREER_STAGES.length}
          </Text>
          <View
            style={[
              styles.careerBar,
              { backgroundColor: colors.muted, borderRadius: 999 },
            ]}
          >
            <View
              style={{
                height: "100%",
                width: `${(careerStage / CAREER_STAGES.length) * 100}%`,
                backgroundColor: colors.primary,
                borderRadius: 999,
              }}
            />
          </View>
          <View style={{ gap: 6, marginTop: 12 }}>
            {CAREER_STAGES.map((s, i) => {
              const cleared = i < careerStage;
              const current = i === careerStage;
              return (
                <View
                  key={i}
                  style={[
                    styles.careerRow,
                    {
                      borderColor: current ? colors.primary : colors.border,
                      backgroundColor: current
                        ? colors.primary + "14"
                        : "transparent",
                    },
                  ]}
                >
                  <View
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 999,
                      backgroundColor: cleared
                        ? colors.primary
                        : current
                          ? colors.primary + "33"
                          : colors.muted,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {cleared ? (
                      <Feather name="check" size={14} color="#070b1f" />
                    ) : (
                      <Text
                        style={{
                          color: current
                            ? colors.primary
                            : colors.mutedForeground,
                          fontFamily: "Inter_700Bold",
                          fontSize: 11,
                        }}
                      >
                        {i + 1}
                      </Text>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: cleared || current
                          ? colors.foreground
                          : colors.mutedForeground,
                        fontFamily: "Inter_600SemiBold",
                        fontSize: 13,
                      }}
                    >
                      {s.name}
                    </Text>
                    <Text
                      style={{
                        color: colors.mutedForeground,
                        fontFamily: "Inter_500Medium",
                        fontSize: 11,
                      }}
                    >
                      {TRACKS[s.trackId].name} • +{s.reward} coins
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <View
        style={[
          styles.bannerWrap,
          {
            paddingBottom: Math.max(insets.bottom, 8) + webBotPad,
            backgroundColor: colors.background,
            borderTopColor: colors.border,
          },
        ]}
      >
        <BannerAdSlot />
      </View>
    </View>
  );
}

function PerfStat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: keyof typeof Feather.glyphMap;
}) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.perf,
        { backgroundColor: colors.secondary, borderColor: colors.border },
      ]}
    >
      <Feather name={icon} size={14} color={colors.primary} />
      <Text style={[styles.perfLabel, { color: colors.mutedForeground }]}>
        {label}
      </Text>
      <Text style={[styles.perfValue, { color: colors.foreground }]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  bannerWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 12,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  hero: {
    padding: 20,
    borderWidth: 1,
    overflow: "hidden",
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  heroEyebrow: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    letterSpacing: 3,
  },
  heroTitle: {
    fontSize: 28,
    lineHeight: 34,
    marginTop: 6,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  heroStats: {
    flexDirection: "row",
    gap: 14,
    marginTop: 14,
    flexWrap: "wrap",
  },
  heroStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  heroStatText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  section: {
    padding: 18,
    borderWidth: 1,
    borderRadius: 20,
  },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 2.5,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    marginTop: 2,
  },
  headBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  headBtnText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  perf: {
    flexBasis: "47%",
    flexGrow: 1,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
  },
  perfLabel: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginTop: 4,
  },
  perfValue: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  bigLabel: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 2.5,
    marginTop: 4,
  },
  trackCard: {
    height: 150,
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  trackContent: {
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
  },
  trackName: {
    color: "#fff",
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
  },
  trackSub: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    marginTop: 2,
  },
  trackMeta: {
    flexDirection: "row",
    gap: 6,
    marginTop: 10,
    flexWrap: "wrap",
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderColor: "rgba(255,255,255,0.18)",
  },
  metaText: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1,
  },
  trialRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  trialName: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  trialBest: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    marginTop: 2,
  },
  careerProgress: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    marginTop: 4,
    marginBottom: 8,
  },
  careerBar: {
    height: 6,
    overflow: "hidden",
  },
  careerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
});
