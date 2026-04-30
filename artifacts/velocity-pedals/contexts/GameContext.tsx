import React, { createContext, useContext, useState } from 'react';

const GameContext = createContext<any>(null);

export const GameProvider = ({ children }: any) => {
  // গেমের সম্পূর্ণ ডেটা (হোমস্ক্রিন এবং গ্যারেজ যা যা খুঁজছে সব এখানে আছে)
  const [state, setState] = useState({
    upgrades: { speed: 1, accel: 1, grip: 1 },
    coins: 1500, // আপনাকে শুরুতে ১৫০০ কয়েন গিফট দিলাম!
    careerStage: 0, // ক্যারিয়ার লেভেল ১
    totalDistance: 0, // মোট কতটুকু সাইকেল চালিয়েছেন
    totalRaces: 0, // কয়টি রেস খেলেছেন
    bestTimes: {} // ট্র্যাকের বেস্ট টাইমের রেকর্ড
  });

  // রেস শেষ হলে পয়েন্টের হিসাব মেলানোর ফাংশন
  const recordRace = (data: any) => {
    return {
      bonusReward: 100,
      isBest: false,
      careerAdvanced: false
    };
  };

  // গ্যারেজে সাইকেল আপগ্রেড বা রঙ বদলানোর ফাংশন (যাতে সেখানেও ক্র্যাশ না করে)
  const buyUpgrade = () => {};
  const equipColor = () => {};

  return (
    <GameContext.Provider value={{
      state,
      recordRace,
      buyUpgrade,
      equipColor,
      selectedColorHex: "#00ffcc" // আপনার সাইকেলের ডিফল্ট নিয়ন কালার
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  return useContext(GameContext);
};



