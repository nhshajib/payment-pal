import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { addMonths, format } from 'date-fns';

export interface Payment {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  due_date: string;
  is_paid: boolean;
  reminder_days: number;
  is_recurring: boolean;
  category: string;
  notes: string;
  created_at: string;
}

export function usePayments(userId: string | null) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPayments = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', userId)
      .order('due_date', { ascending: true });

    if (!error && data) {
      setPayments(data as Payment[]);
      localStorage.setItem('paytrack_payments', JSON.stringify(data));
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    // Load from cache first
    const cached = localStorage.getItem('paytrack_payments');
    if (cached) {
      try { setPayments(JSON.parse(cached)); } catch {}
    }
    fetchPayments();
  }, [fetchPayments]);

  const addPayment = useCallback(async (payment: Omit<Payment, 'id' | 'user_id' | 'created_at'>) => {
    if (!userId) return;
    const { data, error } = await supabase
      .from('payments')
      .insert({ ...payment, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    setPayments(prev => [...prev, data as Payment].sort((a, b) => a.due_date.localeCompare(b.due_date)));
  }, [userId]);

  const updatePayment = useCallback(async (id: string, updates: Partial<Payment>) => {
    const { error } = await supabase
      .from('payments')
      .update(updates)
      .eq('id', id);
    if (error) throw error;
    setPayments(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, []);

  const deletePayment = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('payments')
      .delete()
      .eq('id', id);
    if (error) throw error;
    setPayments(prev => prev.filter(p => p.id !== id));
  }, []);

  const markPaid = useCallback(async (payment: Payment) => {
    await updatePayment(payment.id, { is_paid: true });

    // If recurring, create next month's entry
    if (payment.is_recurring && userId) {
      const nextDate = format(addMonths(new Date(payment.due_date), 1), 'yyyy-MM-dd');
      await addPayment({
        name: payment.name,
        amount: payment.amount,
        due_date: nextDate,
        is_paid: false,
        reminder_days: payment.reminder_days,
        is_recurring: true,
        category: payment.category || 'other',
        notes: payment.notes || '',
      });
    }
  }, [updatePayment, addPayment, userId]);

  const clearPaid = useCallback(async (): Promise<Payment[]> => {
    if (!userId) return [];
    const paidPayments = payments.filter(p => p.is_paid);
    if (paidPayments.length === 0) return [];
    const paidIds = paidPayments.map(p => p.id);
    const { error } = await supabase
      .from('payments')
      .delete()
      .in('id', paidIds);
    if (error) throw error;
    setPayments(prev => prev.filter(p => !p.is_paid));
    return paidPayments;
  }, [userId, payments]);

  const restorePayments = useCallback(async (items: Payment[]) => {
    if (!userId || items.length === 0) return;
    const rows = items.map(({ id, user_id, ...rest }) => ({ ...rest, user_id: userId }));
    const { error } = await supabase
      .from('payments')
      .insert(rows)
      .select();
    if (error) throw error;
    await fetchPayments();
  }, [userId, fetchPayments]);

  return { payments, loading, addPayment, updatePayment, deletePayment, markPaid, clearPaid, restorePayments, refetch: fetchPayments };
}
