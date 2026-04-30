import React, { createContext } from 'react';

export const GameContext = createContext({});

export const GameProvider = ({ children }: any) => {
  return (
    <GameContext.Provider value={{}}>
      {children}
    </GameContext.Provider>
  );
};

