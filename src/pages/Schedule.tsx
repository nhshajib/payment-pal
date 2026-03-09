import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import { Plus, CalendarCheck, CheckCircle2, Sparkles, Trash2, Hand, Search, X, ArrowDownAZ, ArrowDownUp, Clock, Check, CalendarDays, Crown, SlidersHorizontal, CreditCard, Timer, ExternalLink, XCircle } from 'lucide-react';
import { format, isToday, isThisWeek, isBefore, startOfDay, differenceInDays, parseISO } from 'date-fns';
import { usePayments, type Payment } from '@/hooks/usePayments';
import { useUser } from '@/hooks/useUser';
import { useCurrency } from '@/hooks/useCurrency';
import { usePremium } from '@/hooks/usePremium';
import { useFreeTrials } from '@/hooks/useFreeTrials';
import { CATEGORIES } from '@/lib/categories';
import PaymentCard from '@/components/PaymentCard';
import PaymentCardSkeleton from '@/components/PaymentCardSkeleton';
import AddPaymentSheet from '@/components/AddPaymentSheet';
import AddTrialSheet from '@/components/AddTrialSheet';
import Confetti from '@/components/Confetti';
import PageTransition from '@/components/PageTransition';
import { toast } from 'sonner';
import { requestNotificationPermission, checkAndNotifyPayments, registerPeriodicSync, cachePaymentsForSW } from '@/lib/notifications';
import { haptic } from '@/lib/haptics';
import { useReceiptStash } from '@/hooks/useReceiptStash';
import { Receipt as ReceiptIcon } from 'lucide-react';
import OnboardingTutorial, { shouldShowTutorial, markTutorialDone } from '@/components/OnboardingTutorial';

type TabId = 'upcoming' | 'paid' | 'trials';
type SortMode = 'date' | 'amount' | 'name';

const TABS: { id: TabId; label: string; premium?: boolean }[] = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'paid', label: 'Paid' },
  { id: 'trials', label: 'Trials', premium: true },
];

const SORT_LABELS: Record<SortMode, string> = { date: 'Date', amount: 'Amount', name: 'Name' };

function getDateSection(dateStr: string): 'overdue' | 'today' | 'this_week' | 'later' {
  const d = new Date(dateStr);
  const now = startOfDay(new Date());
  if (isBefore(d, now)) return 'overdue';
  if (isToday(d)) return 'today';
  if (isThisWeek(d, { weekStartsOn: 1 })) return 'this_week';
  return 'later';
}

const SECTION_LABELS: Record<string, string> = {
  overdue: 'Overdue',
  today: 'Today',
  this_week: 'This Week',
  later: 'Later',
};

