// Lightweight in-memory policy controlling when an interstitial ad is shown
// between races. State resets on app cold start so a brand-new session never
// front-loads the player with an ad.

const CADENCE = 3; // Show on every 3rd completed race
const FREQ_CAP_MS = 90_000; // Never show two interstitials within 90 seconds

let racesSinceLastShow = 0;
let lastShownAt = 0;

export function noteRaceCompleted() {
  racesSinceLastShow += 1;
}

export function shouldShowInterstitial(): boolean {
  if (racesSinceLastShow < CADENCE) return false;
  if (Date.now() - lastShownAt < FREQ_CAP_MS) return false;
  return true;
}

export function noteInterstitialShown() {
  racesSinceLastShow = 0;
  lastShownAt = Date.now();
}

export function getRaceCounter() {
  return racesSinceLastShow;
}
