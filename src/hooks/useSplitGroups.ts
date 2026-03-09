import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SplitGroup {
  id: string;
  user_id: string;
  name: string;
  emoji: string;
  created_at: string;
}

export interface SplitMember {
  id: string;
  group_id: string;
  name: string;
  is_owner: boolean;
  created_at: string;
}

export interface SplitExpense {
  id: string;
  group_id: string;
  title: string;
  amount: number;
  paid_by: string;
  date: string;
  notes: string;
  created_at: string;
}

export interface SplitShare {
  id: string;
  expense_id: string;
  member_id: string;
  amount: number;
  is_settled: boolean;
  created_at: string;
}

export interface MemberBalance {
  memberId: string;
  memberName: string;
  balance: number; // positive = owed money, negative = owes money
}

export interface Settlement {
  from: string;
  fromName: string;
  to: string;
  toName: string;
  amount: number;
}

export function useSplitGroups(userId: string | null) {
  const [groups, setGroups] = useState<SplitGroup[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchGroups = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data } = await supabase
      .from('split_groups')
      .select('*')
      .order('created_at', { ascending: false });
    setGroups((data as any[]) || []);
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  const createGroup = useCallback(async (name: string, emoji: string, memberNames: string[], ownerName: string) => {
    if (!userId) return null;
    const { data: group, error } = await supabase
      .from('split_groups')
      .insert({ user_id: userId, name, emoji } as any)
      .select()
      .single();
    if (error || !group) return null;
    const g = group as any;

    // Add owner as first member
    const members = [
      { group_id: g.id, name: ownerName || 'Me', is_owner: true },
      ...memberNames.map(n => ({ group_id: g.id, name: n, is_owner: false })),
    ];
    await supabase.from('split_members').insert(members as any);
    await fetchGroups();
    return g as SplitGroup;
  }, [userId, fetchGroups]);

  const deleteGroup = useCallback(async (groupId: string) => {
    await supabase.from('split_groups').delete().eq('id', groupId);
    setGroups(prev => prev.filter(g => g.id !== groupId));
  }, []);

  return { groups, loading, fetchGroups, createGroup, deleteGroup };
}

