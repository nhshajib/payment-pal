import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Roommate {
  id: string;
  user_id: string;
  partner_id: string | null;
  phone_hash: string;
  nickname: string;
  status: string;
  created_at: string;
  partner_name?: string;
}

export function useRoommates(userId: string | null) {
  const [roommates, setRoommates] = useState<Roommate[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRoommates = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('roommates' as any)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;

      // Enrich with partner names
      const enriched: Roommate[] = [];
      for (const r of (data || []) as any[]) {
        let partner_name = r.nickname || '';
        if (r.partner_id && !partner_name) {
          const { data: u } = await supabase
            .from('users')
            .select('name')
            .eq('id', r.partner_id)
            .maybeSingle();
          partner_name = (u as any)?.name || '';
        }
        enriched.push({ ...r, partner_name });
      }
      setRoommates(enriched);
    } catch (err) {
      console.error('fetchRoommates error:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const addRoommate = useCallback(async (phoneHash: string, partnerId?: string, nickname?: string) => {
    if (!userId) return;
    const { error } = await supabase
      .from('roommates' as any)
      .insert({
        user_id: userId,
        phone_hash: phoneHash,
        partner_id: partnerId || null,
        nickname: nickname || '',
        status: partnerId ? 'confirmed' : 'pending',
      } as any);
    if (error) throw error;
    await fetchRoommates();
  }, [userId, fetchRoommates]);

  const removeRoommate = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('roommates' as any)
      .delete()
      .eq('id', id);
    if (error) throw error;
    setRoommates(prev => prev.filter(r => r.id !== id));
  }, []);

  const getConfirmedRoommates = useCallback(() => {
    return roommates.filter(r => r.status === 'confirmed');
  }, [roommates]);

  return { roommates, loading, fetchRoommates, addRoommate, removeRoommate, getConfirmedRoommates };
}
