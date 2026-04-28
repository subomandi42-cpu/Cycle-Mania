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

export const TEST_INTERSTITIAL_ID =
  Platform.OS === "ios"
    ? "ca-app-pub-3940256099942544/4411468910"
    : "ca-app-pub-3940256099942544/1033173712";

// Real Velocity Pedals AdMob ad unit IDs (publisher 1044154545716772).
// One ad unit per format — used on both iOS and Android. If you ever want
// per-platform reporting, create separate units in AdMob and split these.
export const PROD_BANNER_ID = "ca-app-pub-1044154545716772/7130202511";
export const PROD_REWARDED_ID = "ca-app-pub-1044154545716772/1818166081";
export const PROD_INTERSTITIAL_ID = "ca-app-pub-1044154545716772/7210093569";

// In Metro / dev builds (__DEV__ === true) we always serve Google's test
// units. Release / store builds (__DEV__ === false) automatically switch
// to the real units so revenue starts flowing once you publish.
// To preview real ads on your phone *before* publishing, either:
//   1. Build a release/preview build with `eas build --profile preview`
//      (this sets __DEV__ to false), OR
//   2. Register your device as a test device in AdMob so real units serve
//      test creatives — see notes in the README.
const useRealAds = !__DEV__;

export const BANNER_ID = useRealAds ? PROD_BANNER_ID : TEST_BANNER_ID;
export const REWARDED_ID = useRealAds ? PROD_REWARDED_ID : TEST_REWARDED_ID;
export const INTERSTITIAL_ID = useRealAds
  ? PROD_INTERSTITIAL_ID
  : TEST_INTERSTITIAL_ID;

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
      const ad = m.RewardedAd.createForAdRequest(REWARDED_ID, {
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

export async function showInterstitialAd(): Promise<boolean> {
  if (!mod) return false;
  return new Promise<boolean>((resolve) => {
    try {
      const m = mod!;
      const ad = m.InterstitialAd.createForAdRequest(INTERSTITIAL_ID, {
        requestNonPersonalizedAdsOnly: true,
      });
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
        ad.addAdEventListener(m.AdEventType.LOADED, () => {
          try {
            ad.show();
          } catch {
            cleanup();
            resolve(false);
          }
        }),
      );
      subs.push(
        ad.addAdEventListener(m.AdEventType.CLOSED, () => {
          cleanup();
          resolve(true);
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
