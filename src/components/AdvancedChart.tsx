import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { subMonths, startOfMonth, endOfMonth, isWithinInterval, format } from 'date-fns';
import { Crown, TrendingUp, Lock } from 'lucide-react';
import { usePremium } from '@/hooks/usePremium';
import { useCurrency } from '@/hooks/useCurrency';
import type { Payment } from '@/hooks/usePayments';

interface Props {
  payments: Payment[];
  onUpgrade: () => void;
}

export default function AdvancedChart({ payments, onUpgrade }: Props) {
  const { isPremium } = usePremium();
  const { format: formatCurrency } = useCurrency();

  const chartData = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const monthDate = subMonths(now, 5 - i);
      const s = startOfMonth(monthDate);
      const e = endOfMonth(monthDate);
      const total = payments
        .filter(p => isWithinInterval(new Date(p.due_date), { start: s, end: e }))
        .reduce((sum, p) => sum + Number(p.amount), 0);
      return {
        month: format(monthDate, 'MMM'),
        amount: total,
      };
    });
  }, [payments]);

  const hasData = chartData.some(d => d.amount > 0);
  if (!hasData) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="mb-5"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          <p className="text-sm font-semibold text-card-foreground">6-Month Trend</p>
        </div>
        {isPremium && (
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/15 text-primary flex items-center gap-1">
            <Crown className="w-3 h-3" /> Premium
          </span>
        )}
      </div>

      <div className="rounded-2xl bg-card border border-border/50 p-4 relative overflow-hidden">
        {!isPremium && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onUpgrade}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-card/80 backdrop-blur-sm"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Lock className="w-6 h-6 text-primary" />
            </div>
            <p className="text-sm font-semibold text-card-foreground">Unlock with Premium</p>
            <p className="text-xs text-muted-foreground">Advanced 6-month analytics</p>
          </motion.button>
        )}

        <div className={!isPremium ? 'blur-sm pointer-events-none select-none' : ''}>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(v) => v === 0 ? '0' : `${(v / 1000).toFixed(v >= 1000 ? 1 : 0)}k`}
              />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: 'hsl(var(--card-foreground))',
                }}
                formatter={(value: number) => [formatCurrency(value), 'Spending']}
              />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#colorAmount)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
}
