import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";

import {
  BANNER_ID,
  NativeBannerAd,
  NativeBannerAdSize,
  adsAvailable,
} from "@/lib/ads";
import { useColors } from "@/hooks/useColors";

type Props = {
  style?: ViewStyle;
};

export function BannerAdSlot({ style }: Props) {
  const colors = useColors();
  const [failed, setFailed] = useState(false);

  const showRealAd =
    adsAvailable && NativeBannerAd && NativeBannerAdSize && !failed;

  if (showRealAd) {
    const Banner = NativeBannerAd as React.ComponentType<{
      unitId: string;
      size: string;
      requestOptions?: { requestNonPersonalizedAdsOnly?: boolean };
      onAdFailedToLoad?: (e: unknown) => void;
    }>;
    return (
      <View style={[styles.wrap, style]} pointerEvents="box-none">
        <Banner
          unitId={BANNER_ID}
          size={NativeBannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          requestOptions={{ requestNonPersonalizedAdsOnly: true }}
          onAdFailedToLoad={() => setFailed(true)}
        />
      </View>
    );
  }

  // Placeholder shown in Expo Go and on Web.
  return (
    <View
      style={[
        styles.placeholder,
        {
          borderColor: colors.border,
          backgroundColor: colors.card,
          borderRadius: 12,
        },
        style,
      ]}
    >
      <Feather name="gift" size={14} color={colors.mutedForeground} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, { color: colors.foreground }]}>
          Banner Ad Slot
        </Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>
          Live AdMob ads load in a development build
        </Text>
      </View>
      <View
        style={[
          styles.tag,
          { backgroundColor: colors.primary, borderRadius: 999 },
        ]}
      >
        <Text style={{ color: colors.primaryForeground, fontSize: 9, fontFamily: "Inter_700Bold", letterSpacing: 1 }}>
          TEST
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },
  placeholder: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderStyle: "dashed",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  title: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.4,
  },
  sub: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    marginTop: 2,
  },
  tag: {
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
});
