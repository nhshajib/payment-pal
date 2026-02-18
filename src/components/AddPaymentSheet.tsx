import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CalendarDays, Bell, RotateCw, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Payment } from '@/hooks/usePayments';
import { useCurrency } from '@/hooks/useCurrency';
import { CATEGORIES } from '@/lib/categories';
import { format } from 'date-fns';
import { haptic } from '@/lib/haptics';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Payment, 'id' | 'user_id' | 'created_at'>) => void;
  editing?: Payment | null;
  recentPayments?: Payment[];
}

export default function AddPaymentSheet({ open, onClose, onSubmit, editing, recentPayments = [] }: Props) {
  const { currency } = useCurrency();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [reminderDays, setReminderDays] = useState('3');
  const [isRecurring, setIsRecurring] = useState(false);
  const [category, setCategory] = useState('other');
  const [notes, setNotes] = useState('');

  // Quick-add: last 3 unique payment names (not editing mode)
  const quickAddItems = useMemo(() => {
    if (editing) return [];
    const seen = new Set<string>();
    const items: { name: string; amount: number; category: string; is_recurring: boolean }[] = [];
    // Walk payments in reverse (most recent first)
    for (let i = recentPayments.length - 1; i >= 0 && items.length < 3; i--) {
      const p = recentPayments[i];
      const key = p.name.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        items.push({ name: p.name, amount: p.amount, category: p.category || 'other', is_recurring: p.is_recurring });
      }
    }
    return items;
  }, [recentPayments, editing]);

  useEffect(() => {
    if (editing) {
      setName(editing.name);
      setAmount(String(editing.amount));
      setDueDate(editing.due_date);
      setReminderDays(String(editing.reminder_days));
      setIsRecurring(editing.is_recurring);
      setCategory(editing.category || 'other');
      setNotes(editing.notes || '');
    } else {
      setName('');
      setAmount('');
      setDueDate(format(new Date(), 'yyyy-MM-dd'));
      setReminderDays('3');
      setIsRecurring(false);
      setCategory('other');
      setNotes('');
    }
  }, [editing, open]);

  const handleQuickFill = (item: typeof quickAddItems[0]) => {
    haptic(15);
    setName(item.name);
    setAmount(String(item.amount));
    setCategory(item.category);
    setIsRecurring(item.is_recurring);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      amount: parseFloat(amount) || 0,
      due_date: dueDate,
      is_paid: editing?.is_paid ?? false,
      reminder_days: parseInt(reminderDays) || 3,
      is_recurring: isRecurring,
      category,
      notes: notes.trim(),
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-md z-50"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 400 }}
            className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto"
          >
            <div className="bg-card rounded-t-3xl border-t border-border/50 shadow-2xl overflow-hidden">
              {/* Drag handle */}
              <motion.div
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={0.4}
                onDragEnd={(_, info) => {
                  if (info.offset.y > 60 || info.velocity.y > 400) onClose();
                }}
                className="flex justify-center pt-3 pb-3 cursor-grab active:cursor-grabbing touch-none"
              >
                <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
              </motion.div>

              {/* Header */}
              <div className="flex items-center justify-between px-6 pb-4 pt-2">
                <h2 className="text-xl font-bold text-card-foreground tracking-tight">
                  {editing ? 'Edit Payment' : 'New Payment'}
                </h2>
                <motion.button
                  whileTap={{ scale: 0.85, rotate: -90 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </motion.button>
              </div>

              {/* Divider */}
              <div className="h-px bg-border/50 mx-6" />

              {/* Form */}
              <form onSubmit={handleSubmit} className="px-6 pb-32 pt-5 space-y-5 max-h-[65vh] overflow-y-auto overscroll-contain touch-pan-y">
                {/* Quick-Add Shortcuts */}
                {quickAddItems.length > 0 && !editing && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Zap className="w-3.5 h-3.5 text-status-warning" />
                      <span className="text-xs font-medium text-muted-foreground">Quick Add</span>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {quickAddItems.map((item, i) => (
                        <motion.button
                          key={`${item.name}-${i}`}
                          type="button"
                          whileTap={{ scale: 0.93 }}
                          onClick={() => handleQuickFill(item)}
                          className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary/70 border border-border/30 text-sm active:bg-secondary transition-colors"
                        >
                          <span className="font-medium text-card-foreground truncate max-w-[100px]">{item.name}</span>
                          <span className="text-muted-foreground text-xs">{currency.symbol}{item.amount}</span>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Payment Name */}
                <div>
                  <Input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Payment name"
                    required
                    className="h-14 text-lg font-medium bg-secondary/50 border-0 rounded-2xl px-5 placeholder:text-muted-foreground/40 focus-visible:ring-1 focus-visible:ring-primary transition-shadow"
                  />
                </div>

                {/* Amount */}
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-muted-foreground/50">
                    {currency.symbol}
                  </div>
                  <Input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="0.00"
                    required
                    className="h-16 text-3xl font-bold bg-secondary/50 border-0 rounded-2xl pl-12 pr-5 placeholder:text-muted-foreground/20 focus-visible:ring-1 focus-visible:ring-primary transition-shadow [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>

                {/* Divider */}
                <div className="h-px bg-border/30" />

                {/* Category picker */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block ml-1">Category</label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="h-12 bg-secondary/50 border-0 rounded-xl text-sm focus:ring-1 focus:ring-primary">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border z-[200] max-h-60">
                      {CATEGORIES.map((cat) => {
                        const Icon = cat.icon;
                        return (
                          <SelectItem key={cat.id} value={cat.id}>
                            <span className="flex items-center gap-2">
                              <Icon className="w-4 h-4" style={{ color: cat.color }} />
                              {cat.label}
                            </span>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* Notes */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block ml-1">Notes (optional)</label>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Add a memo or extra details…"
                    rows={2}
                    className="w-full bg-secondary/50 border-0 rounded-xl px-4 py-3 text-sm placeholder:text-muted-foreground/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary transition-shadow resize-none text-card-foreground"
                  />
                </div>

                {/* Date & Reminder Row */}
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block ml-1">Due Date</label>
                    <div className="relative">
                      <CalendarDays className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 pointer-events-none" />
                      <Input
                        type="date"
                        value={dueDate}
                        onChange={e => setDueDate(e.target.value)}
                        required
                        className="h-12 bg-secondary/50 border-0 rounded-xl pl-10 text-sm focus-visible:ring-1 focus-visible:ring-primary transition-shadow w-full"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block ml-1">Remind Before</label>
                    <div className="relative">
                      <Bell className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 pointer-events-none" />
                      <Input
                        type="number"
                        value={reminderDays}
                        onChange={e => setReminderDays(e.target.value)}
                        min="0"
                        max="30"
                        className="h-12 bg-secondary/50 border-0 rounded-xl pl-10 pr-14 text-sm focus-visible:ring-1 focus-visible:ring-primary transition-shadow w-full"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/50">days</span>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-border/30" />

                {/* Recurring toggle */}
                <div className="flex items-center justify-between bg-secondary/50 rounded-xl px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                      <RotateCw className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-card-foreground">Monthly Recurring</p>
                      <p className="text-xs text-muted-foreground">Auto-create next month</p>
                    </div>
                  </div>
                  <Switch
                    checked={isRecurring}
                    onCheckedChange={setIsRecurring}
                  />
                </div>

                {/* Submit button */}
                <motion.div whileTap={{ scale: 0.96 }} transition={{ type: 'spring', stiffness: 500, damping: 25 }}>
                  <Button
                    type="submit"
                    className="w-full rounded-2xl text-base font-semibold shadow-lg shadow-primary/25 mt-2"
                    style={{ height: '52px' }}
                  >
                    {editing ? 'Save Changes' : 'Add Payment'}
                  </Button>
                </motion.div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
