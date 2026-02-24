import { useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, AlertTriangle, Clock, CalendarClock, Plus } from 'lucide-react';
import { addDays, isBefore, startOfDay, isAfter, parseISO, endOfDay } from 'date-fns';
import { usePayments, type Payment } from '@/hooks/usePayments';
import { useUser } from '@/hooks/useUser';
import { useCurrency } from '@/hooks/useCurrency';
import PageTransition from '@/components/PageTransition';
import BillItem from '@/components/overview/BillItem';
import PaymentActionSheet from '@/components/overview/PaymentActionSheet';
import AddPaymentSheet from '@/components/AddPaymentSheet';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function Overview() {
  const { userId } = useUser();
  const { format: formatCurrency } = useCurrency();
  const { payments, markPaid, updatePayment, addPayment } = usePayments(userId);
  const navigate = useNavigate();

  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [actionOpen, setActionOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  // Local state for partial payments & variable amounts (frontend-only)
  const [partialAmounts, setPartialAmounts] = useState<Record<string, number>>({});
  const [variableAmounts, setVariableAmounts] = useState<Record<string, number>>({});
  const [paidAnimating, setPaidAnimating] = useState<Set<string>>(new Set());

  const unpaid = useMemo(() => payments.filter(p => !p.is_paid), [payments]);

  const today = startOfDay(new Date());
  const weekEnd = endOfDay(addDays(today, 7));

  // Total due next 7 days
  const totalNext7 = useMemo(() => {
    return unpaid
      .filter(p => {
        const d = parseISO(p.due_date);
        return !isAfter(d, weekEnd);
      })
      .reduce((sum, p) => {
        const variable = variableAmounts[p.id];
        const amt = p.amount === 0 ? (variable || 0) : p.amount;
        const partial = partialAmounts[p.id] || 0;
        return sum + Math.max(0, amt - partial);
      }, 0);
  }, [unpaid, weekEnd, partialAmounts, variableAmounts]);

  // Grouped bills
  const groups = useMemo(() => {
    const overdue: Payment[] = [];
    const thisWeek: Payment[] = [];
    const later: Payment[] = [];

    unpaid.forEach(p => {
      const d = parseISO(p.due_date);
      if (isBefore(d, today)) {
        overdue.push(p);
      } else if (!isAfter(d, weekEnd)) {
        thisWeek.push(p);
      } else {
        later.push(p);
      }
    });

    return { overdue, thisWeek, later };
  }, [unpaid, today, weekEnd]);

  const handleTap = useCallback((p: Payment) => {
    setSelectedPayment(p);
    setActionOpen(true);
  }, []);

  const handleSwipePay = useCallback(async (p: Payment) => {
    setPaidAnimating(prev => new Set(prev).add(p.id));
    // Small delay for exit animation
    setTimeout(async () => {
      await markPaid(p);
      setPaidAnimating(prev => {
        const next = new Set(prev);
        next.delete(p.id);
        return next;
      });
      toast.success(`${p.name} marked as paid`);
    }, 400);
  }, [markPaid]);

  const handlePartialPay = useCallback((p: Payment, amount: number) => {
    setPartialAmounts(prev => ({
      ...prev,
      [p.id]: (prev[p.id] || 0) + amount,
    }));
    const total = (partialAmounts[p.id] || 0) + amount;
    if (total >= p.amount) {
      handleSwipePay(p);
    } else {
      toast.success(`Partial payment of ${amount} recorded`);
    }
  }, [partialAmounts, handleSwipePay]);

  const handleSetVariable = useCallback(async (p: Payment, amount: number) => {
    setVariableAmounts(prev => ({ ...prev, [p.id]: amount }));
    await updatePayment(p.id, { amount });
    toast.success(`Amount set to ${amount}`);
  }, [updatePayment]);

  const handleUpdateReminder = useCallback(async (p: Payment, days: number) => {
    await updatePayment(p.id, { reminder_days: days });
    toast.success('Reminder updated');
  }, [updatePayment]);

  const handleAddSubmit = useCallback(async (data: Omit<Payment, 'id' | 'user_id' | 'created_at'>) => {
    await addPayment(data);
    toast.success('Payment added');
  }, [addPayment]);

  const renderGroup = (title: string, items: Payment[], icon: React.ReactNode, accent?: string) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3 ml-1">
          {icon}
          <span className={`text-xs font-semibold uppercase tracking-wider ${accent || 'text-muted-foreground'}`}>
            {title}
          </span>
          <span className="text-xs text-muted-foreground/60 ml-auto mr-1">{items.length}</span>
        </div>
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {items
              .filter(p => !paidAnimating.has(p.id))
              .map(p => (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -200, scale: 0.9, transition: { duration: 0.3 } }}
                >
                  <BillItem
                    payment={p}
                    onTap={handleTap}
                    onSwipePay={handleSwipePay}
                    partialAmount={partialAmounts[p.id]}
                    isVariable={p.amount === 0 && !variableAmounts[p.id]}
                  />
                </motion.div>
              ))}
          </AnimatePresence>
        </div>
      </div>
    );
  };

  return (
    <PageTransition>
      <div className="min-h-screen pb-28 px-5 pt-8 max-w-md mx-auto">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Overview</h1>
        </motion.header>

        {/* Summary Card — Total Due Next 7 Days */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-8 rounded-3xl bg-card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Due Next 7 Days
            </p>
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-primary" />
            </div>
          </div>
          <p className="text-4xl font-bold text-card-foreground tracking-tight">
            {formatCurrency(totalNext7)}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            {unpaid.length} bill{unpaid.length !== 1 ? 's' : ''} remaining
          </p>
        </motion.div>

        {/* Quick Add */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="mb-8"
        >
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setAddOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-border text-sm font-medium text-muted-foreground hover:text-card-foreground hover:border-muted-foreground/40 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Payment
          </motion.button>
        </motion.div>

        {/* Bill Groups */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {renderGroup(
            'Overdue',
            groups.overdue,
            <AlertTriangle className="w-3.5 h-3.5 text-status-overdue" />,
            'text-status-overdue'
          )}
          {renderGroup(
            'This Week',
            groups.thisWeek,
            <Clock className="w-3.5 h-3.5 text-primary" />,
            'text-primary'
          )}
          {renderGroup(
            'Later',
            groups.later,
            <CalendarClock className="w-3.5 h-3.5 text-muted-foreground" />
          )}
        </motion.div>

        {/* Empty State */}
        {unpaid.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-secondary mb-4">
              <Wallet className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="text-card-foreground font-semibold">All clear!</p>
            <p className="text-muted-foreground text-sm mt-1">No upcoming payments</p>
          </motion.div>
        )}

        {/* Action Sheet */}
        <PaymentActionSheet
          payment={selectedPayment}
          open={actionOpen}
          onClose={() => setActionOpen(false)}
          onMarkPaid={handleSwipePay}
          onPartialPay={handlePartialPay}
          onUpdateReminder={handleUpdateReminder}
          onSetVariableAmount={handleSetVariable}
          partialAmounts={partialAmounts}
        />

        {/* Add Payment Sheet */}
        <AddPaymentSheet
          open={addOpen}
          onClose={() => setAddOpen(false)}
          onSubmit={handleAddSubmit}
          recentPayments={payments}
        />
      </div>
    </PageTransition>
  );
}
