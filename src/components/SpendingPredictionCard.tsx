import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Repeat, ShoppingBag } from 'lucide-react';
import type { Payment } from '@/hooks/usePayments';
import { useCurrency } from '@/hooks/useCurrency';
import PremiumLock from './PremiumLock';
import { startOfMonth, endOfMonth, subMonths, isWithinInterval } from 'date-fns';

interface Props {
  payments: Payment[];
  isPremium: boolean;
  onUpgrade: () => void;
}

export default function SpendingPredictionCard({ payments, isPremium, onUpgrade }: Props) {
  const { format: formatCurrency } = useCurrency();

  const prediction = useMemo(() => {
    const now = new Date();
    const recurringTotal = payments
      .filter(p => p.is_recurring && !p.is_paid)
      .reduce((s, p) => s + Number(p.amount), 0);

    // Average non-recurring spending from last 3 months
    const nonRecurringAvgs = [1, 2, 3].map(i => {
      const s = startOfMonth(subMonths(now, i));
      const e = endOfMonth(subMonths(now, i));
      return payments
        .filter(p => !p.is_recurring && isWithinInterval(new Date(p.due_date), { start: s, end: e }))
        .reduce((sum, p) => sum + Number(p.amount), 0);
    });
    const avgVariable = nonRecurringAvgs.reduce((s, v) => s + v, 0) / 3;

    return {
      recurring: recurringTotal,
      variable: Math.round(avgVariable),
      total: recurringTotal + Math.round(avgVariable),
    };
  }, [payments]);

  if (prediction.total === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.09 }}
      className="mb-5 rounded-2xl bg-card border border-border/50 p-4 relative overflow-hidden"
    >
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-primary" />
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Next Month Forecast</p>
      </div>

      <p className="text-2xl font-bold text-card-foreground mb-3">{formatCurrency(prediction.total)}</p>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Repeat className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs text-muted-foreground">Recurring</span>
          </div>
          <span className="text-xs font-semibold text-card-foreground">{formatCurrency(prediction.recurring)}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-3.5 h-3.5 text-status-warning" />
            <span className="text-xs text-muted-foreground">Variable (avg)</span>
          </div>
          <span className="text-xs font-semibold text-card-foreground">{formatCurrency(prediction.variable)}</span>
        </div>
      </div>

      {!isPremium && (
        <PremiumLock title="Predictions" subtitle="Forecast next month's spending" onUpgrade={onUpgrade} />
      )}
    </motion.div>
  );
}
