import Constants from "expo-constants";
import { Platform } from "react-native";

// Google's official test ad unit IDs.
// Safe to use in development; never use real ad unit IDs while testing.
export const TEST_BANNER_ID =
  Platform.OS === "ios"
    ? "ca-app-pub-3940256099942544/2934735716"
    : "ca-app-pub-3940256099942544/6300978111";

export const TEST_REWARDED_ID =
  Platform.OS === "ios"
    ? "ca-app-pub-3940256099942544/1712485313"
    : "ca-app-pub-3940256099942544/5224354917";

// Skip native module load when running inside Expo Go — the AdMob native
// SDK isn't bundled into Expo Go, so any access would crash. A custom
// development build (eas build / expo prebuild) is required for real ads.
const isExpoGo =
  (Constants as unknown as { appOwnership?: string }).appOwnership === "expo" ||
  Constants.executionEnvironment === "storeClient";

let mod: typeof import("react-native-google-mobile-ads") | null = null;

if (!isExpoGo) {
  try {
    mod = require("react-native-google-mobile-ads");
  } catch {
    mod = null;
  }
}

export const adsAvailable = !!mod;

export async function initAds(): Promise<boolean> {
  if (!mod) return false;
  try {
    await mod.default().initialize();
    return true;
  } catch {
    return false;
  }
}

export async function showRewardedAd(): Promise<boolean> {
  if (!mod) return false;
  return new Promise<boolean>((resolve) => {
    try {
      const m = mod!;
      const ad = m.RewardedAd.createForAdRequest(TEST_REWARDED_ID, {
        requestNonPersonalizedAdsOnly: true,
      });
      let earned = false;
      const subs: Array<() => void> = [];
      const cleanup = () => {
        subs.forEach((u) => {
          try {
            u();
          } catch {
            // ignore
          }
        });
      };

      subs.push(
        ad.addAdEventListener(m.RewardedAdEventType.LOADED, () => {
          try {
            ad.show();
          } catch {
            cleanup();
            resolve(false);
          }
        }),
      );
      subs.push(
        ad.addAdEventListener(m.RewardedAdEventType.EARNED_REWARD, () => {
          earned = true;
        }),
      );
      subs.push(
        ad.addAdEventListener(m.AdEventType.CLOSED, () => {
          cleanup();
          resolve(earned);
        }),
      );
      subs.push(
        ad.addAdEventListener(m.AdEventType.ERROR, () => {
          cleanup();
          resolve(false);
        }),
      );
      ad.load();
    } catch {
      resolve(false);
    }
  });
}

export const NativeBannerAd = mod?.BannerAd ?? null;
export const NativeBannerAdSize = mod?.BannerAdSize ?? null;
