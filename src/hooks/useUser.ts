import { createContext, useContext, useState, useEffect, useCallback, createElement } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { hashPhone } from '@/lib/hash';
import type { ReactNode } from 'react';

const STORAGE_KEY = 'paytrack_phone_hash';
const USER_ID_KEY = 'paytrack_user_id';

interface UserContextType {
  phoneHash: string | null;
  userId: string | null;
  loading: boolean;
  isOnboarded: boolean;
  register: (phone: string) => Promise<string>;
  restore: (phone: string) => Promise<string>;
  logout: () => void;
}

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [phoneHash, setPhoneHash] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const storedId = localStorage.getItem(USER_ID_KEY);
    if (stored && storedId) {
      setPhoneHash(stored);
      setUserId(storedId);
    }
    setLoading(false);
  }, []);

  const register = useCallback(async (phone: string) => {
    const hash = await hashPhone(phone);
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('phone_hash', hash)
      .maybeSingle();

    if (existing) {
      localStorage.setItem(STORAGE_KEY, hash);
      localStorage.setItem(USER_ID_KEY, existing.id);
      setPhoneHash(hash);
      setUserId(existing.id);
      return existing.id;
    }

    const { data: newUser, error } = await supabase
      .from('users')
      .insert({ phone_hash: hash })
      .select('id')
      .single();

    if (error) throw error;

    localStorage.setItem(STORAGE_KEY, hash);
    localStorage.setItem(USER_ID_KEY, newUser.id);
    setPhoneHash(hash);
    setUserId(newUser.id);
    return newUser.id;
  }, []);

  const restore = useCallback(async (phone: string) => {
    const hash = await hashPhone(phone);
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('phone_hash', hash)
      .maybeSingle();

    if (!user) throw new Error('No account found with that phone number');

    localStorage.setItem(STORAGE_KEY, hash);
    localStorage.setItem(USER_ID_KEY, user.id);
    setPhoneHash(hash);
    setUserId(user.id);
    return user.id;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(USER_ID_KEY);
    setPhoneHash(null);
    setUserId(null);
  }, []);

  const value: UserContextType = { phoneHash, userId, loading, isOnboarded: !!phoneHash, register, restore, logout };

  return createElement(UserContext.Provider, { value }, children);
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}
