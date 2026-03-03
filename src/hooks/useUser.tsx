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
  restore: (phone: string) => Promise<string>;
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

  // Listen for auth state changes and load user profile
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

    // Set up auth state listener FIRST
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

    // THEN check existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        await loadUserProfile(session.user.id);
      }
      setLoading(false);
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

    // Set the session from the edge function response
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

    // Use synthetic email for Supabase Auth login
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

    // Load user profile - auth state change listener will handle setting state
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

  const restore = useCallback(async (phone: string) => {
    // Restore is effectively a login - user needs to provide PIN
    // This is kept for biometric auth which stores phone
    const hash = await hashPhone(phone);
    setPhoneHash(hash);

    // Check if we have an active session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('No active session. Please sign in again.');

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
    restore,
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
