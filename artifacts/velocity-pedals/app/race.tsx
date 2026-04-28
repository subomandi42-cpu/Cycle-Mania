import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Path, Rect } from "react-native-svg";

import { BikeSprite } from "@/components/BikeSprite";
import { GameButton } from "@/components/GameButton";
import { StatBar } from "@/components/StatBar";
import {
  CAREER_STAGES,
  deriveStats,
  TRACKS,
  TrackId,
} from "@/constants/game";
import { useGame } from "@/contexts/GameContext";
import { useColors } from "@/hooks/useColors";

const LANE_COUNT = 3;
const HIT_DISTANCE = 70;
const DRAFT_RANGE_MIN = 30;
const DRAFT_RANGE_MAX = 130;

type Mode = "quick" | "career" | "trial";

type EntityType = "coin" | "obstacle" | "opponent";

type Entity = {
  id: number;
  type: EntityType;
  lane: number;
  y: number;
  passed?: boolean;
  collected?: boolean;
  variant?: number;
};

type Phase = "countdown" | "racing" | "paused" | "finished";

let nextEntityId = 1;
function newId() {
  return nextEntityId++;
}

function haptic(style: "light" | "medium" | "heavy" | "selection") {
  if (Platform.OS === "web") return;
  if (style === "selection") {
    Haptics.selectionAsync().catch(() => {});
    return;
  }
  const map = {
    light: Haptics.ImpactFeedbackStyle.Light,
    medium: Haptics.ImpactFeedbackStyle.Medium,
    heavy: Haptics.ImpactFeedbackStyle.Heavy,
  };
  Haptics.impactAsync(map[style]).catch(() => {});
}

