import { createContext, useContext, useState, useEffect, useCallback, createElement } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { hashPhone, hashPin } from '@/lib/hash';
import type { ReactNode } from 'react';

const USER_NAME_KEY = 'paytrack_user_name';

interface UserContextType {
  phoneHash: string | null;
  userId: string | null;
  userName: string;
  loading: boolean;
  isOnboarded: boolean;
  register: (phone: string, name: string, pin: string) => Promise<string>;
  login: (phone: string, pin: string) => Promise<string>;
  restoreFromBiometric: (phoneHash: string) => Promise<string>;
  updateName: (name: string) => Promise<void>;
  changePin: (currentPin: string, newPin: string) => Promise<void>;
  resetPin: (phone: string, newPin: string) => Promise<void>;
  logout: () => void;
}

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [phoneHash, setPhoneHash] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserProfile = async (authUserId: string) => {
      const { data } = await supabase
        .from('users')
        .select('id, name, phone_hash')
        .eq('auth_id', authUserId)
        .maybeSingle();

      if (data) {
        setUserId(data.id);
        setPhoneHash((data as any).phone_hash);
        setUserName((data as any).name || '');
        localStorage.setItem(USER_NAME_KEY, (data as any).name || '');
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await loadUserProfile(session.user.id);
      } else {
        setPhoneHash(null);
        setUserId(null);
        setUserName('');
      }
      setLoading(false);
    });

    // Fallback: if onAuthStateChange hasn't fired within 3s, check session directly
    const sessionTimeout = setTimeout(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await loadUserProfile(session.user.id);
        }
      } catch {
        // Supabase unreachable — will be caught by timeout in App
      } finally {
        setLoading(false);
      }
    }, 3000);

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      clearTimeout(sessionTimeout);
      if (session?.user) {
        await loadUserProfile(session.user.id);
      }
      setLoading(false);
    }).catch(() => {
      // Network error — let the 3s fallback handle it
    });

    return () => subscription.unsubscribe();
  }, []);

  const register = useCallback(async (phone: string, name: string, pin: string) => {
    const hash = await hashPhone(phone);
    const pinH = await hashPin(pin);

    const { data, error } = await supabase.functions.invoke('auth-register', {
      body: { phone_hash: hash, pin_hash: pinH, name },
    });

    if (error) throw new Error(error.message || 'Registration failed');
    if (data?.error) throw new Error(data.error);

    if (data?.session) {
      await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });
    }

    setPhoneHash(hash);
    setUserId(data.user_id);
    setUserName(data.name || name);
    localStorage.setItem(USER_NAME_KEY, data.name || name);

    return data.user_id;
  }, []);

  const login = useCallback(async (phone: string, pin: string) => {
    const hash = await hashPhone(phone);
    const pinH = await hashPin(pin);

    const email = `${hash.slice(0, 40)}@paytrack.app`;

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: pinH,
    });

    if (signInError) {
      if (signInError.message?.includes('Invalid login')) {
        throw new Error('No account found or incorrect PIN');
      }
      throw signInError;
    }

    const { data: userData } = await supabase
      .from('users')
      .select('id, name, phone_hash')
      .eq('auth_id', signInData.user.id)
      .maybeSingle();

    if (!userData) throw new Error('User profile not found');

    setPhoneHash((userData as any).phone_hash);
    setUserId(userData.id);
    setUserName((userData as any).name || '');
    localStorage.setItem(USER_NAME_KEY, (userData as any).name || '');

    return userData.id;
  }, []);

  // Biometric restore: uses existing session, takes phone_hash directly (no re-hashing)
  const restoreFromBiometric = useCallback(async (storedPhoneHash: string) => {
    setPhoneHash(storedPhoneHash);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Session expired. Please sign in with your PIN.');

    const { data: userData } = await supabase
      .from('users')
      .select('id, name')
      .eq('auth_id', session.user.id)
      .maybeSingle();

    if (!userData) throw new Error('No account found');

    setUserId(userData.id);
    setUserName((userData as any).name || '');
    localStorage.setItem(USER_NAME_KEY, (userData as any).name || '');
    return userData.id;
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
    const newHash = await hashPin(newPin);

    const { data, error } = await supabase.functions.invoke('auth-change-pin', {
      body: { current_pin_hash: currentHash, new_pin_hash: newHash },
    });

    if (error) throw new Error(error.message || 'Failed to change PIN');
    if (data?.error) throw new Error(data.error);
  }, [userId]);

  const resetPin = useCallback(async (phone: string, newPin: string) => {
    const hash = await hashPhone(phone);
    const newHash = await hashPin(newPin);

    const { data, error } = await supabase.functions.invoke('auth-reset-pin', {
      body: { phone_hash: hash, new_pin_hash: newHash },
    });

    if (error) throw new Error(error.message || 'Failed to reset PIN');
    if (data?.error) throw new Error(data.error);
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
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
    isOnboarded: !!userId,
    register,
    login,
    restoreFromBiometric,
    updateName,
    changePin,
    resetPin,
    logout,
  };

  return createElement(UserContext.Provider, { value }, children);
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}
