import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { CalendarCheck, CheckCircle2, Wallet, TrendingUp, TrendingDown } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, isWithinInterval } from 'date-fns';
import { usePayments } from '@/hooks/usePayments';
import { useUser } from '@/hooks/useUser';
import { useCurrency } from '@/hooks/useCurrency';
import MonthlyChart from '@/components/MonthlyChart';
import PageTransition from '@/components/PageTransition';

export default function Overview() {
  const { userId } = useUser();
  const { format: formatCurrency } = useCurrency();
  const { payments } = usePayments(userId);

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
    return { total: thisMonthTotal, change };
  }, [payments]);

  const progressPct = (summary.totalDue + summary.totalPaid) > 0
    ? (summary.totalPaid / (summary.totalDue + summary.totalPaid)) * 100
    : 0;

  return (
    <PageTransition>
      <div className="min-h-screen pb-28 px-4 pt-6 max-w-md mx-auto">
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Overview</h1>
          <p className="text-muted-foreground text-sm">Your financial snapshot</p>
        </motion.header>

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

          {/* Monthly Insight */}
          {monthlyInsight.total > 0 && (
            <div className="px-4 pb-3">
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
            </div>
          )}
        </motion.div>

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
