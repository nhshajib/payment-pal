import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Target } from 'lucide-react';
import type { Payment } from '@/hooks/usePayments';
import { useCurrency } from '@/hooks/useCurrency';
import PremiumLock from './PremiumLock';
import { startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

interface BudgetCardProps {
  payments: Payment[];
  isPremium: boolean;
  budget: number | null;
  onUpgrade: () => void;
  onSetBudget: () => void;
}

export default function BudgetCard({ payments, isPremium, budget, onUpgrade, onSetBudget }: BudgetCardProps) {
  const { format: formatCurrency } = useCurrency();

  const spent = useMemo(() => {
    const now = new Date();
    const s = startOfMonth(now);
    const e = endOfMonth(now);
    return payments
      .filter(p => isWithinInterval(new Date(p.due_date), { start: s, end: e }))
      .reduce((sum, p) => sum + Number(p.amount), 0);
  }, [payments]);

  const pct = budget && budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
  const remaining = budget ? budget - spent : 0;
  const isOver = remaining < 0;

  // SVG circle params
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeColor = pct > 90 ? 'hsl(var(--status-overdue))' : pct > 70 ? 'hsl(var(--status-warning))' : 'hsl(var(--status-success))';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.07 }}
      className="mb-5 rounded-2xl bg-card border border-border/50 p-4 relative overflow-hidden"
    >
      <div className="flex items-center gap-2 mb-3">
        <Target className="w-4 h-4 text-primary" />
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Monthly Budget</p>
      </div>

      {budget && budget > 0 ? (
        <div className="flex items-center gap-5">
          {/* Progress ring */}
          <div className="relative flex-shrink-0">
            <svg width="96" height="96" viewBox="0 0 96 96">
              <circle cx="48" cy="48" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
              <motion.circle
                cx="48" cy="48" r={radius} fill="none"
                stroke={strokeColor}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: circumference * (1 - pct / 100) }}
                transition={{ duration: 1, ease: 'easeOut' }}
                transform="rotate(-90 48 48)"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-bold text-card-foreground">{Math.round(pct)}%</span>
              <span className="text-[9px] text-muted-foreground">used</span>
            </div>
          </div>

          <div className="flex-1 space-y-1.5">
            <div>
              <p className="text-xs text-muted-foreground">Spent</p>
              <p className="text-base font-bold text-card-foreground">{formatCurrency(spent)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Budget</p>
              <p className="text-sm font-semibold text-muted-foreground">{formatCurrency(budget)}</p>
            </div>
            <p className={`text-xs font-semibold ${isOver ? 'text-status-overdue' : 'text-status-success'}`}>
              {isOver ? `${formatCurrency(Math.abs(remaining))} over budget` : `${formatCurrency(remaining)} remaining`}
            </p>
          </div>
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground mb-3">Set a monthly spending limit to track your budget</p>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={isPremium ? onSetBudget : onUpgrade}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold"
          >
            Set Budget
          </motion.button>
        </div>
      )}

      {!isPremium && (
        <PremiumLock title="Budget Goals" subtitle="Track monthly spending limits" onUpgrade={onUpgrade} />
      )}
    </motion.div>
  );
}
