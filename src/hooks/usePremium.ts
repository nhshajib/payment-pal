import { createContext, useContext, useState, useCallback, createElement } from 'react';
import type { ReactNode } from 'react';

interface PremiumContextType {
  isPremium: boolean;
  setPremium: (v: boolean) => void;
}

const STORAGE_KEY = 'paytrack_premium';
const PremiumContext = createContext<PremiumContextType | null>(null);

export function PremiumProvider({ children }: { children: ReactNode }) {
  const [isPremium, setIsPremium] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  });

  const setPremium = useCallback((v: boolean) => {
    setIsPremium(v);
    localStorage.setItem(STORAGE_KEY, String(v));
  }, []);

  return createElement(
    PremiumContext.Provider,
    { value: { isPremium, setPremium } },
    children
  );
}

export function usePremium() {
  const ctx = useContext(PremiumContext);
  if (!ctx) throw new Error('usePremium must be used within PremiumProvider');
  return ctx;
}
