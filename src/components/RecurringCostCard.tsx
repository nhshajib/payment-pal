import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Repeat, DollarSign } from 'lucide-react';
import type { Payment } from '@/hooks/usePayments';
import { useCurrency } from '@/hooks/useCurrency';
import { getCategoryById } from '@/lib/categories';
import PremiumLock from './PremiumLock';

interface Props {
  payments: Payment[];
  isPremium: boolean;
  onUpgrade: () => void;
}

export default function RecurringCostCard({ payments, isPremium, onUpgrade }: Props) {
  const { format: formatCurrency } = useCurrency();

  const data = useMemo(() => {
    const recurring = payments.filter(p => p.is_recurring && !p.is_paid);
    const monthly = recurring.reduce((s, p) => s + Number(p.amount), 0);
    const top3 = [...recurring].sort((a, b) => Number(b.amount) - Number(a.amount)).slice(0, 3);
    return { monthly, annual: monthly * 12, top3 };
  }, [payments]);

  if (data.monthly === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.11 }}
      className="mb-5 rounded-2xl bg-card border border-border/50 p-4 relative overflow-hidden"
    >
      <div className="flex items-center gap-2 mb-3">
        <Repeat className="w-4 h-4 text-primary" />
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recurring Costs</p>
      </div>

      <div className="flex items-baseline gap-3 mb-3">
        <div>
          <p className="text-[11px] text-muted-foreground">Monthly</p>
          <p className="text-xl font-bold text-card-foreground">{formatCurrency(data.monthly)}</p>
        </div>
        <div className="h-6 w-px bg-border/50" />
        <div>
          <p className="text-[11px] text-muted-foreground">Annual</p>
          <p className="text-lg font-semibold text-muted-foreground">{formatCurrency(data.annual)}</p>
        </div>
      </div>

      {data.top3.length > 0 && (
        <div className="space-y-2">
          {data.top3.map(p => {
            const cat = getCategoryById(p.category || 'other');
            const Icon = cat.icon;
            return (
              <div key={p.id} className="flex items-center gap-2.5">
                <div
                  className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${cat.color}20` }}
                >
                  <Icon className="w-3 h-3" style={{ color: cat.color }} />
                </div>
                <span className="text-xs text-card-foreground flex-1 truncate">{p.name}</span>
                <span className="text-xs font-semibold text-muted-foreground">{formatCurrency(Number(p.amount))}</span>
              </div>
            );
          })}
        </div>
      )}

      {!isPremium && (
        <PremiumLock title="Recurring Analysis" subtitle="Monthly & annual cost breakdown" onUpgrade={onUpgrade} />
      )}
    </motion.div>
  );
}
