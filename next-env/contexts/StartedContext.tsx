import { createContext, useContext, useState, ReactNode } from "react";

type StartedContextType = {
  started: boolean;
  setStarted: (value: boolean) => void;
};

const StartedContext = createContext<StartedContextType | undefined>(undefined);

export function StartedProvider({ children }: { children: ReactNode }) {
  const [started, setStarted] = useState(false);

  return (
    <StartedContext.Provider value={{ started, setStarted }}>
      {children}
    </StartedContext.Provider>
  );
}

export function useStarted() {
  const ctx = useContext(StartedContext);
  if (!ctx) throw new Error("useStarted must be used within StartedProvider");
  return ctx;
}
