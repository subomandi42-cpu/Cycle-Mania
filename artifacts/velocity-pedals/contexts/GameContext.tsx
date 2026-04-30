import React, { createContext, useContext, useState } from 'react';

// গেমের ডেটা রাখার জায়গা
const GameContext = createContext<any>(null);

export const GameProvider = ({ children }: any) => {
  // গেমের ডিফল্ট হিসাব (কয়েন এবং সাইকেলের আপগ্রেড)
  const [state, setState] = useState({
    upgrades: { speed: 1, accel: 1, grip: 1 },
    coins: 500, // আপনাকে শুরুতে ৫০০ কয়েন বোনাস দিয়ে দিলাম!
  });

  // রেস শেষ হলে পয়েন্টের হিসাব
  const recordRace = (data: any) => {
    return {
      bonusReward: 50,
      isBest: false,
      careerAdvanced: false
    };
  };

  return (
    <GameContext.Provider value={{
      state,
      recordRace,
      selectedColorHex: "#00FF00" // সাইকেলের ডিফল্ট রং (সবুজ)
    }}>
      {children}
    </GameContext.Provider>
  );
};

// এই useGame ফাংশনটাই আপনার গেম খুঁজছিল!
export const useGame = () => {
  return useContext(GameContext);
};


