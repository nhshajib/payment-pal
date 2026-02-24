import { useState, useCallback, useMemo } from 'react';
import { addMonths, setDate, startOfDay, isAfter, format, parseISO } from 'date-fns';

const STORAGE_KEY = 'paytrack_paydays';
const DEFAULT_DAYS = [1, 15]; // 1st and 15th of each month

function getStoredDays(): number[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return DEFAULT_DAYS;
}

export function usePaydays() {
  const [payDays, setPayDays] = useState<number[]>(getStoredDays);

  const updatePayDays = useCallback((days: number[]) => {
    const sorted = [...new Set(days)].sort((a, b) => a - b);
    setPayDays(sorted);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
  }, []);

  const upcomingPaydays = useMemo(() => {
    const today = startOfDay(new Date());
    const results: Date[] = [];
    
    // Generate next 4 payday dates
    for (let monthOffset = 0; monthOffset <= 2; monthOffset++) {
      for (const day of payDays) {
        const date = startOfDay(setDate(addMonths(today, monthOffset), day));
        if (isAfter(date, today) || format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
          results.push(date);
        }
      }
    }
    
    return results.sort((a, b) => a.getTime() - b.getTime()).slice(0, 6);
  }, [payDays]);

  const nextPayday = upcomingPaydays[0] || null;

  return { payDays, updatePayDays, upcomingPaydays, nextPayday };
}
