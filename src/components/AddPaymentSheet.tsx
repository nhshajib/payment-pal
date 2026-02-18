import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { Payment } from '@/hooks/usePayments';
import { format } from 'date-fns';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Payment, 'id' | 'user_id' | 'created_at'>) => void;
  editing?: Payment | null;
}

export default function AddPaymentSheet({ open, onClose, onSubmit, editing }: Props) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [reminderDays, setReminderDays] = useState('3');
  const [isRecurring, setIsRecurring] = useState(false);

  useEffect(() => {
    if (editing) {
      setName(editing.name);
      setAmount(String(editing.amount));
      setDueDate(editing.due_date);
      setReminderDays(String(editing.reminder_days));
      setIsRecurring(editing.is_recurring);
    } else {
      setName('');
      setAmount('');
      setDueDate(format(new Date(), 'yyyy-MM-dd'));
      setReminderDays('3');
      setIsRecurring(false);
    }
  }, [editing, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      amount: parseFloat(amount) || 0,
      due_date: dueDate,
      is_paid: editing?.is_paid ?? false,
      reminder_days: parseInt(reminderDays) || 3,
      is_recurring: isRecurring,
    });
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
            className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-2xl p-6 pb-24 max-w-md mx-auto border-t border-border max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-card-foreground">
                {editing ? 'Edit Payment' : 'Add Payment'}
              </h2>
              <button onClick={onClose} className="text-muted-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Payment Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Netflix, Rent"
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="amount">Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0"
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="reminder">Remind Before (days)</Label>
                <Input
                  id="reminder"
                  type="number"
                  value={reminderDays}
                  onChange={e => setReminderDays(e.target.value)}
                  min="0"
                  max="30"
                  className="mt-1"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="recurring">Monthly Recurring</Label>
                <Switch
                  id="recurring"
                  checked={isRecurring}
                  onCheckedChange={setIsRecurring}
                />
              </div>

              <Button type="submit" className="w-full mt-4">
                {editing ? 'Save Changes' : 'Add Payment'}
              </Button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
