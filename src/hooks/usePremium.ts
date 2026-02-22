import { createContext, useContext, useState, useCallback, useEffect, createElement } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PremiumContextType {
  isPremium: boolean;
  setPremium: (v: boolean) => void;
  accentColor: string;
  setAccentColor: (color: string) => void;
}

const STORAGE_KEY = 'paytrack_premium';
const ACCENT_KEY = 'paytrack_accent';
const PremiumContext = createContext<PremiumContextType | null>(null);

export const ACCENT_COLORS = [
  { id: 'red', label: 'Red', hsl: '358 94% 47%', hslLight: '358 94% 42%' },
  { id: 'blue', label: 'Blue', hsl: '217 91% 60%', hslLight: '217 91% 50%' },
  { id: 'purple', label: 'Purple', hsl: '262 83% 58%', hslLight: '262 83% 48%' },
  { id: 'green', label: 'Green', hsl: '142 71% 45%', hslLight: '142 71% 35%' },
  { id: 'orange', label: 'Orange', hsl: '25 95% 53%', hslLight: '25 95% 43%' },
  { id: 'teal', label: 'Teal', hsl: '173 80% 40%', hslLight: '173 80% 32%' },
];

function applyAccent(colorId: string) {
  const color = ACCENT_COLORS.find(c => c.id === colorId) || ACCENT_COLORS[0];
  const root = document.documentElement;
  // Check if light mode
  const isLight = root.classList.contains('light');
  root.style.setProperty('--primary', isLight ? color.hslLight : color.hsl);
  root.style.setProperty('--ring', isLight ? color.hslLight : color.hsl);
}

export function PremiumProvider({ children }: { children: ReactNode }) {
  const [isPremium, setIsPremium] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  });

  const [accentColor, setAccentColorState] = useState(() => {
    return localStorage.getItem(ACCENT_KEY) || 'red';
  });

  const setPremium = useCallback((v: boolean) => {
    setIsPremium(v);
    localStorage.setItem(STORAGE_KEY, String(v));
  }, []);

  const setAccentColor = useCallback((colorId: string) => {
    setAccentColorState(colorId);
    localStorage.setItem(ACCENT_KEY, colorId);
    applyAccent(colorId);
  }, []);

  // Apply accent on mount and theme changes
  useEffect(() => {
    if (isPremium && accentColor !== 'red') {
      applyAccent(accentColor);
    }

    // Observe theme class changes to reapply accent
    const observer = new MutationObserver(() => {
      if (isPremium && accentColor !== 'red') {
        applyAccent(accentColor);
      }
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, [isPremium, accentColor]);

  // Sync with database on mount
  useEffect(() => {
    const userId = localStorage.getItem('paytrack_user_id');
    if (!userId) return;

    (async () => {
      const { data } = await supabase
        .from('users')
        .select('is_premium')
        .eq('id', userId)
        .single();
      if (data && (data as any).is_premium) {
        setPremium(true);
      }
    })();
  }, [setPremium]);

  return createElement(
    PremiumContext.Provider,
    { value: { isPremium, setPremium, accentColor, setAccentColor } },
    children
  );
}

export function usePremium() {
  const ctx = useContext(PremiumContext);
  if (!ctx) throw new Error('usePremium must be used within PremiumProvider');
  return ctx;
}