export default function Schedule() {
  const { userId, userName } = useUser();
  const { format: formatCurrency } = useCurrency();
  const { isPremium } = usePremium();
  const { payments, loading, addPayment, updatePayment, deletePayment, markPaid, clearPaid, restorePayments, refetch } = usePayments(userId);
  const { trials, loading: trialsLoading, fetchTrials, addTrial, cancelTrial, deleteTrial } = useFreeTrials(userId);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [trialSheetOpen, setTrialSheetOpen] = useState(false);
  const [fabPickerOpen, setFabPickerOpen] = useState(false);
  const [editing, setEditing] = useState<Payment | null>(null);
  const [confettiTrigger, setConfettiTrigger] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('upcoming');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('date');
  const [showFilters, setShowFilters] = useState(false);
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterAmountMin, setFilterAmountMin] = useState('');
  const [filterAmountMax, setFilterAmountMax] = useState('');
  const [filterCategories, setFilterCategories] = useState<string[]>([]);
  const { receipts, getReceipt } = useReceiptStash();
  const [receiptPopover, setReceiptPopover] = useState<{ paymentId: string; paymentName: string } | null>(null);
  const [showTutorial, setShowTutorial] = useState(() => shouldShowTutorial());

  // Fetch trials on mount
  useEffect(() => { fetchTrials(); }, [fetchTrials]);

  // Pull-to-refresh
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshComplete, setRefreshComplete] = useState(false);
  const pullY = useMotionValue(0);
  const pullProgress = useTransform(pullY, [0, 80], [0, 1]);
  const pullOpacity = useTransform(pullY, [0, 30, 80], [0, 0.6, 1]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isPulling = useRef(false);
  const startY = useRef(0);
  const hasTriggeredHaptic = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (scrollRef.current && scrollRef.current.scrollTop <= 0) {
      startY.current = e.touches[0].clientY;
      isPulling.current = true;
      hasTriggeredHaptic.current = false;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling.current) return;
    const rawDelta = e.touches[0].clientY - startY.current;
    if (rawDelta < 0) { pullY.set(0); return; }
    const delta = rawDelta * (1 - Math.min(rawDelta / 400, 0.6));
    pullY.set(delta);
    if (delta >= 80 && !hasTriggeredHaptic.current) {
      haptic(15);
      hasTriggeredHaptic.current = true;
    }
  }, [pullY]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling.current) return;
    isPulling.current = false;
    if (pullY.get() >= 80) {
      setIsRefreshing(true);
      animate(pullY, 60, { type: 'spring', stiffness: 300, damping: 30 });
      await refetch();
      await fetchTrials();
      setIsRefreshing(false);
      setRefreshComplete(true);
      haptic(10);
      setTimeout(() => {
        setRefreshComplete(false);
        animate(pullY, 0, { type: 'spring', stiffness: 400, damping: 35 });
      }, 600);
    } else {
      animate(pullY, 0, { type: 'spring', stiffness: 500, damping: 35 });
    }
  }, [pullY, refetch, fetchTrials]);

  // Removed long-press hint — too noisy

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filterDateFrom) count++;
    if (filterDateTo) count++;
    if (filterAmountMin) count++;
    if (filterAmountMax) count++;
    count += filterCategories.length;
    return count;
  }, [filterDateFrom, filterDateTo, filterAmountMin, filterAmountMax, filterCategories]);

  const clearAdvancedFilters = () => {
    setFilterDateFrom(''); setFilterDateTo(''); setFilterAmountMin(''); setFilterAmountMax(''); setFilterCategories([]);
  };

  const filteredPayments = useMemo(() => {
    let list = payments;
    if (activeFilter) list = list.filter(p => (p.category || 'other') === activeFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(p => p.name.toLowerCase().includes(q) || (p.notes && p.notes.toLowerCase().includes(q)));
    }
    if (isPremium) {
      if (filterDateFrom) list = list.filter(p => p.due_date >= filterDateFrom);
      if (filterDateTo) list = list.filter(p => p.due_date <= filterDateTo);
      if (filterAmountMin) list = list.filter(p => Number(p.amount) >= Number(filterAmountMin));
      if (filterAmountMax) list = list.filter(p => Number(p.amount) <= Number(filterAmountMax));
      if (filterCategories.length > 0) list = list.filter(p => filterCategories.includes(p.category || 'other'));
    }
    const sorted = [...list];
    if (sortMode === 'amount') sorted.sort((a, b) => b.amount - a.amount);
    else if (sortMode === 'name') sorted.sort((a, b) => a.name.localeCompare(b.name));
    else sorted.sort((a, b) => a.due_date.localeCompare(b.due_date));
    return sorted;
  }, [payments, activeFilter, searchQuery, sortMode, isPremium, filterDateFrom, filterDateTo, filterAmountMin, filterAmountMax, filterCategories]);

  const unpaid = filteredPayments.filter(p => !p.is_paid);
  const paid = filteredPayments.filter(p => p.is_paid);

  const usedCategories = useMemo(() => {
    const cats = new Set(payments.map(p => p.category || 'other'));
    return CATEGORIES.filter(c => cats.has(c.id));
  }, [payments]);

  const summary = useMemo(() => {
    const now = new Date();
    const unpaidCount = payments.filter(p => !p.is_paid).length;
    const paidCount = payments.filter(p => p.is_paid).length;
    const overdueCount = payments.filter(p => !p.is_paid && new Date(p.due_date) < now).length;
    return { unpaidCount, paidCount, overdueCount };
  }, [payments]);

  const totalUpcoming = useMemo(() => unpaid.reduce((sum, p) => sum + Number(p.amount), 0), [unpaid]);

  const groupedUpcoming = useMemo(() => {
    if (sortMode !== 'date') return null;
    const groups: Record<string, Payment[]> = {};
    unpaid.forEach(p => {
      const section = getDateSection(p.due_date);
      if (!groups[section]) groups[section] = [];
      groups[section].push(p);
    });
    return groups;
  }, [unpaid, sortMode]);

  useEffect(() => {
    requestNotificationPermission().then(() => registerPeriodicSync());
  }, []);
  useEffect(() => {
    if (payments.length > 0) {
      checkAndNotifyPayments(payments);
      cachePaymentsForSW(payments);
    }
  }, [payments]);

  const handleSubmit = async (data: Omit<Payment, 'id' | 'user_id' | 'created_at'>) => {
    try {
      if (editing) { await updatePayment(editing.id, data); toast.success('Payment updated'); }
      else { await addPayment(data); toast.success('Payment added'); }
      setEditing(null);
    } catch { toast.error('Something went wrong'); }
  };

  const handleDelete = async (id: string) => {
    const deletedPayment = payments.find(p => p.id === id);
    try {
      await deletePayment(id);
      toast.success('Payment deleted', {
        action: deletedPayment ? {
          label: 'Undo',
          onClick: async () => { try { await restorePayments([deletedPayment]); toast.success('Payment restored'); } catch { toast.error('Failed to restore'); } },
        } : undefined,
        duration: 6000,
      });
    } catch { toast.error('Failed to delete'); }
  };

  const handleMarkPaid = async (payment: Payment) => {
    try {
      haptic(25);
      await markPaid(payment);
      setConfettiTrigger(true);
      setTimeout(() => setConfettiTrigger(false), 100);
      toast.success(payment.is_recurring ? 'Paid! Next month created.' : 'Marked as paid');
    } catch { toast.error('Failed to update'); }
  };

  const handleMarkUnpaid = async (payment: Payment) => {
    try { await updatePayment(payment.id, { is_paid: false }); toast.success('Marked as unpaid'); }
    catch { toast.error('Failed to update'); }
  };

  const cycleSortMode = () => {
    const modes: SortMode[] = ['date', 'amount', 'name'];
    const next = modes[(modes.indexOf(sortMode) + 1) % modes.length];
    setSortMode(next);
    haptic(15);
  };

  const handleTrialSubmit = async (data: { name: string; expires_on: string; cancel_url?: string; notes?: string }) => {
    try {
      await addTrial(data);
      toast.success('Free trial added');
    } catch { toast.error('Failed to add trial'); }
  };

  // Trials data
  const activeTrials = useMemo(() => trials.filter(t => !t.is_cancelled), [trials]);
  const cancelledTrials = useMemo(() => trials.filter(t => t.is_cancelled), [trials]);

  const currentList = activeTab === 'upcoming' ? unpaid : paid;
  const showSkeleton = loading && payments.length === 0;

  const PullIndicator = () => {
    const radius = 10;
    const circumference = 2 * Math.PI * radius;
    return (
      <motion.div style={{ opacity: pullOpacity }} className="flex justify-center py-3">
        <div className="relative w-8 h-8 flex items-center justify-center">
          {refreshComplete ? (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 20 }}>
              <Check className="w-5 h-5 text-status-success" />
            </motion.div>
          ) : isRefreshing ? (
            <motion.svg width="28" height="28" viewBox="0 0 28 28" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}>
              <circle cx="14" cy="14" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="2.5" />
              <circle cx="14" cy="14" r={radius} fill="none" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeDasharray={circumference} strokeDashoffset={circumference * 0.7} strokeLinecap="round" />
            </motion.svg>
          ) : (
            <motion.svg width="28" height="28" viewBox="0 0 28 28">
              <circle cx="14" cy="14" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="2" />
              <motion.circle cx="14" cy="14" r={radius} fill="none" stroke="hsl(var(--primary))" strokeWidth="2.5"
                strokeDasharray={circumference} strokeLinecap="round"
                style={{ strokeDashoffset: useTransform(pullProgress, v => circumference * (1 - v)) }}
                transform="rotate(-90 14 14)"
              />
            </motion.svg>
          )}
        </div>
      </motion.div>
    );
  };

  const renderPaymentList = () => {
    if (activeTab === 'upcoming' && groupedUpcoming && sortMode === 'date') {
      const sectionOrder = ['overdue', 'today', 'this_week', 'later'];
      let globalIdx = 0;
      return sectionOrder.map(section => {
        const items = groupedUpcoming[section];
        if (!items || items.length === 0) return null;
        return (
          <div key={section} className="mb-2">
            <div className="flex items-center gap-2 mb-3 mt-2">
              <span className={`text-[11px] font-semibold uppercase tracking-[1px] ${section === 'overdue' ? 'text-primary' : 'text-muted-foreground/60'}`}>
                {SECTION_LABELS[section]}
              </span>
              <div className="flex-1 h-px bg-border/20" />
              <span className="text-[11px] text-muted-foreground/40">{items.length}</span>
            </div>
            <div className="space-y-2">
              {items.map(p => {
                const idx = globalIdx++;
                return (
                  <PaymentCard
                    key={p.id}
                    payment={p}
                    index={idx}
                    onMarkPaid={handleMarkPaid}
                    onMarkUnpaid={handleMarkUnpaid}
                    onEdit={(p) => { setEditing(p); setSheetOpen(true); }}
                    onDelete={handleDelete}
                    isPaidTab={false}
                    showSwipeTutorial={idx === 0}
                  />
                );
              })}
            </div>
          </div>
        );
      });
    }

    return (
      <div className="space-y-2">
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
              showSwipeTutorial={i === 0 && activeTab === 'upcoming'}
              receiptData={activeTab === 'paid' ? getReceipt(p.id) : undefined}
              onReceiptTap={(id) => setReceiptPopover({ paymentId: id, paymentName: p.name })}
            />
          ))}
        </AnimatePresence>
      </div>
    );
  };

  const renderTrialCard = (trial: typeof trials[0], index: number) => {
    const daysLeft = differenceInDays(parseISO(trial.expires_on), new Date());
    const isExpired = daysLeft < 0;
    const urgencyColor = trial.is_cancelled
      ? 'text-muted-foreground'
      : isExpired || daysLeft <= 3
        ? 'text-primary'
        : 'text-muted-foreground';

    const urgencyBg = trial.is_cancelled
      ? 'bg-muted'
      : isExpired || daysLeft <= 3
        ? 'bg-primary/10'
        : 'bg-muted';

    const urgencyText = trial.is_cancelled
      ? 'Cancelled'
      : isExpired
        ? `Expired ${Math.abs(daysLeft)}d ago`
        : daysLeft === 0
          ? 'Expires today'
          : daysLeft === 1
            ? 'Expires tomorrow'
            : `${daysLeft} days left`;

    return (
      <motion.div
        key={trial.id}
        layout
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: trial.is_cancelled ? 0.5 : 1, y: 0 }}
        exit={{ opacity: 0, x: -120, scale: 0.92 }}
        transition={{ delay: index * 0.01, duration: 0.15 }}
        className="rounded-2xl mono-card px-4 py-4"
      >
        <div className="flex items-center gap-3.5">
          {/* Icon */}
          <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 mono-card-solid">
            <Timer className="w-[18px] h-[18px] text-muted-foreground" />
          </div>

          {/* Name + expiry */}
          <div className="flex-1 min-w-0">
            <h3 className={`font-semibold text-[15px] tracking-tight truncate ${trial.is_cancelled ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
              {trial.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${urgencyBg} ${urgencyColor}`}>
                {urgencyText}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {trial.cancel_url && !trial.is_cancelled && (
              <motion.a
                whileTap={{ scale: 0.9 }}
                href={trial.cancel_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl mono-card-solid flex items-center justify-center"
                onClick={e => e.stopPropagation()}
              >
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
              </motion.a>
            )}
            {!trial.is_cancelled && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  haptic(20);
                  cancelTrial(trial.id);
                  toast.success('Trial marked as cancelled');
                }}
                className="w-9 h-9 rounded-xl mono-card-solid flex items-center justify-center"
              >
                <XCircle className="w-4 h-4 text-primary" />
              </motion.button>
            )}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                haptic(20);
                deleteTrial(trial.id);
                toast.success('Trial deleted');
              }}
              className="w-9 h-9 rounded-xl mono-card-solid flex items-center justify-center"
            >
              <Trash2 className="w-4 h-4 text-destructive" />
            </motion.button>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderTrialsContent = () => {
    if (!isPremium) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-20"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Crown className="w-7 h-7 text-primary" />
          </div>
          <p className="text-foreground font-semibold text-base">Premium Feature</p>
          <p className="text-muted-foreground/50 text-sm mt-1.5 max-w-[240px] mx-auto">
            Track your free trials and get reminders before they expire
          </p>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => toast('Upgrade to Premium for Free Trial Tracking', { icon: '👑' })}
            className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold shadow-lg shadow-primary/25"
          >
            <Crown className="w-4 h-4" /> Unlock Premium
          </motion.button>
        </motion.div>
      );
    }

    if (trialsLoading && trials.length === 0) {
      return <PaymentCardSkeleton count={3} />;
    }

    if (trials.length === 0) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-20"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mono-card mb-4">
            <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
              <Timer className="w-7 h-7 text-muted-foreground/40" />
            </motion.div>
          </div>
          <p className="text-foreground font-semibold text-base">No free trials</p>
          <p className="text-muted-foreground/50 text-sm mt-1.5 max-w-[240px] mx-auto">
            Add a free trial to track when it expires
          </p>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setTrialSheetOpen(true)}
            className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold shadow-lg shadow-primary/25"
          >
            <Plus className="w-4 h-4" /> Add Trial
          </motion.button>
        </motion.div>
      );
    }

    return (
      <div className="space-y-2">
        {activeTrials.length > 0 && (
          <div className="mb-2">
            <div className="flex items-center gap-2 mb-3 mt-2">
              <span className="text-[11px] font-semibold uppercase tracking-[1px] text-muted-foreground/60">Active</span>
              <div className="flex-1 h-px bg-border/20" />
              <span className="text-[11px] text-muted-foreground/40">{activeTrials.length}</span>
            </div>
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {activeTrials.map((t, i) => renderTrialCard(t, i))}
              </AnimatePresence>
            </div>
          </div>
        )}
        {cancelledTrials.length > 0 && (
          <div className="mb-2">
            <div className="flex items-center gap-2 mb-3 mt-4">
              <span className="text-[11px] font-semibold uppercase tracking-[1px] text-muted-foreground/40">Cancelled</span>
              <div className="flex-1 h-px bg-border/20" />
              <span className="text-[11px] text-muted-foreground/40">{cancelledTrials.length}</span>
            </div>
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {cancelledTrials.map((t, i) => renderTrialCard(t, i))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <PageTransition>
      <Confetti trigger={confettiTrigger} />
      <AnimatePresence>
        {showTutorial && <OnboardingTutorial onComplete={() => setShowTutorial(false)} />}
      </AnimatePresence>
      <div
        ref={scrollRef}
        className="min-h-screen pb-24 px-5 pt-8 max-w-md mx-auto"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <PullIndicator />

        {/* ━━━ HERO SECTION ━━━ */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <p className="text-[15px] font-medium text-muted-foreground/70 mb-0.5">
            {(() => {
              const h = new Date().getHours();
              const greeting = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
              return userName ? `${greeting}, ${userName.split(' ')[0]}` : greeting;
            })()}
          </p>
          <motion.h1
            key={totalUpcoming}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="text-5xl font-extrabold tracking-tight text-foreground leading-none mt-1"
          >
            {formatCurrency(totalUpcoming)}
          </motion.h1>
          <p className="text-[13px] text-muted-foreground/50 mt-1.5">due across {summary.unpaidCount} bill{summary.unpaidCount !== 1 ? 's' : ''}</p>

          {/* Summary badges */}
          {(summary.overdueCount > 0 || summary.paidCount > 0) && (
            <div className="flex items-center gap-2 mt-3">
              {summary.overdueCount > 0 && (
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                  {summary.overdueCount} overdue
                </span>
              )}
              {summary.paidCount > 0 && (
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
                  {summary.paidCount} paid
                </span>
              )}
            </div>
          )}
        </motion.header>

        {/* ━━━ SEARCH BAR ━━━ */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-5"
        >
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30 pointer-events-none" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search"
                className="w-full h-10 mono-card border-0 rounded-xl pl-10 pr-9 text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-1 focus:ring-border transition-all"
              />
              {searchQuery && (
                <motion.button
                  initial={{ scale: 0 }} animate={{ scale: 1 }} whileTap={{ scale: 0.8 }}
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-muted flex items-center justify-center"
                >
                  <X className="w-3 h-3 text-muted-foreground" />
                </motion.button>
              )}
            </div>
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={cycleSortMode}
              className="h-10 px-3 rounded-xl mono-card flex items-center gap-1.5 flex-shrink-0"
            >
              <AnimatePresence mode="wait">
                <motion.span
                  key={sortMode}
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -10, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="flex items-center gap-1.5"
                >
                  {sortMode === 'date' && <Clock className="w-3.5 h-3.5 text-muted-foreground" />}
                  {sortMode === 'amount' && <ArrowDownUp className="w-3.5 h-3.5 text-muted-foreground" />}
                  {sortMode === 'name' && <ArrowDownAZ className="w-3.5 h-3.5 text-muted-foreground" />}
                  <span className="text-xs font-medium text-foreground">{SORT_LABELS[sortMode]}</span>
                </motion.span>
              </AnimatePresence>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => {
                if (!isPremium) { toast('Upgrade to Premium for advanced filters', { icon: '👑' }); return; }
                setShowFilters(!showFilters);
              }}
              className="relative h-10 px-3 rounded-xl mono-card flex items-center gap-1.5 flex-shrink-0"
            >
              {!isPremium && <Crown className="w-3 h-3 text-primary" />}
              <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </motion.button>
          </div>
        </motion.div>

        {/* ━━━ ADVANCED FILTERS ━━━ */}
        <AnimatePresence>
          {showFilters && isPremium && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="overflow-hidden mb-5"
            >
              <div className="p-4 rounded-2xl mono-card space-y-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-2">Date Range</p>
                  <div className="flex gap-2">
                    <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} className="flex-1 h-9 px-3 rounded-lg bg-secondary/60 border-0 text-xs text-foreground" />
                    <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} className="flex-1 h-9 px-3 rounded-lg bg-secondary/60 border-0 text-xs text-foreground" />
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-2">Amount Range</p>
                  <div className="flex gap-2">
                    <input type="number" value={filterAmountMin} onChange={e => setFilterAmountMin(e.target.value)} className="flex-1 h-9 px-3 rounded-lg bg-secondary/60 border-0 text-xs text-foreground placeholder:text-muted-foreground/30" placeholder="Min" />
                    <input type="number" value={filterAmountMax} onChange={e => setFilterAmountMax(e.target.value)} className="flex-1 h-9 px-3 rounded-lg bg-secondary/60 border-0 text-xs text-foreground placeholder:text-muted-foreground/30" placeholder="Max" />
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-2">Categories</p>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map(cat => {
                      const Icon = cat.icon;
                      const isActive = filterCategories.includes(cat.id);
                      return (
                        <motion.button key={cat.id} whileTap={{ scale: 0.93 }}
                          onClick={() => setFilterCategories(prev => isActive ? prev.filter(c => c !== cat.id) : [...prev, cat.id])}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${isActive ? 'text-foreground' : 'bg-secondary/40 text-muted-foreground'}`}
                          style={isActive ? { backgroundColor: `${cat.color}20`, color: cat.color } : undefined}
                        >
                          <Icon className="w-3 h-3" />{cat.label}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
                {activeFilterCount > 0 && (
                  <motion.button whileTap={{ scale: 0.95 }} onClick={clearAdvancedFilters} className="text-xs text-destructive font-medium">
                    Clear all filters
                  </motion.button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ━━━ SEGMENTED CONTROL (iOS-native) ━━━ */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="mb-5"
        >
          <div className="relative flex rounded-xl p-[3px] mono-card">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              const count = tab.id === 'upcoming' ? unpaid.length : tab.id === 'paid' ? paid.length : tab.id === 'trials' ? activeTrials.length : 0;
              return (
                <motion.button
                  key={tab.id}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    if (tab.id === 'trials' && !isPremium) {
                      toast('Upgrade to Premium for Free Trial Tracking', { icon: '👑' });
                      return;
                    }
                    setActiveTab(tab.id);
                    haptic(15);
                  }}
                  className={`relative flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-[10px] text-[13px] font-semibold transition-colors z-10 ${isActive ? 'text-foreground' : 'text-muted-foreground/50'}`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="scheduleTab"
                      className="absolute inset-0 rounded-[10px] mono-card-solid"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                  <span className="relative flex items-center gap-1.5">
                    {tab.label}
                    {tab.premium && !isPremium && <Crown className="w-3 h-3 text-primary" />}
                    {count > 0 && (
                      <span className={`text-[10px] min-w-[16px] text-center px-1 py-px rounded-full font-semibold ${isActive ? 'bg-primary/15 text-primary' : 'bg-muted/50 text-muted-foreground/40'}`}>
                        {count}
                      </span>
                    )}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* ━━━ CATEGORY FILTER (text-only scroll row) ━━━ */}
        {activeTab !== 'trials' && usedCategories.length > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mb-5"
          >
            <div className="flex gap-5 overflow-x-auto pb-1 scrollbar-none" style={{ maskImage: 'linear-gradient(to right, black 92%, transparent)' }}>
              <button
                onClick={() => setActiveFilter(null)}
                className={`flex-shrink-0 text-[13px] font-semibold pb-1.5 transition-all border-b-2 ${!activeFilter ? 'text-primary border-primary' : 'text-muted-foreground/40 border-transparent'}`}
              >
                All
              </button>
              {usedCategories.map(cat => {
                const isActive = activeFilter === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveFilter(isActive ? null : cat.id)}
                    className={`flex-shrink-0 text-[13px] font-semibold pb-1.5 transition-all border-b-2 ${isActive ? 'text-primary border-primary' : 'text-muted-foreground/40 border-transparent'}`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ━━━ CONTENT ━━━ */}
        <AnimatePresence mode="wait">
          {activeTab === 'trials' ? (
            <motion.div
              key="trials"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderTrialsContent()}
            </motion.div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: activeTab === 'upcoming' ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: activeTab === 'upcoming' ? 20 : -20 }}
              transition={{ duration: 0.2 }}
            >
              {showSkeleton ? (
                <PaymentCardSkeleton count={3} />
              ) : currentList.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-20"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mono-card mb-4">
                    <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
                      <Sparkles className="w-7 h-7 text-muted-foreground/40" />
                    </motion.div>
                  </div>
                  <p className="text-foreground font-semibold text-base">
                    {activeTab === 'upcoming' ? 'All clear' : 'Nothing here yet'}
                  </p>
                  <p className="text-muted-foreground/50 text-sm mt-1.5 max-w-[240px] mx-auto">
                    {activeTab === 'upcoming' ? 'Add your first payment to start tracking' : 'Payments you complete will appear here'}
                  </p>
                  {activeTab === 'upcoming' && (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => { setEditing(null); setSheetOpen(true); }}
                      className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold shadow-lg shadow-primary/25"
                    >
                      <Plus className="w-4 h-4" /> Add Payment
                    </motion.button>
                  )}
                </motion.div>
              ) : (
                <>
                  {activeTab === 'paid' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-end mb-3">
                      <motion.button
                        whileTap={{ scale: 0.93 }}
                        onClick={() => setShowClearConfirm(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-destructive bg-destructive/10"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Clear All
                      </motion.button>
                    </motion.div>
                  )}


                  {renderPaymentList()}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ━━━ FAB ━━━ */}
        {(activeTab === 'upcoming' || activeTab === 'trials') && !sheetOpen && !trialSheetOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => {
              haptic(20);
              if (activeTab === 'trials') {
                setTrialSheetOpen(true);
              } else if (isPremium) {
                // Premium users get picker for payment vs trial
                setFabPickerOpen(true);
              } else {
                // Non-premium: directly open add payment
                setEditing(null);
                setSheetOpen(true);
              }
            }}
            className="fixed bottom-20 right-5 w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center z-[60] shadow-xl shadow-primary/30 active:scale-90 transition-transform"
          >
            <Plus className="w-7 h-7" strokeWidth={2.5} />
          </motion.button>
        )}

        {/* ━━━ FAB TYPE PICKER ━━━ */}
        <AnimatePresence>
          {fabPickerOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="fixed inset-0 bg-background/60 backdrop-blur-sm z-[65]"
                onClick={() => setFabPickerOpen(false)}
              />
              <motion.div
                initial={{ y: 40, opacity: 0, scale: 0.9 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 40, opacity: 0, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="fixed bottom-36 right-5 z-[66] w-56"
              >
                <div className="mono-card rounded-2xl shadow-2xl shadow-black/30 overflow-hidden border border-border/30">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      setFabPickerOpen(false);
                      setEditing(null);
                      setSheetOpen(true);
                      haptic(15);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-semibold text-foreground hover:bg-secondary/60 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-xl mono-card-solid flex items-center justify-center">
                      <CreditCard className="w-4.5 h-4.5 text-muted-foreground" />
                    </div>
                    Regular Payment
                  </motion.button>
                  <div className="h-px bg-border/30 mx-4" />
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      setFabPickerOpen(false);
                      if (!isPremium) {
                        toast('Upgrade to Premium for Free Trial Tracking', { icon: '👑' });
                        return;
                      }
                      setTrialSheetOpen(true);
                      haptic(15);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-semibold text-foreground hover:bg-secondary/60 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-xl mono-card-solid flex items-center justify-center">
                      <Timer className="w-4.5 h-4.5 text-muted-foreground" />
                    </div>
                    <span className="flex-1 text-left">Free Trial</span>
                    {!isPremium && <Crown className="w-3.5 h-3.5 text-primary" />}
                  </motion.button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <AddPaymentSheet
          open={sheetOpen}
          onClose={() => { setSheetOpen(false); setEditing(null); }}
          onSubmit={handleSubmit}
          editing={editing}
          recentPayments={payments}
        />

        <AddTrialSheet
          open={trialSheetOpen}
          onClose={() => setTrialSheetOpen(false)}
          onSubmit={handleTrialSubmit}
        />

        {/* Clear Paid Confirmation */}
        <AnimatePresence>
          {showClearConfirm && (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
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
                <div className="bg-card rounded-2xl shadow-2xl p-6 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-destructive/10 mb-4">
                    <Trash2 className="w-7 h-7 text-destructive" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-1">Clear Paid List?</h3>
                  <p className="text-sm text-muted-foreground mb-5">
                    This will delete {paid.length} paid payment{paid.length !== 1 ? 's' : ''}.
                  </p>
                  <div className="flex gap-3">
                    <motion.button whileTap={{ scale: 0.96 }} onClick={() => setShowClearConfirm(false)} className="flex-1 h-11 rounded-xl bg-secondary text-foreground font-medium text-sm">Cancel</motion.button>
                    <motion.button whileTap={{ scale: 0.96 }} onClick={async () => {
                      try {
                        const count = paid.length;
                        const deleted = await clearPaid();
                        setShowClearConfirm(false);
                        toast.success(`${count} paid payment${count !== 1 ? 's' : ''} cleared`, {
                          action: { label: 'Undo', onClick: async () => { try { await restorePayments(deleted); toast.success('Payments restored'); } catch { toast.error('Failed to restore'); } } },
                          duration: 6000,
                        });
                      } catch { toast.error('Failed to clear'); }
                    }} className="flex-1 h-11 rounded-xl bg-destructive text-destructive-foreground font-medium text-sm">Clear All</motion.button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Receipt Detail */}
        <AnimatePresence>
          {receiptPopover && (() => {
            const rd = getReceipt(receiptPopover.paymentId);
            return (
              <>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-background z-[70]" onClick={() => setReceiptPopover(null)} />
                <motion.div
                  initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                  transition={{ type: 'spring', stiffness: 300, damping: 32 }}
                  className="fixed bottom-0 left-0 right-0 z-[70] max-w-md mx-auto"
                >
                  <div className="rounded-t-[22px] overflow-hidden shadow-2xl bg-card border-t border-border/20">
                    <div className="flex justify-center pt-3 pb-1"><div className="w-9 h-[4px] rounded-full bg-muted-foreground/20" /></div>
                    <div className="flex items-center justify-between px-5 py-3 border-b border-border/20">
                      <h2 className="text-[17px] font-bold text-foreground">Payment Receipt</h2>
                      <motion.button whileTap={{ scale: 0.85 }} onClick={() => setReceiptPopover(null)} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                        <X className="w-4 h-4 text-muted-foreground" />
                      </motion.button>
                    </div>
                    <div className="px-5 py-5 space-y-4">
                      <p className="text-sm text-muted-foreground text-center">
                        Receipt for <span className="font-semibold text-foreground">{receiptPopover.paymentName}</span>
                      </p>
                      {rd?.confirmationNumber && (
                        <div className="rounded-xl bg-secondary/50 px-4 py-3 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <ReceiptIcon className="w-4 h-4 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Confirmation #</p>
                            <p className="text-sm font-mono font-semibold text-foreground truncate">{rd.confirmationNumber}</p>
                          </div>
                        </div>
                      )}
                      {rd?.receiptImage && (
                        <div className="rounded-xl overflow-hidden border border-border/20">
                          <img src={rd.receiptImage} alt="Receipt" className="w-full max-h-64 object-contain bg-secondary/30" />
                        </div>
                      )}
                      {!rd?.confirmationNumber && !rd?.receiptImage && (
                        <p className="text-sm text-muted-foreground text-center py-4">No receipt details saved.</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              </>
            );
          })()}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
