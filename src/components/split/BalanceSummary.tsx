import { motion } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency';
import type { Settlement, MemberBalance } from '@/hooks/useSplitGroups';

interface Props {
  balances: MemberBalance[];
  settlements: Settlement[];
  onSettle?: (fromId: string, toId: string) => void;
}

export default function BalanceSummary({ balances, settlements, onSettle }: Props) {
  const { format: formatCurrency } = useCurrency();

  if (balances.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Individual Balances */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.8px] text-muted-foreground mb-2 ml-1">
          Balances
        </p>
        <div className="rounded-2xl mono-card overflow-hidden divide-y divide-border/30">
          {balances.map(b => (
            <div key={b.memberId} className="flex items-center justify-between px-4 py-3">
              <span className="text-[15px] font-medium text-foreground">{b.memberName}</span>
              <span className={`text-[15px] font-bold ${
                b.balance > 0.01 ? 'text-emerald-500' : b.balance < -0.01 ? 'text-primary' : 'text-muted-foreground'
              }`}>
                {b.balance > 0.01 ? `+${formatCurrency(b.balance)}` : b.balance < -0.01 ? `-${formatCurrency(Math.abs(b.balance))}` : 'Settled'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Settlements */}
      {settlements.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.8px] text-muted-foreground mb-2 ml-1">
            Who Pays Whom
          </p>
          <div className="space-y-2">
            {settlements.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl mono-card px-4 py-3.5 flex items-center gap-3"
              >
                <div className="flex-1 flex items-center gap-2 min-w-0">
                  <span className="text-sm font-semibold text-foreground truncate">{s.fromName}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 flex-shrink-0" />
                  <span className="text-sm font-semibold text-foreground truncate">{s.toName}</span>
                </div>
                <span className="text-[15px] font-bold text-primary flex-shrink-0">
                  {formatCurrency(s.amount)}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {settlements.length === 0 && balances.every(b => Math.abs(b.balance) < 0.01) && (
        <div className="rounded-2xl mono-card p-5 text-center">
          <Check className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
          <p className="text-sm font-semibold text-foreground">All settled up!</p>
        </div>
      )}
    </div>
  );
}
