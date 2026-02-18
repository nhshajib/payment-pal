import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import { format, parseISO, startOfMonth } from 'date-fns';
import type { Payment } from '@/hooks/usePayments';
import { useCurrency } from '@/hooks/useCurrency';

interface Props {
  payments: Payment[];
}

export default function MonthlyChart({ payments }: Props) {
  const { format: formatCurrency } = useCurrency();
  const [expanded, setExpanded] = useState(false);

  const data = useMemo(() => {
    const map = new Map<string, { due: number; paid: number }>();

    payments.forEach(p => {
      const key = format(startOfMonth(parseISO(p.due_date)), 'yyyy-MM');
      const entry = map.get(key) || { due: 0, paid: 0 };
      if (p.is_paid) {
        entry.paid += Number(p.amount);
      } else {
        entry.due += Number(p.amount);
      }
      map.set(key, entry);
    });

    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([key, val]) => ({
        month: format(parseISO(`${key}-01`), 'MMM'),
        fullMonth: format(parseISO(`${key}-01`), 'MMMM yyyy'),
        due: val.due,
        paid: val.paid,
        total: val.due + val.paid,
      }));
  }, [payments]);

  if (data.length < 1) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="mb-5 rounded-2xl glass border border-border/50 overflow-hidden"
    >
      <button
        onClick={() => setExpanded(prev => !prev)}
        className="w-full flex items-center justify-between px-4 py-3"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
            <TrendingUp className="w-3.5 h-3.5 text-primary" />
          </div>
          <p className="text-sm font-semibold text-card-foreground">Monthly Breakdown</p>
        </div>
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </motion.div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data} barGap={2} barSize={16}>
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis hide />
                    <Tooltip
                      cursor={false}
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0]?.payload;
                        return (
                          <div className="bg-card border border-border/60 rounded-xl shadow-xl px-3 py-2 text-xs">
                            <p className="font-semibold text-card-foreground mb-1">{d.fullMonth}</p>
                            <p className="text-status-overdue">Due: {formatCurrency(d.due)}</p>
                            <p className="text-status-success">Paid: {formatCurrency(d.paid)}</p>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="due" stackId="a" radius={[0, 0, 4, 4]} fill="hsl(var(--status-overdue))" />
                    <Bar dataKey="paid" stackId="a" radius={[4, 4, 0, 0]} fill="hsl(var(--status-success))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {/* Legend */}
              <div className="flex items-center justify-center gap-5 mt-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm bg-status-overdue" />
                  <span className="text-[10px] text-muted-foreground">Due</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm bg-status-success" />
                  <span className="text-[10px] text-muted-foreground">Paid</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
