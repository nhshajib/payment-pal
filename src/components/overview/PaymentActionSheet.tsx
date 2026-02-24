import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, DollarSign, Bell, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCurrency } from '@/hooks/useCurrency';
import type { Payment } from '@/hooks/usePayments';
import { getCategoryById } from '@/lib/categories';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

const REMINDER_OPTIONS = [
  { label: 'Day of', value: 0 },
  { label: '1 day', value: 1 },
  { label: '3 days', value: 3 },
  { label: '1 week', value: 7 },
];

interface Props {
  payment: Payment | null;
  open: boolean;
  onClose: () => void;
  onMarkPaid: (payment: Payment) => void;
  onPartialPay: (payment: Payment, amount: number) => void;
  onUpdateReminder: (payment: Payment, days: number) => void;
  onSetVariableAmount: (payment: Payment, amount: number) => void;
  partialAmounts: Record<string, number>;
}

export default function PaymentActionSheet({
  payment,
  open,
  onClose,
  onMarkPaid,
  onPartialPay,
  onUpdateReminder,
  onSetVariableAmount,
  partialAmounts,
}: Props) {
  const { format: formatCurrency, currency } = useCurrency();
  const [customAmount, setCustomAmount] = useState('');
  const [showPartial, setShowPartial] = useState(false);
  const [variableAmount, setVariableAmount] = useState('');

  if (!payment) return null;

  const cat = getCategoryById(payment.category || 'other');
  const Icon = cat.icon;
  const paidSoFar = partialAmounts[payment.id] || 0;
  const isVariable = payment.amount === 0;
  const remaining = payment.amount - paidSoFar;

  const handleFullPay = () => {
    onMarkPaid(payment);
    onClose();
  };

  const handlePartialPay = () => {
    const amt = parseFloat(customAmount);
    if (!amt || amt <= 0) return;
    onPartialPay(payment, amt);
    setCustomAmount('');
    setShowPartial(false);
    onClose();
  };

  const handleSetVariable = () => {
    const amt = parseFloat(variableAmount);
    if (!amt || amt <= 0) return;
    onSetVariableAmount(payment, amt);
    setVariableAmount('');
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 400 }}
            className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto"
          >
            <div className="bg-card rounded-t-3xl border-t border-border/50 shadow-2xl">
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 rounded-full bg-muted-foreground/20" />
              </div>

              <div className="px-6 pb-8 pt-2 space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center"
                      style={{ backgroundColor: `${cat.color}15` }}
                    >
                      <Icon className="w-6 h-6" style={{ color: cat.color }} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-card-foreground">{payment.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Due {format(parseISO(payment.due_date), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <button onClick={onClose} className="p-1.5 rounded-full bg-secondary">
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>

                {/* Amount Display */}
                <div className="bg-secondary/50 rounded-2xl p-4">
                  {isVariable ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-status-warning" />
                        <span className="text-sm font-medium text-status-warning">Amount TBD</span>
                      </div>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">
                            {currency.symbol}
                          </span>
                          <Input
                            type="number"
                            value={variableAmount}
                            onChange={e => setVariableAmount(e.target.value)}
                            placeholder="0.00"
                            className="pl-8 h-11 bg-card border-border/50 rounded-xl"
                          />
                        </div>
                        <Button onClick={handleSetVariable} className="rounded-xl h-11 px-5">
                          Set
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-baseline justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                          {paidSoFar > 0 ? 'Remaining' : 'Total Due'}
                        </p>
                        <p className="text-3xl font-bold text-card-foreground">
                          {formatCurrency(remaining)}
                        </p>
                      </div>
                      {paidSoFar > 0 && (
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Paid</p>
                          <p className="text-sm font-semibold text-status-success">
                            {formatCurrency(paidSoFar)}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Partial Payment Input */}
                {!isVariable && (
                  <AnimatePresence>
                    {showPartial ? (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">
                              {currency.symbol}
                            </span>
                            <Input
                              type="number"
                              value={customAmount}
                              onChange={e => setCustomAmount(e.target.value)}
                              placeholder="Custom amount"
                              className="pl-8 h-12 bg-secondary/50 border-0 rounded-xl"
                              autoFocus
                            />
                          </div>
                          <Button onClick={handlePartialPay} className="rounded-xl h-12 px-5">
                            Pay
                          </Button>
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                )}

                {/* Reminder Section */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2.5 ml-1">
                    Remind me
                  </p>
                  <div className="flex gap-2">
                    {REMINDER_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => onUpdateReminder(payment, opt.value)}
                        className={cn(
                          'flex-1 py-2 px-2 rounded-xl text-xs font-medium transition-colors',
                          payment.reminder_days === opt.value
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary/70 text-muted-foreground hover:bg-secondary'
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                {!isVariable && (
                  <div className="space-y-2.5">
                    <motion.div whileTap={{ scale: 0.97 }}>
                      <Button
                        onClick={handleFullPay}
                        className="w-full h-13 rounded-2xl text-base font-semibold shadow-lg shadow-primary/20"
                        style={{ height: 52 }}
                      >
                        <Check className="w-5 h-5 mr-2" />
                        Mark as Paid
                      </Button>
                    </motion.div>
                    <motion.div whileTap={{ scale: 0.97 }}>
                      <Button
                        variant="secondary"
                        onClick={() => setShowPartial(!showPartial)}
                        className="w-full h-12 rounded-2xl text-sm font-medium"
                      >
                        <DollarSign className="w-4 h-4 mr-2" />
                        {showPartial ? 'Cancel' : 'Custom Payment Amount'}
                      </Button>
                    </motion.div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
