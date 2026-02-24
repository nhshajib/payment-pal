import { createContext, useContext, useState, useEffect, useCallback, createElement } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { hashPhone, hashPin } from '@/lib/hash';
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
  register: (phone: string, name: string, pin: string) => Promise<string>;
  login: (phone: string, pin: string) => Promise<string>;
  restore: (phone: string) => Promise<string>;
  updateName: (name: string) => Promise<void>;
  changePin: (currentPin: string, newPin: string) => Promise<void>;
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

  const setSession = (hash: string, id: string, name: string) => {
    localStorage.setItem(STORAGE_KEY, hash);
    localStorage.setItem(USER_ID_KEY, id);
    localStorage.setItem(USER_NAME_KEY, name);
    setPhoneHash(hash);
    setUserId(id);
    setUserName(name);
  };

  const register = useCallback(async (phone: string, name: string, pin: string) => {
    const hash = await hashPhone(phone);
    const pinH = await hashPin(pin);

    // Check if user already exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('phone_hash', hash)
      .maybeSingle();

    if (existing) throw new Error('An account with this phone number already exists. Please sign in instead.');

    const { data: newUser, error } = await supabase
      .from('users')
      .insert({ phone_hash: hash, name, pin_hash: pinH, phone_number: phone } as any)
      .select('id')
      .single();

    if (error) throw error;

    setSession(hash, newUser.id, name);
    return newUser.id;
  }, []);

  const login = useCallback(async (phone: string, pin: string) => {
    const hash = await hashPhone(phone);
    const pinH = await hashPin(pin);

    const { data: user } = await supabase
      .from('users')
      .select('id, name, pin_hash')
      .eq('phone_hash', hash)
      .maybeSingle();

    if (!user) throw new Error('No account found with that phone number');
    if ((user as any).pin_hash !== pinH) throw new Error('Incorrect PIN');

    setSession(hash, user.id, (user as any).name || '');
    return user.id;
  }, []);

  const restore = useCallback(async (phone: string) => {
    const hash = await hashPhone(phone);
    const { data: user } = await supabase
      .from('users')
      .select('id, name')
      .eq('phone_hash', hash)
      .maybeSingle();

    if (!user) throw new Error('No account found with that phone number');

    setSession(hash, user.id, (user as any).name || '');
    return user.id;
  }, []);

  const updateName = useCallback(async (name: string) => {
    if (!userId) return;
    await supabase.from('users').update({ name } as any).eq('id', userId);
    localStorage.setItem(USER_NAME_KEY, name);
    setUserName(name);
  }, [userId]);

  const changePin = useCallback(async (currentPin: string, newPin: string) => {
    if (!userId) throw new Error('Not logged in');
    const currentHash = await hashPin(currentPin);
    const { data: user } = await supabase
      .from('users')
      .select('pin_hash')
      .eq('id', userId)
      .single();

    if (!user || (user as any).pin_hash !== currentHash) {
      throw new Error('Current PIN is incorrect');
    }

    const newHash = await hashPin(newPin);
    const { error } = await supabase
      .from('users')
      .update({ pin_hash: newHash } as any)
      .eq('id', userId);

    if (error) throw error;
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
    login,
    restore,
    updateName,
    changePin,
    logout,
  };

  return createElement(UserContext.Provider, { value }, children);
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}
