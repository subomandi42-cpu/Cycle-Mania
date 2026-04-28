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

import { adsAvailable, showInterstitialAd } from "@/lib/ads";
import { useColors } from "@/hooks/useColors";

type Props = {
  visible: boolean;
  onClose: () => void;
};

const SIM_SECONDS = 5;
const SKIP_AFTER_SECONDS = 3;

export function InterstitialAdOverlay({ visible, onClose }: Props) {
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
      // Try the real interstitial first (only present in dev builds with the
      // native AdMob module). Fall back to a simulated overlay otherwise so
      // the cadence + frequency-cap policy can still be exercised in Expo Go
      // and on the web preview.
      const shown = await showInterstitialAd();
      if (cancelled) return;

      if (shown) {
        if (!closedRef.current) {
          closedRef.current = true;
          onClose();
        }
        return;
      }

      if (!adsAvailable) {
        setPhase("simulating");
      } else {
        // Real ad attempted but failed to load — close silently so the player
        // is never blocked.
        if (!closedRef.current) {
          closedRef.current = true;
          onClose();
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
        onClose();
      }
      return;
    }
    const id = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [visible, phase, seconds, onClose]);

  const close = () => {
    if (closedRef.current) return;
    closedRef.current = true;
    onClose();
  };

  const elapsed = SIM_SECONDS - seconds;
  const canSkip = phase === "simulating" && elapsed >= SKIP_AFTER_SECONDS;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={canSkip ? close : undefined}
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
                backgroundColor: colors.accent + "22",
                borderColor: colors.accent,
              },
            ]}
          >
            <Feather name="zap" size={12} color={colors.accent} />
            <Text
              style={{
                color: colors.accent,
                fontSize: 10,
                fontFamily: "Inter_700Bold",
                letterSpacing: 1.4,
              }}
            >
              SPONSORED BREAK
            </Text>
          </View>

          <Text style={[styles.title, { color: colors.foreground }]}>
            A quick word from our sponsors
          </Text>
          <Text style={[styles.sub, { color: colors.mutedForeground }]}>
            Thanks for playing Velocity Pedals. We&apos;ll be right back.
          </Text>

          <View style={{ alignItems: "center", marginVertical: 22 }}>
            {phase === "loading" ? (
              <>
                <ActivityIndicator color={colors.accent} size="large" />
                <Text
                  style={[styles.statusLine, { color: colors.mutedForeground }]}
                >
                  Loading ad…
                </Text>
              </>
            ) : (
              <>
                <Text style={[styles.countdown, { color: colors.accent }]}>
                  {seconds}
                </Text>
                <Text
                  style={[styles.statusLine, { color: colors.mutedForeground }]}
                >
                  Simulated interstitial — running in test mode
                </Text>
              </>
            )}
          </View>

          {canSkip ? (
            <Pressable
              onPress={close}
              style={({ pressed }) => [
                styles.skip,
                {
                  borderColor: colors.border,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
              hitSlop={6}
            >
              <Feather
                name="skip-forward"
                size={14}
                color={colors.mutedForeground}
              />
              <Text style={[styles.skipText, { color: colors.mutedForeground }]}>
                Skip
              </Text>
            </Pressable>
          ) : (
            <View
              style={[styles.skipDisabled, { borderColor: colors.border }]}
            >
              <Feather name="lock" size={12} color={colors.mutedForeground} />
              <Text
                style={[styles.skipText, { color: colors.mutedForeground }]}
              >
                Skip in {Math.max(0, SKIP_AFTER_SECONDS - elapsed)}s
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: "rgba(7,11,31,0.92)",
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
  sub: {
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
  skipDisabled: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 999,
    opacity: 0.5,
  },
  skipText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
});
