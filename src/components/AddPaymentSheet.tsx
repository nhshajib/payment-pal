import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CalendarDays, Bell, RotateCw, Zap, HelpCircle, Globe, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import type { Payment } from '@/hooks/usePayments';
import { useCurrency } from '@/hooks/useCurrency';
import { useRoommates } from '@/hooks/useRoommates';
import { useUser } from '@/hooks/useUser';
import { CATEGORIES } from '@/lib/categories';
import { format, parseISO } from 'date-fns';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Payment, 'id' | 'user_id' | 'created_at'>) => void;
  editing?: Payment | null;
  recentPayments?: Payment[];
}

export default function AddPaymentSheet({ open, onClose, onSubmit, editing, recentPayments = [] }: Props) {
  const { currency } = useCurrency();
  const { userId } = useUser();
  const { roommates, fetchRoommates, getConfirmedRoommates } = useRoommates(userId);
  const [selectedRoommates, setSelectedRoommates] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState<Date>(new Date());
  const [reminderDays, setReminderDays] = useState('3');
  const [isRecurring, setIsRecurring] = useState(false);
  const [category, setCategory] = useState('other');
  const [notes, setNotes] = useState('');
  const [isVariableAmount, setIsVariableAmount] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState('');
  const [isShared, setIsShared] = useState(false);
  const [totalAmount, setTotalAmount] = useState('');
  const [userShareAmount, setUserShareAmount] = useState('');

  // Quick-add: last 3 unique payment names (not editing mode)
  const quickAddItems = useMemo(() => {
    if (editing) return [];
    const seen = new Set<string>();
    const items: { name: string; amount: number; category: string; is_recurring: boolean }[] = [];
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
      setDueDate(parseISO(editing.due_date));
      setReminderDays(String(editing.reminder_days));
      setIsRecurring(editing.is_recurring);
      setCategory(editing.category || 'other');
      setNotes(editing.notes || '');
      setIsVariableAmount(editing.amount === 0);
      setPaymentUrl(editing.payment_url || '');
      setIsShared(editing.is_shared || false);
      setTotalAmount(editing.total_amount ? String(editing.total_amount) : '');
      setUserShareAmount(editing.user_share_amount ? String(editing.user_share_amount) : '');
    } else {
      setName('');
      setAmount('');
      setDueDate(new Date());
      setReminderDays('3');
      setIsRecurring(false);
      setCategory('other');
      setNotes('');
      setIsVariableAmount(false);
      setPaymentUrl('');
      setIsShared(false);
      setTotalAmount('');
      setUserShareAmount('');
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
    const finalAmount = isVariableAmount ? 0 : isShared ? (parseFloat(userShareAmount) || 0) : (parseFloat(amount) || 0);
    onSubmit({
      name,
      amount: finalAmount,
      due_date: format(dueDate, 'yyyy-MM-dd'),
      is_paid: editing?.is_paid ?? false,
      reminder_days: parseInt(reminderDays) || 3,
      is_recurring: isRecurring,
      category,
      notes: notes.trim(),
      payment_url: paymentUrl.trim() || '',
      is_shared: isShared || false,
      total_amount: isShared ? (parseFloat(totalAmount) || 0) : 0,
      user_share_amount: isShared ? (parseFloat(userShareAmount) || 0) : 0,
      confirmation_number: '',
      receipt_url: '',
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

                {/* Amount - Standard or Split */}
                {!isShared ? (
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-muted-foreground/50">
                      {currency.symbol}
                    </div>
                    <Input
                      type="number"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      placeholder="0.00"
                      required={!isVariableAmount}
                      className="h-16 text-3xl font-bold bg-secondary/50 border-0 rounded-2xl pl-12 pr-5 placeholder:text-muted-foreground/20 focus-visible:ring-1 focus-visible:ring-primary transition-shadow [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block ml-1">Total Bill Amount</label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-muted-foreground/50">
                          {currency.symbol}
                        </div>
                        <Input
                          type="number"
                          value={totalAmount}
                          onChange={e => setTotalAmount(e.target.value)}
                          placeholder="0.00"
                          required
                          className="h-14 text-2xl font-bold bg-secondary/50 border-0 rounded-2xl pl-10 pr-5 placeholder:text-muted-foreground/20 focus-visible:ring-1 focus-visible:ring-primary transition-shadow [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block ml-1">My Share</label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-primary/60">
                          {currency.symbol}
                        </div>
                        <Input
                          type="number"
                          value={userShareAmount}
                          onChange={e => setUserShareAmount(e.target.value)}
                          placeholder="0.00"
                          required
                          className="h-14 text-2xl font-bold bg-secondary/50 border-0 rounded-2xl pl-10 pr-5 placeholder:text-muted-foreground/20 focus-visible:ring-1 focus-visible:ring-primary transition-shadow [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Shared Bill Toggle */}
                <div className="flex items-center justify-between bg-secondary/50 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                      <Users className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-card-foreground">Shared Bill</p>
                      <p className="text-xs text-muted-foreground">Split with roommates</p>
                    </div>
                  </div>
                  <Switch
                    checked={isShared}
                    onCheckedChange={(v) => {
                      setIsShared(v);
                      if (v) { fetchRoommates(); setSelectedRoommates([]); }
                      else { setTotalAmount(''); setUserShareAmount(''); setSelectedRoommates([]); }
                    }}
                  />
                </div>

                {/* Roommate Chips */}
                {isShared && getConfirmedRoommates().length > 0 && (
                  <div className="bg-secondary/30 rounded-xl px-4 py-3">
                    <p className="text-xs font-medium text-muted-foreground mb-2 ml-0.5">Split With</p>
                    <div className="flex flex-wrap gap-2">
                      {getConfirmedRoommates().map(r => {
                        const selected = selectedRoommates.includes(r.id);
                        return (
                          <motion.button
                            key={r.id}
                            type="button"
                            whileTap={{ scale: 0.93 }}
                            onClick={() => setSelectedRoommates(prev => selected ? prev.filter(id => id !== r.id) : [...prev, r.id])}
                            className={cn(
                              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
                              selected
                                ? "bg-primary/15 border-primary/30 text-primary"
                                : "bg-secondary/50 border-border/30 text-muted-foreground"
                            )}
                          >
                            <Users className="w-3 h-3" />
                            {r.partner_name || r.nickname || 'Roommate'}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Variable Amount Toggle */}
                {!isShared && (
                  <div className="flex items-center justify-between bg-secondary/50 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-status-warning/15 flex items-center justify-center">
                        <HelpCircle className="w-4 h-4 text-status-warning" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-card-foreground">Variable Amount</p>
                        <p className="text-xs text-muted-foreground">Set amount later</p>
                      </div>
                    </div>
                    <Switch
                      checked={isVariableAmount}
                      onCheckedChange={(v) => {
                        setIsVariableAmount(v);
                        if (v) setAmount('');
                      }}
                    />
                  </div>
                )}

                {/* Payment Website URL */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block ml-1">Payment Website (optional)</label>
                  <div className="relative">
                    <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                    <Input
                      type="url"
                      value={paymentUrl}
                      onChange={e => setPaymentUrl(e.target.value)}
                      placeholder="https://pay.example.com"
                      className="h-12 bg-secondary/50 border-0 rounded-xl pl-10 text-sm focus-visible:ring-1 focus-visible:ring-primary transition-shadow"
                    />
                  </div>
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
                  {/* Due Date - Calendar Popover */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block ml-1">Due Date</label>
                    <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className={cn(
                            "w-full h-12 bg-secondary/50 border-0 rounded-xl pl-10 pr-4 text-sm text-left relative flex items-center transition-shadow focus:outline-none focus:ring-1 focus:ring-primary",
                            !dueDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarDays className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                          <span className="text-card-foreground font-medium">
                            {format(dueDate, 'EEEE, MMM d, yyyy')}
                          </span>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto p-0 bg-card border-border z-[200]"
                        align="start"
                        side="top"
                        sideOffset={8}
                      >
                        <Calendar
                          mode="single"
                          selected={dueDate}
                          onSelect={(date) => {
                            if (date) {
                              setDueDate(date);
                              haptic(15);
                            }
                            setCalendarOpen(false);
                          }}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Reminder */}
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
