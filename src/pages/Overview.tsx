import { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CalendarCheck, CheckCircle2, Wallet, TrendingUp, TrendingDown, Plus, Calendar, Shield, ArrowRight, Crown } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, isWithinInterval, addDays, isToday, isTomorrow, isBefore, isAfter, startOfDay } from 'date-fns';
import { usePayments } from '@/hooks/usePayments';
import { useUser } from '@/hooks/useUser';
import { useCurrency } from '@/hooks/useCurrency';
import { usePremium } from '@/hooks/usePremium';
import { CATEGORIES, getCategoryById } from '@/lib/categories';
import MonthlyChart from '@/components/MonthlyChart';
import AdvancedChart from '@/components/AdvancedChart';
import BudgetCard from '@/components/BudgetCard';
import SpendingPredictionCard from '@/components/SpendingPredictionCard';
import RecurringCostCard from '@/components/RecurringCostCard';
import PageTransition from '@/components/PageTransition';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export default function Overview() {
  const { userId } = useUser();
  const { format: formatCurrency } = useCurrency();
  const { payments } = usePayments(userId);
  const { isPremium } = usePremium();
  const navigate = useNavigate();
  const [monthlyBudget, setMonthlyBudget] = useState<number | null>(null);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      const { data } = await supabase.from('users').select('monthly_budget').eq('id', userId).single();
      if (data && (data as any).monthly_budget != null) {
        setMonthlyBudget(Number((data as any).monthly_budget));
      }
    })();
  }, [userId]);

  const summary = useMemo(() => {
    const totalDue = payments.filter(p => !p.is_paid).reduce((s, p) => s + Number(p.amount), 0);
    const totalPaid = payments.filter(p => p.is_paid).reduce((s, p) => s + Number(p.amount), 0);
    const unpaidCount = payments.filter(p => !p.is_paid).length;
    const paidCount = payments.filter(p => p.is_paid).length;
    return { totalDue, totalPaid, unpaidCount, paidCount };
  }, [payments]);

  const monthlyInsight = useMemo(() => {
    const now = new Date();
    const thisStart = startOfMonth(now);
    const thisEnd = endOfMonth(now);
    const lastStart = startOfMonth(subMonths(now, 1));
    const lastEnd = endOfMonth(subMonths(now, 1));

    const thisMonthTotal = payments
      .filter(p => isWithinInterval(new Date(p.due_date), { start: thisStart, end: thisEnd }))
      .reduce((s, p) => s + Number(p.amount), 0);

    const lastMonthTotal = payments
      .filter(p => isWithinInterval(new Date(p.due_date), { start: lastStart, end: lastEnd }))
      .reduce((s, p) => s + Number(p.amount), 0);

    const change = lastMonthTotal === 0 ? null : Math.round(((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100);

    // Rolling 3-month average
    const months3 = [0, 1, 2].map(i => {
      const s = startOfMonth(subMonths(now, i));
      const e = endOfMonth(subMonths(now, i));
      return payments
        .filter(p => isWithinInterval(new Date(p.due_date), { start: s, end: e }))
        .reduce((sum, p) => sum + Number(p.amount), 0);
    });
    const avg3 = months3.reduce((s, v) => s + v, 0) / 3;

    return { total: thisMonthTotal, change, avg3 };
  }, [payments]);

  // Highest expense this month
  const highestExpense = useMemo(() => {
    const now = new Date();
    const thisStart = startOfMonth(now);
    const thisEnd = endOfMonth(now);
    const thisMonthPayments = payments.filter(p =>
      isWithinInterval(new Date(p.due_date), { start: thisStart, end: thisEnd })
    );
    if (thisMonthPayments.length === 0) return null;
    return thisMonthPayments.reduce((max, p) => Number(p.amount) > Number(max.amount) ? p : max, thisMonthPayments[0]);
  }, [payments]);

  // Upcoming bills (next 7 days)
  const upcomingBills = useMemo(() => {
    const today = startOfDay(new Date());
    const weekOut = addDays(today, 7);
    return payments
      .filter(p => !p.is_paid && !isBefore(new Date(p.due_date), today) && !isAfter(new Date(p.due_date), weekOut))
      .sort((a, b) => a.due_date.localeCompare(b.due_date))
      .slice(0, 5);
  }, [payments]);

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    payments.forEach(p => {
      const cat = p.category || 'other';
      map[cat] = (map[cat] || 0) + Number(p.amount);
    });
    const total = Object.values(map).reduce((s, v) => s + v, 0);
    return Object.entries(map)
      .map(([id, amount]) => ({ ...getCategoryById(id), amount, pct: total > 0 ? (amount / total) * 100 : 0 }))
      .sort((a, b) => b.amount - a.amount);
  }, [payments]);

  // Payment streak
  const streak = useMemo(() => {
    const paidOnTime = payments
      .filter(p => p.is_paid)
      .sort((a, b) => b.due_date.localeCompare(a.due_date));
    let count = 0;
    for (const p of paidOnTime) {
      count++;
    }
    return count;
  }, [payments]);

  const progressPct = (summary.totalDue + summary.totalPaid) > 0
    ? (summary.totalPaid / (summary.totalDue + summary.totalPaid)) * 100
    : 0;

  function getRelativeDay(dateStr: string) {
    const d = new Date(dateStr);
    if (isToday(d)) return 'Today';
    if (isTomorrow(d)) return 'Tomorrow';
    return format(d, 'EEEE');
  }

  return (
    <PageTransition>
      <div className="min-h-screen pb-28 px-4 pt-6 max-w-md mx-auto">
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5"
        >
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Overview</h1>
          <p className="text-muted-foreground text-sm">Your financial snapshot</p>
        </motion.header>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.03 }}
          className="flex gap-2.5 mb-5"
        >
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate('/schedule')}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4" />
            Add Payment
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate('/schedule')}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-semibold border border-border/50"
          >
            <Calendar className="w-4 h-4" />
            Schedule
          </motion.button>
        </motion.div>

        {/* Summary Cards */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-5 rounded-2xl glass border border-border/50 overflow-hidden"
        >
          <div className="h-0.5 gradient-accent" />
          <div className="grid grid-cols-2">
            {/* Due */}
            <div className="p-4 relative">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-status-overdue/15 flex items-center justify-center">
                  <CalendarCheck className="w-3.5 h-3.5 text-status-overdue" />
                </div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Due</p>
              </div>
              <p className="text-2xl font-bold text-status-overdue">{formatCurrency(summary.totalDue)}</p>
              <p className="text-xs text-muted-foreground mt-1">{summary.unpaidCount} pending</p>
              <div className="absolute right-0 top-4 bottom-4 w-px bg-border/50" />
            </div>
            {/* Paid */}
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-status-success/15 flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5 text-status-success" />
                </div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Paid</p>
              </div>
              <p className="text-2xl font-bold text-status-success">{formatCurrency(summary.totalPaid)}</p>
              <p className="text-xs text-muted-foreground mt-1">{summary.paidCount} done</p>
            </div>
          </div>

          {/* Progress bar */}
          {(summary.totalDue + summary.totalPaid) > 0 && (
            <div className="px-4 pb-3">
              <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-status-success"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
            </div>
          )}

          {/* Monthly Insight + 3-month average */}
          {monthlyInsight.total > 0 && (
            <div className="px-4 pb-3 space-y-1.5">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Wallet className="w-3.5 h-3.5" />
                <span>This month: <span className="font-semibold text-card-foreground">{formatCurrency(monthlyInsight.total)}</span></span>
                {monthlyInsight.change !== null && (
                  <span className={`flex items-center gap-0.5 font-medium ${monthlyInsight.change > 0 ? 'text-status-overdue' : 'text-status-success'}`}>
                    {monthlyInsight.change > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {Math.abs(monthlyInsight.change)}% vs last
                  </span>
                )}
              </div>
              {monthlyInsight.avg3 > 0 && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>3-month avg: <span className="font-semibold text-card-foreground">{formatCurrency(Math.round(monthlyInsight.avg3))}</span></span>
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Budget Card (Premium) */}
        <BudgetCard
          payments={payments}
          isPremium={isPremium}
          budget={monthlyBudget}
          onUpgrade={() => navigate('/settings')}
          onSetBudget={() => navigate('/settings')}
        />

        {/* Spending Prediction (Premium) */}
        <SpendingPredictionCard
          payments={payments}
          isPremium={isPremium}
          onUpgrade={() => navigate('/settings')}
        />

        {/* Recurring Cost Summary (Premium) */}
        <RecurringCostCard
          payments={payments}
          isPremium={isPremium}
          onUpgrade={() => navigate('/settings')}
        />

        {/* Payment Streak */}
        {streak > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="mb-5 rounded-2xl bg-card border border-border/50 p-4 flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-status-success/15 flex items-center justify-center flex-shrink-0">
              <Shield className="w-6 h-6 text-status-success" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-card-foreground">Payment Streak</p>
              <p className="text-xs text-muted-foreground mt-0.5">{streak} payment{streak !== 1 ? 's' : ''} completed on time</p>
            </div>
            <span className="text-2xl font-bold text-status-success">{streak}</span>
          </motion.div>
        )}

        {/* Upcoming Bills (Next 7 Days) */}
        {upcomingBills.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-5"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-card-foreground">Next 7 Days</p>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/schedule')}
                className="text-xs text-primary font-medium flex items-center gap-1"
              >
                View all <ArrowRight className="w-3 h-3" />
              </motion.button>
            </div>
            <div className="rounded-2xl bg-card border border-border/50 overflow-hidden divide-y divide-border/30">
              {upcomingBills.map((bill, i) => {
                const cat = getCategoryById(bill.category || 'other');
                const Icon = cat.icon;
                return (
                  <motion.div
                    key={bill.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.12 + i * 0.03 }}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${cat.color}20` }}
                    >
                      <Icon className="w-4 h-4" style={{ color: cat.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-card-foreground truncate">{bill.name}</p>
                      <p className="text-[11px] text-muted-foreground">{getRelativeDay(bill.due_date)}</p>
                    </div>
                    <p className="text-sm font-semibold text-card-foreground">{formatCurrency(Number(bill.amount))}</p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Highest Expense This Month */}
        {highestExpense && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="mb-5 rounded-2xl bg-card border border-border/50 p-4 flex items-center gap-4"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Crown className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Highest This Month</p>
              <p className="text-sm font-semibold text-card-foreground truncate mt-0.5">{highestExpense.name}</p>
            </div>
            <p className="text-lg font-bold text-card-foreground flex-shrink-0">{formatCurrency(Number(highestExpense.amount))}</p>
          </motion.div>
        )}

        {/* Category Breakdown */}
        {categoryBreakdown.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.13 }}
            className="mb-5"
          >
            <p className="text-sm font-semibold text-card-foreground mb-3">Spending by Category</p>
            <div className="rounded-2xl bg-card border border-border/50 p-4 space-y-3">
              {categoryBreakdown.map((cat, i) => {
                const Icon = cat.icon;
                return (
                  <div key={cat.id} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="w-3.5 h-3.5" style={{ color: cat.color }} />
                        <span className="text-xs font-medium text-card-foreground">{cat.label}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{formatCurrency(cat.amount)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: cat.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${cat.pct}%` }}
                        transition={{ duration: 0.6, delay: 0.15 + i * 0.05, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Advanced 6-Month Trend (Premium) */}
        <AdvancedChart payments={payments} onUpgrade={() => navigate('/settings')} />

        {/* Monthly Breakdown Chart */}
        <MonthlyChart payments={payments} />

        {/* Empty state */}
        {payments.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-secondary mb-4">
              <Wallet className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-medium">No payment data yet</p>
            <p className="text-muted-foreground/60 text-sm mt-1">Add payments in the Schedule tab to see your overview</p>
          </motion.div>
        )}
      </div>
    </PageTransition>
  );
}