export default function RaceScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const params = useLocalSearchParams<{
    track?: string;
    mode?: string;
    stage?: string;
  }>();

  const trackId = (params.track as TrackId) ?? "urban";
  const mode = (params.mode as Mode) ?? "quick";
  const stageIndex = params.stage ? Number(params.stage) : undefined;

  const track = TRACKS[trackId];
  const { state, recordRace } = useGame();
  const stats = useMemo(() => deriveStats(state.upgrades), [state.upgrades]);

  const roadWidth = Math.min(width * 0.92, 480);
  const roadLeft = (width - roadWidth) / 2;
  const laneWidth = roadWidth / LANE_COUNT;
  const playAreaTop = insets.top + 78;
  const playAreaBottom = height - 170;
  const playAreaHeight = Math.max(300, playAreaBottom - playAreaTop);
  const playerY = playAreaHeight - 100;

  // Game state
  const [phase, setPhase] = useState<Phase>("countdown");
  const [countdown, setCountdown] = useState(3);
  const [lane, setLane] = useState(1);
  const [speed, setSpeed] = useState(stats.baseSpeed);
  const [stamina, setStamina] = useState(100);
  const [distance, setDistance] = useState(0);
  const [coins, setCoins] = useState(0);
  const [raceTime, setRaceTime] = useState(0);
  const [isPedaling, setIsPedaling] = useState(false);
  const [isBraking, setIsBraking] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [crashCooldown, setCrashCooldown] = useState(0);
  const [shakeFrame, setShakeFrame] = useState(0);
  const [entities, setEntities] = useState<Entity[]>([]);

  // Refs to avoid stale closures inside the tick
  const phaseRef = useRef(phase);
  const laneRef = useRef(lane);
  const speedRef = useRef(speed);
  const staminaRef = useRef(stamina);
  const distanceRef = useRef(distance);
  const coinsRef = useRef(coins);
  const raceTimeRef = useRef(raceTime);
  const pedalRef = useRef(false);
  const brakeRef = useRef(false);
  const crashRef = useRef(0);
  const entitiesRef = useRef<Entity[]>([]);
  const spawnTimers = useRef({ coin: 0.4, obstacle: 1.5, opponent: 3 });

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);
  useEffect(() => {
    laneRef.current = lane;
  }, [lane]);

  // Countdown
  useEffect(() => {
    if (phase !== "countdown") return;
    if (countdown <= 0) {
      setPhase("racing");
      haptic("medium");
      return;
    }
    const id = setTimeout(() => setCountdown((c) => c - 1), 700);
    haptic("light");
    return () => clearTimeout(id);
  }, [phase, countdown]);

  const finishRace = useCallback(
    (finished: boolean) => {
      const summary = recordRace({
        trackId,
        finished,
        timeSec: raceTimeRef.current,
        distance: distanceRef.current,
        coinsCollected: coinsRef.current,
        careerStageIndex:
          mode === "career" && stageIndex !== undefined ? stageIndex : undefined,
        careerReward:
          mode === "career" && stageIndex !== undefined
            ? CAREER_STAGES[stageIndex]?.reward
            : undefined,
      });
      router.replace({
        pathname: "/results",
        params: {
          track: trackId,
          mode,
          finished: finished ? "1" : "0",
          time: String(raceTimeRef.current.toFixed(2)),
          distance: String(Math.round(distanceRef.current)),
          coins: String(coinsRef.current),
          bonus: String(summary.bonusReward),
          best: summary.isBest ? "1" : "0",
          advanced: summary.careerAdvanced ? "1" : "0",
        },
      });
    },
    [recordRace, trackId, mode, stageIndex],
  );

  // Game loop
  useEffect(() => {
    if (phase !== "racing") return;
    const interval = setInterval(() => {
      const dt = 0.05;
      // Update timers
      raceTimeRef.current += dt;

      // Crash cooldown
      if (crashRef.current > 0) {
        crashRef.current = Math.max(0, crashRef.current - dt);
      }

      // Speed update
      let s = speedRef.current;
      const cap = stats.maxSpeed;
      if (crashRef.current > 0.6) {
        s = Math.max(stats.baseSpeed * 0.35, s - 22 * dt);
      } else if (brakeRef.current) {
        s = Math.max(12, s - 18 * dt);
      } else if (pedalRef.current && staminaRef.current > 0) {
        s = Math.min(cap, s + stats.accel * 14 * dt);
      } else {
        // coast toward base speed
        const target = stats.baseSpeed;
        s = s + (target - s) * 0.6 * dt;
      }

      // Weather: wind reduces speed slightly when not drafting
      if (track.weather === "wind" && !drafting) {
        s -= 1.2 * dt;
      }

      // Stamina update
      let st = staminaRef.current;
      if (pedalRef.current && s > stats.baseSpeed + 4) {
        st = Math.max(0, st - stats.sprintCost * dt * 6);
      } else if (drafting) {
        st = Math.min(100, st + stats.draftRecover * dt * 5);
      } else if (!pedalRef.current) {
        st = Math.min(100, st + 1.6 * dt * 4);
      }

      // Entity scrolling
      const scrollPx = s * dt * 9;
      let isDraftingThisTick = false;
      const collectedCoins: number[] = [];
      const crashedIds: number[] = [];

      const next: Entity[] = [];
      for (const e of entitiesRef.current) {
        const ny = e.y + scrollPx;
        if (ny > playAreaHeight + 80) continue;
        const updated = { ...e, y: ny };

        // Drafting check (opponent ahead in same lane)
        if (e.type === "opponent" && e.lane === laneRef.current) {
          const aheadDist = playerY - ny;
          if (aheadDist > DRAFT_RANGE_MIN && aheadDist < DRAFT_RANGE_MAX) {
            isDraftingThisTick = true;
          }
        }

        // Collision check (only when crossing player's row this tick)
        if (
          !updated.passed &&
          updated.lane === laneRef.current &&
          updated.y >= playerY - HIT_DISTANCE &&
          updated.y <= playerY + HIT_DISTANCE
        ) {
          if (e.type === "coin" && !updated.collected) {
            updated.collected = true;
            updated.passed = true;
            collectedCoins.push(updated.id);
          } else if (e.type === "obstacle" && crashRef.current <= 0) {
            crashedIds.push(updated.id);
            updated.passed = true;
          } else if (e.type === "opponent") {
            // pass through (no collision with opponents)
            updated.passed = true;
          }
        } else if (updated.y > playerY + HIT_DISTANCE) {
          updated.passed = true;
        }

        if (updated.type === "coin" && updated.collected) continue;
        next.push(updated);
      }

      // Spawning
      const sp = spawnTimers.current;
      sp.coin -= dt;
      sp.obstacle -= dt;
      sp.opponent -= dt;

      if (sp.coin <= 0) {
        const laneIdx = Math.floor(Math.random() * LANE_COUNT);
        next.push({
          id: newId(),
          type: "coin",
          lane: laneIdx,
          y: -40,
        });
        // Sometimes spawn a small line of coins
        if (Math.random() < 0.45) {
          next.push({
            id: newId(),
            type: "coin",
            lane: laneIdx,
            y: -90,
          });
        }
        sp.coin = 0.55 + Math.random() * 0.6;
      }
      if (sp.obstacle <= 0) {
        // Avoid spawning obstacle in a lane that has a recent coin chain at top
        const laneIdx = Math.floor(Math.random() * LANE_COUNT);
        const variant = Math.floor(Math.random() * 3);
        next.push({
          id: newId(),
          type: "obstacle",
          lane: laneIdx,
          y: -60,
          variant,
        });
        const intensity = Math.min(1, s / cap);
        sp.obstacle = 1.6 - intensity * 0.7 + Math.random() * 0.7;
      }
      if (sp.opponent <= 0) {
        const laneIdx = Math.floor(Math.random() * LANE_COUNT);
        next.push({
          id: newId(),
          type: "opponent",
          lane: laneIdx,
          y: -80,
        });
        sp.opponent = 4 + Math.random() * 4;
      }

      // Apply effects
      if (collectedCoins.length > 0) {
        coinsRef.current += collectedCoins.length;
        haptic("light");
      }
      if (crashedIds.length > 0) {
        crashRef.current = 1.4;
        st = Math.max(0, st - 18);
        haptic("heavy");
        setShakeFrame((f) => f + 1);
      }

      // Drafting + slight speed boost when drafting
      if (isDraftingThisTick) {
        s = Math.min(cap, s + stats.draftRecover * 0.6 * dt);
      }

      // Distance
      const distGain = s * dt * 0.85;
      distanceRef.current += distGain;

      // Persist refs
      speedRef.current = s;
      staminaRef.current = st;
      entitiesRef.current = next;

      // Sync to React state (driven enough for UI fluidity)
      setSpeed(s);
      setStamina(st);
      setDistance(distanceRef.current);
      setCoins(coinsRef.current);
      setRaceTime(raceTimeRef.current);
      setEntities(next);
      setDrafting(isDraftingThisTick);
      setCrashCooldown(crashRef.current);

      // Finish
      if (distanceRef.current >= track.distance) {
        clearInterval(interval);
        setPhase("finished");
        finishRace(true);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [
    phase,
    stats,
    track.distance,
    track.weather,
    drafting,
    playerY,
    playAreaHeight,
    finishRace,
  ]);

  const switchLane = useCallback(
    (dir: -1 | 1) => {
      if (phaseRef.current !== "racing") return;
      setLane((l) => {
        const target = Math.max(0, Math.min(LANE_COUNT - 1, l + dir));
        if (target !== l) {
          // Slip on rain if grip is low
          if (track.weather === "rain" && Math.random() > stats.grip) {
            speedRef.current = Math.max(15, speedRef.current * 0.7);
            haptic("medium");
            setShakeFrame((f) => f + 1);
          } else {
            haptic("selection");
          }
        }
        return target;
      });
    },
    [stats.grip, track.weather],
  );

  const setPedalingSafe = useCallback((v: boolean) => {
    pedalRef.current = v;
    setIsPedaling(v);
  }, []);
  const setBrakingSafe = useCallback((v: boolean) => {
    brakeRef.current = v;
    setIsBraking(v);
  }, []);

  const onPause = useCallback(() => {
    if (phase !== "racing") return;
    setPhase("paused");
    pedalRef.current = false;
    brakeRef.current = false;
    setIsPedaling(false);
    setIsBraking(false);
  }, [phase]);

  const onResume = useCallback(() => {
    setPhase("racing");
  }, []);

  const onQuit = useCallback(() => {
    finishRace(false);
  }, [finishRace]);

  // Lane positions (center x of each lane, relative to road container)
  const laneCenterX = (i: number) => i * laneWidth + laneWidth / 2;

  const distancePct = Math.min(1, distance / track.distance);
  const isLowStamina = stamina < 25;

  return (
    <View style={[styles.container, { backgroundColor: track.skyBottom }]}>
      {/* Sky gradient */}
      <LinearGradient
        colors={[track.skyTop, track.skyBottom]}
        style={StyleSheet.absoluteFill}
      />

      {/* Road */}
      <View
        style={[
          styles.road,
          {
            left: roadLeft,
            top: playAreaTop,
            width: roadWidth,
            height: playAreaHeight,
            backgroundColor: track.road,
            borderRadius: 0,
            transform: shakeFrame % 2 === 1 && crashCooldown > 0
              ? [{ translateX: 4 }]
              : undefined,
          },
        ]}
      >
        {/* Lane dividers (animated dashes) */}
        {[1, 2].map((i) => (
          <LaneDivider
            key={i}
            x={i * laneWidth}
            height={playAreaHeight}
            color={track.lane}
            speed={speed}
          />
        ))}

        {/* Edge stripes */}
        <View
          style={[
            styles.edge,
            { left: 0, backgroundColor: track.lane, opacity: 0.4 },
          ]}
        />
        <View
          style={[
            styles.edge,
            { right: 0, backgroundColor: track.lane, opacity: 0.4 },
          ]}
        />

        {/* Entities */}
        {entities.map((e) => (
          <EntityView
            key={e.id}
            entity={e}
            x={laneCenterX(e.lane)}
            accent={track.accent}
          />
        ))}

        {/* Player bike */}
        <View
          style={{
            position: "absolute",
            left: laneCenterX(lane) - 32,
            top: playerY - 32,
            opacity: crashCooldown > 0 && Math.floor(crashCooldown * 12) % 2 === 0 ? 0.4 : 1,
          }}
        >
          <BikeSprite
            size={64}
            color={track.accent}
            frame={isPedaling ? "#ffffff" : "#0a0e27"}
          />
        </View>

        {/* Speed lines when sprinting */}
        {isPedaling && speed > stats.baseSpeed + 6 && (
          <SpeedLines width={roadWidth} height={playAreaHeight} />
        )}

        {/* Drafting glow */}
        {drafting && (
          <View
            style={{
              position: "absolute",
              left: laneCenterX(lane) - 38,
              top: playerY - 50,
              width: 76,
              height: 90,
              borderRadius: 999,
              borderWidth: 2,
              borderColor: track.accent,
              opacity: 0.55,
            }}
            pointerEvents="none"
          />
        )}
      </View>

      {/* HUD */}
      <View
        style={[
          styles.hud,
          {
            top: insets.top + 8,
            backgroundColor: "rgba(7,11,31,0.55)",
            borderColor: "rgba(255,255,255,0.08)",
          },
        ]}
      >
        <View style={styles.hudRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.hudKey, { color: "#bcc4e8" }]}>SPEED</Text>
            <Text style={[styles.hudVal, { color: "#fff" }]}>
              {Math.round(speed)}
              <Text style={styles.hudUnit}> km/h</Text>
            </Text>
          </View>
          <View style={{ alignItems: "center" }}>
            <Text style={[styles.hudKey, { color: "#bcc4e8" }]}>
              {track.name.toUpperCase()}
            </Text>
            <Text style={[styles.hudVal, { color: "#fff", fontSize: 14 }]}>
              {raceTime.toFixed(1)}s
            </Text>
          </View>
          <View style={{ flex: 1, alignItems: "flex-end" }}>
            <Pressable
              onPress={onPause}
              hitSlop={12}
              style={{
                backgroundColor: "rgba(255,255,255,0.12)",
                borderRadius: 999,
                padding: 8,
              }}
            >
              <Feather name="pause" size={18} color="#fff" />
            </Pressable>
          </View>
        </View>

        <View style={styles.bars}>
          <StatBar
            label="Stamina"
            value={stamina}
            max={100}
            color={isLowStamina ? "#ff3b5b" : track.accent}
            icon="zap"
            pulsing
          />
          <View style={{ width: 12 }} />
          <StatBar
            label={`Distance / ${track.distance}m`}
            value={distance}
            max={track.distance}
            color="#7df0ff"
            icon="flag"
          />
        </View>

        <View style={styles.statusRow}>
          <View style={styles.coinPill}>
            <Feather name="circle" size={11} color={track.accent} />
            <Text style={[styles.coinText, { color: "#fff" }]}>
              {coins} coins
            </Text>
          </View>
          {drafting && (
            <View
              style={[
                styles.statusPill,
                { backgroundColor: track.accent + "30", borderColor: track.accent },
              ]}
            >
              <Feather name="wind" size={11} color={track.accent} />
              <Text style={[styles.statusText, { color: track.accent }]}>
                DRAFTING
              </Text>
            </View>
          )}
          {track.weather === "rain" && (
            <View style={styles.weatherPill}>
              <Feather name="cloud-rain" size={11} color="#7df0ff" />
              <Text style={styles.weatherText}>RAIN</Text>
            </View>
          )}
          {track.weather === "wind" && (
            <View style={styles.weatherPill}>
              <Feather name="wind" size={11} color="#7df0ff" />
              <Text style={styles.weatherText}>HEADWIND</Text>
            </View>
          )}
          {crashCooldown > 0 && (
            <View
              style={[styles.statusPill, { borderColor: "#ff3b5b", backgroundColor: "#ff3b5b30" }]}
            >
              <Feather name="alert-triangle" size={11} color="#ff3b5b" />
              <Text style={[styles.statusText, { color: "#ff3b5b" }]}>
                CRASH
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Controls */}
      <View
        style={[
          styles.controls,
          { paddingBottom: Math.max(insets.bottom, 14) + 10 },
        ]}
        pointerEvents={phase === "racing" ? "auto" : "none"}
      >
        <Pressable
          onPress={() => switchLane(-1)}
          style={({ pressed }) => [
            styles.laneBtn,
            {
              backgroundColor: pressed ? "#ffffff22" : "#ffffff14",
              borderColor: "#ffffff33",
            },
          ]}
          hitSlop={8}
        >
          <Feather name="chevron-left" size={32} color="#fff" />
        </Pressable>

        <Pressable
          onPressIn={() => setBrakingSafe(true)}
          onPressOut={() => setBrakingSafe(false)}
          style={({ pressed }) => [
            styles.brakeBtn,
            {
              backgroundColor: isBraking || pressed ? "#ff3b5b" : "#ffffff14",
              borderColor: "#ff3b5b66",
            },
          ]}
        >
          <Feather name="square" size={20} color="#fff" />
          <Text style={styles.brakeLabel}>BRAKE</Text>
        </Pressable>

        <Pressable
          onPressIn={() => setPedalingSafe(true)}
          onPressOut={() => setPedalingSafe(false)}
          style={({ pressed }) => [
            styles.pedalBtn,
            {
              backgroundColor:
                isPedaling || pressed ? track.accent : track.accent + "55",
              borderColor: track.accent,
            },
          ]}
        >
          <Feather
            name="zap"
            size={28}
            color={isPedaling ? "#070b1f" : "#fff"}
          />
          <Text
            style={[
              styles.pedalLabel,
              { color: isPedaling ? "#070b1f" : "#fff" },
            ]}
          >
            PEDAL
          </Text>
        </Pressable>

        <Pressable
          onPress={() => switchLane(1)}
          style={({ pressed }) => [
            styles.laneBtn,
            {
              backgroundColor: pressed ? "#ffffff22" : "#ffffff14",
              borderColor: "#ffffff33",
            },
          ]}
          hitSlop={8}
        >
          <Feather name="chevron-right" size={32} color="#fff" />
        </Pressable>
      </View>

      {/* Countdown overlay */}
      {phase === "countdown" && (
        <View style={styles.overlay}>
          <Text style={styles.overlayLabel}>{track.name.toUpperCase()}</Text>
          <Text
            style={[
              styles.countdown,
              { color: track.accent },
            ]}
          >
            {countdown > 0 ? countdown : "GO!"}
          </Text>
          <Text style={styles.overlayHint}>
            Hold PEDAL to sprint • Drafting recovers stamina
          </Text>
        </View>
      )}

      {/* Pause overlay */}
      {phase === "paused" && (
        <View style={styles.overlay}>
          <Text style={[styles.overlayLabel, { color: "#fff" }]}>PAUSED</Text>
          <View style={{ height: 24 }} />
          <GameButton
            label="Resume"
            onPress={onResume}
            icon="play"
            size="lg"
            style={{ minWidth: 220 }}
          />
          <View style={{ height: 12 }} />
          <GameButton
            label="Quit Race"
            onPress={onQuit}
            variant="ghost"
            icon="x"
            style={{ minWidth: 220 }}
          />
        </View>
      )}
    </View>
  );
}

function LaneDivider({
  x,
  height,
  color,
  speed,
}: {
  x: number;
  height: number;
  color: string;
  speed: number;
}) {
  // Static dashes — feel of motion comes from entity scroll
  const dashCount = Math.ceil(height / 50);
  return (
    <View
      style={{
        position: "absolute",
        left: x - 2,
        top: 0,
        width: 4,
        height,
      }}
      pointerEvents="none"
    >
      {Array.from({ length: dashCount }).map((_, i) => (
        <View
          key={i}
          style={{
            width: 4,
            height: 24,
            marginTop: i === 0 ? 8 : 26,
            backgroundColor: color,
            opacity: 0.55,
            borderRadius: 2,
          }}
        />
      ))}
    </View>
  );
}

function SpeedLines({ width, height }: { width: number; height: number }) {
  return (
    <Svg
      pointerEvents="none"
      style={{ position: "absolute", left: 0, top: 0 }}
      width={width}
      height={height}
    >
      {Array.from({ length: 5 }).map((_, i) => {
        const yOffset = (i * 80 + (Date.now() / 5) % 80) % height;
        return (
          <React.Fragment key={i}>
            <Path
              d={`M ${10} ${yOffset} L ${10} ${yOffset + 30}`}
              stroke="#ffffff"
              strokeOpacity={0.55}
              strokeWidth={3}
              strokeLinecap="round"
            />
            <Path
              d={`M ${width - 10} ${yOffset + 20} L ${width - 10} ${yOffset + 50}`}
              stroke="#ffffff"
              strokeOpacity={0.55}
              strokeWidth={3}
              strokeLinecap="round"
            />
          </React.Fragment>
        );
      })}
    </Svg>
  );
}

function EntityView({
  entity,
  x,
  accent,
}: {
  entity: Entity;
  x: number;
  accent: string;
}) {
  if (entity.type === "coin") {
    return (
      <View
        style={{
          position: "absolute",
          left: x - 14,
          top: entity.y - 14,
        }}
        pointerEvents="none"
      >
        <Svg width={28} height={28} viewBox="0 0 28 28">
          <Circle cx={14} cy={14} r={12} fill={accent} />
          <Circle
            cx={14}
            cy={14}
            r={8}
            stroke="#070b1f"
            strokeWidth={2}
            fill="transparent"
          />
        </Svg>
      </View>
    );
  }
  if (entity.type === "obstacle") {
    const v = entity.variant ?? 0;
    if (v === 0) {
      // car
      return (
        <View
          style={{
            position: "absolute",
            left: x - 28,
            top: entity.y - 36,
          }}
          pointerEvents="none"
        >
          <Svg width={56} height={72} viewBox="0 0 56 72">
            <Rect x={6} y={4} width={44} height={64} rx={10} fill="#ff3b5b" />
            <Rect x={12} y={12} width={32} height={18} rx={4} fill="#1a1f3a" />
            <Rect x={12} y={42} width={32} height={20} rx={4} fill="#1a1f3a" />
            <Circle cx={10} cy={20} r={4} fill="#ffd23a" />
            <Circle cx={46} cy={20} r={4} fill="#ffd23a" />
          </Svg>
        </View>
      );
    }
    if (v === 1) {
      // pothole
      return (
        <View
          style={{
            position: "absolute",
            left: x - 24,
            top: entity.y - 12,
          }}
          pointerEvents="none"
        >
          <Svg width={48} height={24} viewBox="0 0 48 24">
            <Rect x={2} y={2} width={44} height={20} rx={10} fill="#070b1f" />
            <Rect x={6} y={6} width={36} height={6} rx={3} fill="#1a1f3a" />
          </Svg>
        </View>
      );
    }
    // cone
    return (
      <View
        style={{
          position: "absolute",
          left: x - 14,
          top: entity.y - 22,
        }}
        pointerEvents="none"
      >
        <Svg width={28} height={44} viewBox="0 0 28 44">
          <Path d="M14 4 L4 40 L24 40 Z" fill="#ff8d3a" />
          <Rect x={2} y={36} width={24} height={6} rx={2} fill="#070b1f" />
          <Rect x={9} y={16} width={10} height={3} rx={1} fill="#ffffff" />
        </Svg>
      </View>
    );
  }
  // opponent
  return (
    <View
      style={{
        position: "absolute",
        left: x - 32,
        top: entity.y - 32,
      }}
      pointerEvents="none"
    >
      <BikeSprite size={64} color="#ff2d92" frame="#070b1f" rider="#ffe7a8" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  road: {
    position: "absolute",
    overflow: "hidden",
  },
  edge: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 4,
  },
  hud: {
    position: "absolute",
    left: 12,
    right: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1,
    gap: 10,
  },
  hudRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  hudKey: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  hudVal: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
    marginTop: 2,
  },
  hudUnit: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: "#bcc4e8",
  },
  bars: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  coinPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 999,
  },
  coinText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.4,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1,
  },
  weatherPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(125,240,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(125,240,255,0.4)",
  },
  weatherText: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1,
    color: "#7df0ff",
  },
  controls: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    gap: 10,
  },
  laneBtn: {
    width: 60,
    height: 80,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  brakeBtn: {
    width: 70,
    height: 80,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  brakeLabel: {
    color: "#fff",
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.2,
  },
  pedalBtn: {
    flex: 1,
    height: 80,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  pedalLabel: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.4,
  },
  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(7,11,31,0.78)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  overlayLabel: {
    color: "#bcc4e8",
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    letterSpacing: 3,
    marginBottom: 12,
  },
  countdown: {
    fontSize: 120,
    fontFamily: "Inter_700Bold",
    letterSpacing: 2,
  },
  overlayHint: {
    marginTop: 20,
    color: "#bcc4e8",
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
  },
});