export function useSplitGroupDetail(groupId: string | null) {
  const [members, setMembers] = useState<SplitMember[]>([]);
  const [expenses, setExpenses] = useState<SplitExpense[]>([]);
  const [shares, setShares] = useState<SplitShare[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!groupId) return;
    setLoading(true);
    const [mRes, eRes] = await Promise.all([
      supabase.from('split_members').select('*').eq('group_id', groupId).order('created_at'),
      supabase.from('split_expenses').select('*').eq('group_id', groupId).order('date', { ascending: false }),
    ]);
    const membersData = (mRes.data as any[]) || [];
    const expensesData = (eRes.data as any[]) || [];
    setMembers(membersData);
    setExpenses(expensesData);

    if (expensesData.length > 0) {
      const expenseIds = expensesData.map((e: any) => e.id);
      const { data: sharesData } = await supabase
        .from('split_shares')
        .select('*')
        .in('expense_id', expenseIds);
      setShares((sharesData as any[]) || []);
    } else {
      setShares([]);
    }
    setLoading(false);
  }, [groupId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const addMember = useCallback(async (name: string) => {
    if (!groupId) return;
    await supabase.from('split_members').insert({ group_id: groupId, name } as any);
    await fetchAll();
  }, [groupId, fetchAll]);

  const removeMember = useCallback(async (memberId: string) => {
    await supabase.from('split_members').delete().eq('id', memberId);
    await fetchAll();
  }, [fetchAll]);

  const addExpense = useCallback(async (
    title: string,
    amount: number,
    paidById: string,
    participantIds: string[],
    date: string,
    notes: string = ''
  ) => {
    if (!groupId || participantIds.length === 0) return;
    const { data: expense } = await supabase
      .from('split_expenses')
      .insert({ group_id: groupId, title, amount, paid_by: paidById, date, notes } as any)
      .select()
      .single();
    if (!expense) return;
    const e = expense as any;
    const shareAmount = amount / participantIds.length;
    const shareRows = participantIds.map(mid => ({
      expense_id: e.id,
      member_id: mid,
      amount: Math.round(shareAmount * 100) / 100,
    }));
    await supabase.from('split_shares').insert(shareRows as any);
    await fetchAll();
  }, [groupId, fetchAll]);

  const deleteExpense = useCallback(async (expenseId: string) => {
    await supabase.from('split_expenses').delete().eq('id', expenseId);
    await fetchAll();
  }, [fetchAll]);

  const updateExpense = useCallback(async (
    expenseId: string,
    title: string,
    amount: number,
    paidById: string,
    participantIds: string[],
    date: string,
    notes: string = ''
  ) => {
    if (!groupId || participantIds.length === 0) return;
    await supabase
      .from('split_expenses')
      .update({ title, amount, paid_by: paidById, date, notes } as any)
      .eq('id', expenseId);
    // Delete old shares and recreate
    await supabase.from('split_shares').delete().eq('expense_id', expenseId);
    const shareAmount = amount / participantIds.length;
    const shareRows = participantIds.map(mid => ({
      expense_id: expenseId,
      member_id: mid,
      amount: Math.round(shareAmount * 100) / 100,
    }));
    await supabase.from('split_shares').insert(shareRows as any);
    await fetchAll();
  }, [groupId, fetchAll]);

  const settleShare = useCallback(async (shareId: string, settled: boolean) => {
    await supabase.from('split_shares').update({ is_settled: settled } as any).eq('id', shareId);
    setShares(prev => prev.map(s => s.id === shareId ? { ...s, is_settled: settled } : s));
  }, []);

  // Calculate balances: positive = is owed money, negative = owes money
  // Only count UNSETTLED shares between DIFFERENT members
  const balances: MemberBalance[] = members.map(member => {
    let credit = 0;  // others owe me (unsettled shares on expenses I paid)
    let debit = 0;   // I owe others (my unsettled shares on expenses others paid)

    expenses.forEach(exp => {
      const expShares = shares.filter(s => s.expense_id === exp.id);
      expShares.forEach(share => {
        if (!share.is_settled) {
          // If I paid and this share belongs to someone else -> they owe me
          if (exp.paid_by === member.id && share.member_id !== member.id) {
            credit += Number(share.amount);
          }
          // If someone else paid and this share is mine -> I owe them
          else if (exp.paid_by !== member.id && share.member_id === member.id) {
            debit += Number(share.amount);
          }
        }
      });
    });

    return { memberId: member.id, memberName: member.name, balance: credit - debit };
  });

  // Simplified settlements
  const settlements: Settlement[] = [];
  const debtors = balances.filter(b => b.balance < 0).map(b => ({ ...b, balance: Math.abs(b.balance) }));
  const creditors = balances.filter(b => b.balance > 0).map(b => ({ ...b }));
  
  debtors.sort((a, b) => b.balance - a.balance);
  creditors.sort((a, b) => b.balance - a.balance);

  let di = 0, ci = 0;
  const dCopy = debtors.map(d => ({ ...d }));
  const cCopy = creditors.map(c => ({ ...c }));
  
  while (di < dCopy.length && ci < cCopy.length) {
    const amount = Math.min(dCopy[di].balance, cCopy[ci].balance);
    if (amount > 0.01) {
      settlements.push({
        from: dCopy[di].memberId,
        fromName: dCopy[di].memberName,
        to: cCopy[ci].memberId,
        toName: cCopy[ci].memberName,
        amount: Math.round(amount * 100) / 100,
      });
    }
    dCopy[di].balance -= amount;
    cCopy[ci].balance -= amount;
    if (dCopy[di].balance < 0.01) di++;
    if (cCopy[ci].balance < 0.01) ci++;
  }

  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return {
    members, expenses, shares, loading,
    fetchAll, addMember, removeMember,
    addExpense, deleteExpense, updateExpense, settleShare,
    balances, settlements, totalExpenses,
  };
}
