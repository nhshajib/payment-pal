import { createContext, useContext, useState, useEffect, useCallback, createElement } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { hashPhone } from '@/lib/hash';
import type { ReactNode } from 'react';

const STORAGE_KEY = 'paytrack_phone_hash';
const USER_ID_KEY = 'paytrack_user_id';
const USER_NAME_KEY = 'paytrack_user_name';

interface UserContextType {
  phoneHash: string | null;
  userId: string | null;
  userName: string;
  loading: boolean;
  isOnboarded: boolean;
  register: (phone: string, name?: string) => Promise<string>;
  restore: (phone: string) => Promise<string>;
  updateName: (name: string) => Promise<void>;
  logout: () => void;
}

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [phoneHash, setPhoneHash] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const storedId = localStorage.getItem(USER_ID_KEY);
    const storedName = localStorage.getItem(USER_NAME_KEY);
    if (stored && storedId) {
      setPhoneHash(stored);
      setUserId(storedId);
      setUserName(storedName || '');
    }
    setLoading(false);
  }, []);

  const register = useCallback(async (phone: string, name?: string) => {
    const hash = await hashPhone(phone);
    const { data: existing } = await supabase
      .from('users')
      .select('id, name')
      .eq('phone_hash', hash)
      .maybeSingle();

    if (existing) {
      localStorage.setItem(STORAGE_KEY, hash);
      localStorage.setItem(USER_ID_KEY, existing.id);
      localStorage.setItem(USER_NAME_KEY, (existing as any).name || name || '');
      setPhoneHash(hash);
      setUserId(existing.id);
      setUserName((existing as any).name || name || '');
      return existing.id;
    }

    const { data: newUser, error } = await supabase
      .from('users')
      .insert({ phone_hash: hash, name: name || '' } as any)
      .select('id')
      .single();

    if (error) throw error;

    localStorage.setItem(STORAGE_KEY, hash);
    localStorage.setItem(USER_ID_KEY, newUser.id);
    localStorage.setItem(USER_NAME_KEY, name || '');
    setPhoneHash(hash);
    setUserId(newUser.id);
    setUserName(name || '');
    return newUser.id;
  }, []);

  const restore = useCallback(async (phone: string) => {
    const hash = await hashPhone(phone);
    const { data: user } = await supabase
      .from('users')
      .select('id, name')
      .eq('phone_hash', hash)
      .maybeSingle();

    if (!user) throw new Error('No account found with that phone number');

    localStorage.setItem(STORAGE_KEY, hash);
    localStorage.setItem(USER_ID_KEY, user.id);
    localStorage.setItem(USER_NAME_KEY, (user as any).name || '');
    setPhoneHash(hash);
    setUserId(user.id);
    setUserName((user as any).name || '');
    return user.id;
  }, []);

  const updateName = useCallback(async (name: string) => {
    if (!userId) return;
    await supabase.from('users').update({ name } as any).eq('id', userId);
    localStorage.setItem(USER_NAME_KEY, name);
    setUserName(name);
  }, [userId]);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(USER_ID_KEY);
    localStorage.removeItem(USER_NAME_KEY);
    setPhoneHash(null);
    setUserId(null);
    setUserName('');
  }, []);

  const value: UserContextType = {
    phoneHash,
    userId,
    userName,
    loading,
    isOnboarded: !!phoneHash,
    register,
    restore,
    updateName,
    logout,
  };

  return createElement(UserContext.Provider, { value }, children);
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}
