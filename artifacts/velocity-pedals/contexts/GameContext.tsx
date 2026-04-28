import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { MAX_LEVEL, TrackId, Upgrades, UpgradeKey } from "@/constants/game";

type BestTimes = Partial<Record<TrackId, number>>;

type SaveShape = {
  coins: number;
  upgrades: Upgrades;
  careerStage: number;
  bestTimes: BestTimes;
  totalDistance: number;
  totalRaces: number;
};

const DEFAULT_SAVE: SaveShape = {
  coins: 120,
  upgrades: { tires: 0, frame: 0, gear: 0 },
  careerStage: 0,
  bestTimes: {},
  totalDistance: 0,
  totalRaces: 0,
};

const STORAGE_KEY = "velocity-pedals:save:v1";

type RaceSummary = {
  trackId: TrackId;
  finished: boolean;
  timeSec: number;
  distance: number;
  coinsEarned: number;
  bonusReward: number;
  isBest: boolean;
  careerAdvanced: boolean;
};

type GameContextValue = {
  ready: boolean;
  state: SaveShape;
  recordRace: (s: {
    trackId: TrackId;
    finished: boolean;
    timeSec: number;
    distance: number;
    coinsCollected: number;
    careerStageIndex?: number;
    careerReward?: number;
  }) => RaceSummary;
  buyUpgrade: (key: UpgradeKey, cost: number) => boolean;
  reset: () => void;
};

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SaveShape>(DEFAULT_SAVE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<SaveShape>;
          setState({ ...DEFAULT_SAVE, ...parsed });
        }
      } catch {
        // ignore
      } finally {
        setReady(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state, ready]);

  const recordRace = useCallback<GameContextValue["recordRace"]>(
    ({
      trackId,
      finished,
      timeSec,
      distance,
      coinsCollected,
      careerStageIndex,
      careerReward,
    }) => {
      let summary: RaceSummary = {
        trackId,
        finished,
        timeSec,
        distance,
        coinsEarned: coinsCollected,
        bonusReward: 0,
        isBest: false,
        careerAdvanced: false,
      };

      setState((prev) => {
        const next = { ...prev };
        next.coins = prev.coins + coinsCollected;
        next.totalDistance = prev.totalDistance + Math.round(distance);
        if (finished) {
          next.totalRaces = prev.totalRaces + 1;
          const prevBest = prev.bestTimes[trackId];
          if (prevBest === undefined || timeSec < prevBest) {
            next.bestTimes = { ...prev.bestTimes, [trackId]: timeSec };
            summary.isBest = true;
          }
          if (
            careerStageIndex !== undefined &&
            careerStageIndex === prev.careerStage
          ) {
            const reward = careerReward ?? 0;
            next.coins = next.coins + reward;
            next.careerStage = prev.careerStage + 1;
            summary.bonusReward = reward;
            summary.careerAdvanced = true;
          }
        }
        summary.coinsEarned = coinsCollected;
        return next;
      });

      return summary;
    },
    [],
  );

  const buyUpgrade = useCallback<GameContextValue["buyUpgrade"]>(
    (key, cost) => {
      let success = false;
      setState((prev) => {
        const lvl = prev.upgrades[key];
        if (lvl >= MAX_LEVEL) return prev;
        if (prev.coins < cost) return prev;
        success = true;
        return {
          ...prev,
          coins: prev.coins - cost,
          upgrades: { ...prev.upgrades, [key]: lvl + 1 },
        };
      });
      return success;
    },
    [],
  );

  const reset = useCallback(() => {
    setState(DEFAULT_SAVE);
  }, []);

  const value = useMemo<GameContextValue>(
    () => ({ ready, state, recordRace, buyUpgrade, reset }),
    [ready, state, recordRace, buyUpgrade, reset],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}
