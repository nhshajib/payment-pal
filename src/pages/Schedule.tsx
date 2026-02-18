import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, CalendarCheck, CheckCircle2, Sparkles, Trash2, Hand, Search, X } from 'lucide-react';
import { format } from 'date-fns';
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

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function Schedule() {
  const { userId, userName } = useUser();
  const { format: formatCurrency } = useCurrency();
  const { payments, addPayment, updatePayment, deletePayment, markPaid, clearPaid, restorePayments } = usePayments(userId);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Payment | null>(null);
  const [confettiTrigger, setConfettiTrigger] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('upcoming');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showLongPressHint, setShowLongPressHint] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  // Show long-press hint once on first visit with payments
  useEffect(() => {
    const hintSeen = localStorage.getItem('paytrack_longpress_hint');
    if (!hintSeen && payments.length > 0) {
      const timer = setTimeout(() => setShowLongPressHint(true), 1200);
      return () => clearTimeout(timer);
    }
  }, [payments.length]);

  useEffect(() => {
    if (showLongPressHint) {
      const dismiss = setTimeout(() => {
        setShowLongPressHint(false);
        localStorage.setItem('paytrack_longpress_hint', '1');
      }, 4000);
      return () => clearTimeout(dismiss);
    }
  }, [showLongPressHint]);

  const filteredPayments = useMemo(() => {
    let list = payments;
    if (activeFilter) list = list.filter(p => (p.category || 'other') === activeFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.notes && p.notes.toLowerCase().includes(q))
      );
    }
    return list;
  }, [payments, activeFilter, searchQuery]);

  const unpaid = filteredPayments.filter(p => !p.is_paid);
  const paid = filteredPayments.filter(p => p.is_paid);

  const usedCategories = useMemo(() => {
    const cats = new Set(payments.map(p => p.category || 'other'));
    return CATEGORIES.filter(c => cats.has(c.id));
  }, [payments]);

  const summary = useMemo(() => {
    const totalDue = payments.filter(p => !p.is_paid).reduce((s, p) => s + Number(p.amount), 0);
    const totalPaid = payments.filter(p => p.is_paid).reduce((s, p) => s + Number(p.amount), 0);
    const unpaidCount = payments.filter(p => !p.is_paid).length;
    const paidCount = payments.filter(p => p.is_paid).length;
    return { totalDue, totalPaid, unpaidCount, paidCount };
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
    const deletedPayment = payments.find(p => p.id === id);
    try {
      await deletePayment(id);
      toast.success('Payment deleted', {
        action: deletedPayment ? {
          label: 'Undo',
          onClick: async () => {
            try {
              await restorePayments([deletedPayment]);
              toast.success('Payment restored');
            } catch {
              toast.error('Failed to restore');
            }
          },
        } : undefined,
        duration: 6000,
      });
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
  const progressPct = (summary.totalDue + summary.totalPaid) > 0
    ? (summary.totalPaid / (summary.totalDue + summary.totalPaid)) * 100
    : 0;

  return (
    <PageTransition>
      <Confetti trigger={confettiTrigger} />
      <div className="min-h-screen pb-24 px-4 pt-6 max-w-md mx-auto">
        {/* Greeting Header */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5"
        >
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground text-sm"
          >
            {getGreeting()}{userName ? `, ${userName}` : ''} 👋
          </motion.p>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Your Payments</h1>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => { setSearchOpen(prev => !prev); if (searchOpen) setSearchQuery(''); }}
              className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center"
            >
              {searchOpen ? <X className="w-4 h-4 text-muted-foreground" /> : <Search className="w-4 h-4 text-muted-foreground" />}
            </motion.button>
          </div>
          <p className="text-muted-foreground text-xs mt-0.5">{format(new Date(), 'EEEE, MMMM d')}</p>
          <AnimatePresence>
            {searchOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="overflow-hidden"
              >
                <div className="relative mt-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 pointer-events-none" />
                  <input
                    autoFocus
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search by name or notes…"
                    className="w-full h-10 bg-secondary/60 border-0 rounded-xl pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary transition-shadow"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.header>

        {/* Summary Card - Frosted Glass */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-5 rounded-2xl glass border border-border/50 overflow-hidden"
        >
          {/* Accent line */}
          <div className="h-0.5 gradient-accent" />

          <div className="grid grid-cols-2">
            {/* Due */}
            <div className="p-4 relative">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-status-overdue/15 flex items-center justify-center">
                  <CalendarCheck className="w-3.5 h-3.5 text-status-overdue" />
                </div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Due</p>
              </div>
              <p className="text-2xl font-bold text-status-overdue">{formatCurrency(summary.totalDue)}</p>
              <p className="text-xs text-muted-foreground mt-1">{summary.unpaidCount} pending</p>
              <div className="absolute right-0 top-4 bottom-4 w-px bg-border/50" />
            </div>
            {/* Paid */}
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-status-success/15 flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5 text-status-success" />
                </div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Paid</p>
              </div>
              <p className="text-2xl font-bold text-status-success">{formatCurrency(summary.totalPaid)}</p>
              <p className="text-xs text-muted-foreground mt-1">{summary.paidCount} done</p>
            </div>
          </div>

          {/* Progress bar */}
          {(summary.totalDue + summary.totalPaid) > 0 && (
            <div className="px-4 pb-3">
              <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-status-success"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
            </div>
          )}
        </motion.div>

        {/* Tab Switcher */}
        <div className="relative mb-4 bg-secondary/80 rounded-xl p-1 flex">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            const count = tab.id === 'upcoming' ? unpaid.length : paid.length;
            return (
              <motion.button
                key={tab.id}
                whileTap={{ scale: 0.97 }}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors z-10 ${
                  isActive ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="scheduleTab"
                    className="absolute inset-0 bg-card rounded-lg shadow-sm"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
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
              </motion.button>
            );
          })}
        </div>

        {/* Category filter bar */}
        {usedCategories.length > 1 && (
          <div className="mb-4 flex gap-2 overflow-x-auto pb-1 scrollbar-none" style={{ maskImage: 'linear-gradient(to right, black 90%, transparent)' }}>
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
                  style={isActive ? { backgroundColor: `${cat.color}20`, color: cat.color, boxShadow: `0 0 12px ${cat.color}15` } : undefined}
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
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-16"
              >
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-secondary mb-4"
                >
                  <Sparkles className="w-7 h-7 text-muted-foreground" />
                </motion.div>
                <p className="text-muted-foreground font-medium">
                  {activeTab === 'upcoming' ? 'No upcoming payments' : 'No paid payments yet'}
                </p>
                <p className="text-muted-foreground/60 text-sm mt-1">
                  {activeTab === 'upcoming'
                    ? 'Tap + to add your first payment'
                    : 'Swipe right on a payment to mark it paid'}
                </p>
              </motion.div>
            ) : (
              <>
                {/* Clear all button for paid tab */}
                {activeTab === 'paid' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-end mb-2"
                  >
                    <motion.button
                      whileTap={{ scale: 0.93 }}
                      onClick={() => setShowClearConfirm(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-destructive bg-destructive/10 active:bg-destructive/20 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Clear All
                    </motion.button>
                  </motion.div>
                )}

                {/* Long-press hint tooltip */}
                <AnimatePresence>
                  {showLongPressHint && activeTab === 'upcoming' && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.95 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      onClick={() => { setShowLongPressHint(false); localStorage.setItem('paytrack_longpress_hint', '1'); }}
                      className="flex items-center gap-2 px-4 py-2.5 mb-3 rounded-xl bg-primary/10 border border-primary/20 cursor-pointer"
                    >
                      <Hand className="w-4 h-4 text-primary flex-shrink-0" />
                      <p className="text-xs text-primary font-medium">
                        Long-press any card for more options
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-2.5">
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
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {/* FAB - with glow pulse */}
        {activeTab === 'upcoming' && !sheetOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.85, rotate: 90 }}
            transition={{ type: 'spring', stiffness: 500, damping: 15 }}
            onClick={() => { setEditing(null); setSheetOpen(true); }}
            className="fixed bottom-28 right-5 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center z-[60] glow-pulse"
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

        {/* Clear Paid Confirmation */}
        <AnimatePresence>
          {showClearConfirm && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-background/80 backdrop-blur-md z-[70]"
                onClick={() => setShowClearConfirm(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 30 }}
                transition={{ type: 'spring', damping: 30, stiffness: 400 }}
                className="fixed inset-x-4 top-[30%] z-[70] max-w-sm mx-auto"
              >
                <div className="bg-card rounded-2xl border border-border/50 shadow-2xl p-6 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-destructive/10 mb-4">
                    <Trash2 className="w-7 h-7 text-destructive" />
                  </div>
                  <h3 className="text-lg font-bold text-card-foreground mb-1">Clear Paid List?</h3>
                   <p className="text-sm text-muted-foreground mb-5">
                     This will delete {paid.length} paid payment{paid.length !== 1 ? 's' : ''}. You can undo this briefly after clearing.
                   </p>
                  <div className="flex gap-3">
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={() => setShowClearConfirm(false)}
                      className="flex-1 h-11 rounded-xl bg-secondary text-card-foreground font-medium text-sm"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={async () => {
                        try {
                          const count = paid.length;
                          const deleted = await clearPaid();
                          setShowClearConfirm(false);
                          toast.success(`${count} paid payment${count !== 1 ? 's' : ''} cleared`, {
                            action: {
                              label: 'Undo',
                              onClick: async () => {
                                try {
                                  await restorePayments(deleted);
                                  toast.success('Payments restored');
                                } catch {
                                  toast.error('Failed to restore');
                                }
                              },
                            },
                            duration: 6000,
                          });
                        } catch {
                          toast.error('Failed to clear');
                        }
                      }}
                      className="flex-1 h-11 rounded-xl bg-destructive text-destructive-foreground font-medium text-sm"
                    >
                      Clear All
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
