import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, CalendarCheck, CheckCircle2 } from 'lucide-react';
import { format, isSameMonth } from 'date-fns';
import { usePayments, type Payment } from '@/hooks/usePayments';
import { useUser } from '@/hooks/useUser';
import { useCurrency } from '@/hooks/useCurrency';
import { CATEGORIES } from '@/lib/categories';
import PaymentCard from '@/components/PaymentCard';
import AddPaymentSheet from '@/components/AddPaymentSheet';
import Confetti from '@/components/Confetti';
import PageTransition from '@/components/PageTransition';
import { toast } from 'sonner';
import { requestNotificationPermission, checkAndNotifyPayments } from '@/lib/notifications';

type TabId = 'upcoming' | 'paid';

const TABS: { id: TabId; label: string; icon: typeof CalendarCheck }[] = [
  { id: 'upcoming', label: 'Upcoming', icon: CalendarCheck },
  { id: 'paid', label: 'Paid', icon: CheckCircle2 },
];

export default function Schedule() {
  const { userId } = useUser();
  const { format: formatCurrency } = useCurrency();
  const { payments, addPayment, updatePayment, deletePayment, markPaid } = usePayments(userId);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Payment | null>(null);
  const [confettiTrigger, setConfettiTrigger] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('upcoming');

  const filteredPayments = useMemo(() => {
    if (!activeFilter) return payments;
    return payments.filter(p => (p.category || 'other') === activeFilter);
  }, [payments, activeFilter]);

  const now = new Date();
  const unpaid = filteredPayments.filter(p => !p.is_paid);
  const paid = filteredPayments.filter(p => p.is_paid);

  const usedCategories = useMemo(() => {
    const cats = new Set(payments.map(p => p.category || 'other'));
    return CATEGORIES.filter(c => cats.has(c.id));
  }, [payments]);

  const summary = useMemo(() => {
    const thisMonth = payments.filter(p => isSameMonth(new Date(p.due_date), now));
    const totalDue = thisMonth.filter(p => !p.is_paid).reduce((s, p) => s + Number(p.amount), 0);
    const totalPaid = thisMonth.filter(p => p.is_paid).reduce((s, p) => s + Number(p.amount), 0);
    return { totalDue, totalPaid, count: thisMonth.length };
  }, [payments]);

  useEffect(() => { requestNotificationPermission(); }, []);
  useEffect(() => {
    if (payments.length > 0) checkAndNotifyPayments(payments);
  }, [payments]);

  const handleSubmit = async (data: Omit<Payment, 'id' | 'user_id' | 'created_at'>) => {
    try {
      if (editing) {
        await updatePayment(editing.id, data);
        toast.success('Payment updated');
      } else {
        await addPayment(data);
        toast.success('Payment added');
      }
      setEditing(null);
    } catch {
      toast.error('Something went wrong');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePayment(id);
      toast.success('Payment deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleMarkPaid = async (payment: Payment) => {
    try {
      await markPaid(payment);
      setConfettiTrigger(true);
      setTimeout(() => setConfettiTrigger(false), 100);
      toast.success(payment.is_recurring ? 'Paid! Next month created.' : 'Marked as paid');
    } catch {
      toast.error('Failed to update');
    }
  };

  const handleMarkUnpaid = async (payment: Payment) => {
    try {
      await updatePayment(payment.id, { is_paid: false });
      toast.success('Marked as unpaid');
    } catch {
      toast.error('Failed to update');
    }
  };

  const currentList = activeTab === 'upcoming' ? unpaid : paid;

  return (
    <PageTransition>
      <Confetti trigger={confettiTrigger} />
      <div className="min-h-screen pb-24 px-4 pt-6 max-w-md mx-auto">
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5"
        >
          <h1 className="text-2xl font-bold text-foreground">Your Payments</h1>
          <p className="text-muted-foreground text-sm">{format(now, 'MMMM yyyy')}</p>
        </motion.header>

        {/* Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-5 rounded-xl bg-card border border-border p-4 grid grid-cols-2 gap-4"
        >
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Due this month</p>
            <p className="text-xl font-bold text-status-overdue mt-1">{formatCurrency(summary.totalDue)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Paid this month</p>
            <p className="text-xl font-bold text-status-success mt-1">{formatCurrency(summary.totalPaid)}</p>
          </div>
        </motion.div>

        {/* Tab Switcher */}
        <div className="relative mb-4 bg-secondary rounded-xl p-1 flex">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            const count = tab.id === 'upcoming' ? unpaid.length : paid.length;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors z-10 ${
                  isActive ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="scheduleTab"
                    className="absolute inset-0 bg-card rounded-lg shadow-sm"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative flex items-center gap-1.5">
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {count > 0 && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      isActive ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
                    }`}>
                      {count}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {/* Category filter bar */}
        {usedCategories.length > 1 && (
          <div className="mb-4 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={() => setActiveFilter(null)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                !activeFilter
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground'
              }`}
            >
              All
            </motion.button>
            {usedCategories.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeFilter === cat.id;
              return (
                <motion.button
                  key={cat.id}
                  whileTap={{ scale: 0.93 }}
                  onClick={() => setActiveFilter(isActive ? null : cat.id)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    isActive
                      ? 'text-card-foreground'
                      : 'bg-secondary text-muted-foreground'
                  }`}
                  style={isActive ? { backgroundColor: `${cat.color}25`, color: cat.color } : undefined}
                >
                  <Icon className="w-3 h-3" />
                  {cat.label}
                </motion.button>
              );
            })}
          </div>
        )}

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: activeTab === 'upcoming' ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: activeTab === 'upcoming' ? 20 : -20 }}
            transition={{ duration: 0.2 }}
          >
            {currentList.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <p className="text-muted-foreground text-lg">
                  {activeTab === 'upcoming' ? 'No upcoming payments' : 'No paid payments yet'}
                </p>
                <p className="text-muted-foreground text-sm mt-1">
                  {activeTab === 'upcoming'
                    ? 'Tap + to add your first payment'
                    : 'Swipe right on a payment to mark it paid'}
                </p>
              </motion.div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {currentList.map((p, i) => (
                    <PaymentCard
                      key={p.id}
                      payment={p}
                      index={i}
                      onMarkPaid={handleMarkPaid}
                      onMarkUnpaid={handleMarkUnpaid}
                      onEdit={(p) => { setEditing(p); setSheetOpen(true); }}
                      onDelete={handleDelete}
                      isPaidTab={activeTab === 'paid'}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* FAB - only on upcoming tab */}
        {activeTab === 'upcoming' && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.85, rotate: 90 }}
            transition={{ type: 'spring', stiffness: 500, damping: 15 }}
            onClick={() => { setEditing(null); setSheetOpen(true); }}
            className="fixed bottom-28 right-5 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center z-[60]"
          >
            <Plus className="w-6 h-6" />
          </motion.button>
        )}

        <AddPaymentSheet
          open={sheetOpen}
          onClose={() => { setSheetOpen(false); setEditing(null); }}
          onSubmit={handleSubmit}
          editing={editing}
        />
      </div>
    </PageTransition>
  );
}
