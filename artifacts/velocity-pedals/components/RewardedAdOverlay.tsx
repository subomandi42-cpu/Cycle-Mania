import { Feather } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { adsAvailable, showRewardedAd } from "@/lib/ads";
import { useColors } from "@/hooks/useColors";

type Props = {
  visible: boolean;
  title: string;
  reward: string;
  onClose: (rewarded: boolean) => void;
};

const SIM_SECONDS = 5;

export function RewardedAdOverlay({ visible, title, reward, onClose }: Props) {
  const colors = useColors();
  const [phase, setPhase] = useState<"loading" | "simulating">("loading");
  const [seconds, setSeconds] = useState(SIM_SECONDS);
  const closedRef = useRef(false);

  useEffect(() => {
    if (!visible) {
      setPhase("loading");
      setSeconds(SIM_SECONDS);
      closedRef.current = false;
      return;
    }
    let cancelled = false;
    closedRef.current = false;

    (async () => {
      // Try to play a real rewarded ad (only works in a dev build with the
      // AdMob native module installed). If unavailable or it failed without
      // earning the reward, fall back to a simulated ad so the in-game
      // reward flow stays testable in Expo Go and on web.
      const earned = await showRewardedAd();
      if (cancelled) return;

      if (earned) {
        if (!closedRef.current) {
          closedRef.current = true;
          onClose(true);
        }
        return;
      }

      if (!adsAvailable) {
        setPhase("simulating");
      } else {
        // Real ad attempted but no reward earned (user closed or error).
        if (!closedRef.current) {
          closedRef.current = true;
          onClose(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [visible, onClose]);

  useEffect(() => {
    if (!visible || phase !== "simulating") return;
    if (seconds <= 0) {
      if (!closedRef.current) {
        closedRef.current = true;
        onClose(true);
      }
      return;
    }
    const id = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [visible, phase, seconds, onClose]);

  const cancel = () => {
    if (closedRef.current) return;
    closedRef.current = true;
    onClose(false);
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={cancel}
    >
      <View style={styles.scrim}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: 22,
            },
          ]}
        >
          <View
            style={[
              styles.badge,
              {
                backgroundColor: colors.primary + "22",
                borderColor: colors.primary,
              },
            ]}
          >
            <Feather name="gift" size={12} color={colors.primary} />
            <Text style={{ color: colors.primary, fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 1.4 }}>
              REWARDED AD
            </Text>
          </View>

          <Text style={[styles.title, { color: colors.foreground }]}>
            {title}
          </Text>
          <Text style={[styles.reward, { color: colors.mutedForeground }]}>
            Reward: {reward}
          </Text>

          <View style={{ alignItems: "center", marginVertical: 22 }}>
            {phase === "loading" ? (
              <>
                <ActivityIndicator color={colors.primary} size="large" />
                <Text style={[styles.statusLine, { color: colors.mutedForeground }]}>
                  Loading ad…
                </Text>
              </>
            ) : (
              <>
                <Text
                  style={[
                    styles.countdown,
                    { color: colors.primary },
                  ]}
                >
                  {seconds}
                </Text>
                <Text style={[styles.statusLine, { color: colors.mutedForeground }]}>
                  Simulated ad — running in test mode
                </Text>
              </>
            )}
          </View>

          <Pressable
            onPress={cancel}
            style={({ pressed }) => [
              styles.skip,
              {
                borderColor: colors.border,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
            hitSlop={6}
          >
            <Feather name="x" size={14} color={colors.mutedForeground} />
            <Text style={[styles.skipText, { color: colors.mutedForeground }]}>
              Cancel
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: "rgba(7,11,31,0.85)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    padding: 22,
    borderWidth: 1,
    alignItems: "center",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    marginBottom: 14,
  },
  title: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    letterSpacing: -0.3,
  },
  reward: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    marginTop: 6,
    textAlign: "center",
  },
  countdown: {
    fontSize: 64,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1,
  },
  statusLine: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    marginTop: 10,
    textAlign: "center",
  },
  skip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 999,
  },
  skipText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
});
