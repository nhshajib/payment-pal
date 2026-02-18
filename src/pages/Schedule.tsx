import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { format, isSameMonth } from 'date-fns';
import { usePayments, type Payment } from '@/hooks/usePayments';
import { useUser } from '@/hooks/useUser';
import PaymentCard from '@/components/PaymentCard';
import AddPaymentSheet from '@/components/AddPaymentSheet';
import PageTransition from '@/components/PageTransition';
import { toast } from 'sonner';
import { requestNotificationPermission, checkAndNotifyPayments } from '@/lib/notifications';

export default function Schedule() {
  const { userId } = useUser();
  const { payments, addPayment, updatePayment, deletePayment, markPaid } = usePayments(userId);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Payment | null>(null);

  const now = new Date();
  const unpaid = payments.filter(p => !p.is_paid);
  const paid = payments.filter(p => p.is_paid);

  const summary = useMemo(() => {
    const thisMonth = payments.filter(p => isSameMonth(new Date(p.due_date), now));
    const totalDue = thisMonth.filter(p => !p.is_paid).reduce((s, p) => s + Number(p.amount), 0);
    const totalPaid = thisMonth.filter(p => p.is_paid).reduce((s, p) => s + Number(p.amount), 0);
    return { totalDue, totalPaid, count: thisMonth.length };
  }, [payments]);

  // Request notification permission and check for due payments
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  useEffect(() => {
    if (payments.length > 0) {
      checkAndNotifyPayments(payments);
    }
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
      toast.success(payment.is_recurring ? 'Paid! Next month created.' : 'Marked as paid');
    } catch {
      toast.error('Failed to update');
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen pb-24 px-4 pt-6 max-w-md mx-auto">
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold text-foreground">Your Payments</h1>
          <p className="text-muted-foreground text-sm">{format(now, 'MMMM yyyy')}</p>
        </motion.header>

        {/* Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 rounded-xl bg-card border border-border p-4 grid grid-cols-2 gap-4"
        >
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Due this month</p>
            <p className="text-xl font-bold text-status-overdue mt-1">₹{summary.totalDue.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Paid this month</p>
            <p className="text-xl font-bold text-status-success mt-1">₹{summary.totalPaid.toLocaleString()}</p>
          </div>
        </motion.div>

        {unpaid.length === 0 && paid.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <p className="text-muted-foreground text-lg">No payments yet</p>
            <p className="text-muted-foreground text-sm mt-1">Tap + to add your first payment</p>
          </motion.div>
        )}

        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {unpaid.map((p, i) => (
              <PaymentCard
                key={p.id}
                payment={p}
                index={i}
                onMarkPaid={handleMarkPaid}
                onEdit={(p) => { setEditing(p); setSheetOpen(true); }}
                onDelete={handleDelete}
              />
            ))}
          </AnimatePresence>
        </div>

        {paid.length > 0 && (
          <div className="mt-8">
            <h2 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">
              Completed
            </h2>
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {paid.map((p, i) => (
                  <PaymentCard
                    key={p.id}
                    payment={p}
                    index={i}
                    onMarkPaid={handleMarkPaid}
                    onEdit={(p) => { setEditing(p); setSheetOpen(true); }}
                    onDelete={handleDelete}
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* FAB */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => { setEditing(null); setSheetOpen(true); }}
          className="fixed bottom-24 right-4 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center z-40"
        >
          <Plus className="w-6 h-6" />
        </motion.button>

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
