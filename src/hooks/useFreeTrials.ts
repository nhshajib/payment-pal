import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface FreeTrial {
  id: string;
  user_id: string;
  name: string;
  expires_on: string;
  cancel_url: string;
  is_cancelled: boolean;
  notes: string;
  created_at: string;
}

export function useFreeTrials(userId: string | null) {
  const [trials, setTrials] = useState<FreeTrial[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTrials = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('free_trials' as any)
        .select('*')
        .eq('user_id', userId)
        .order('expires_on', { ascending: true });
      if (error) throw error;
      setTrials((data || []) as any as FreeTrial[]);
    } catch (err) {
      console.error('fetchTrials error:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const addTrial = useCallback(async (trial: { name: string; expires_on: string; cancel_url?: string; notes?: string }) => {
    if (!userId) return;
    const { error } = await supabase
      .from('free_trials' as any)
      .insert({
        user_id: userId,
        name: trial.name,
        expires_on: trial.expires_on,
        cancel_url: trial.cancel_url || '',
        notes: trial.notes || '',
      } as any);
    if (error) throw error;
    await fetchTrials();
  }, [userId, fetchTrials]);

  const cancelTrial = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('free_trials' as any)
      .update({ is_cancelled: true } as any)
      .eq('id', id);
    if (error) throw error;
    setTrials(prev => prev.map(t => t.id === id ? { ...t, is_cancelled: true } : t));
  }, []);

  const deleteTrial = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('free_trials' as any)
      .delete()
      .eq('id', id);
    if (error) throw error;
    setTrials(prev => prev.filter(t => t.id !== id));
  }, []);

  return { trials, loading, fetchTrials, addTrial, cancelTrial, deleteTrial };
}
