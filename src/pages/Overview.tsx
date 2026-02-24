import { useMemo, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, AlertTriangle, Clock, CalendarClock, Plus, Banknote, Settings2, Clock3, ExternalLink, CheckCircle2, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { addDays, isBefore, startOfDay, isAfter, parseISO, endOfDay, format, differenceInDays } from 'date-fns';
import { usePayments, type Payment } from '@/hooks/usePayments';
import { useUser } from '@/hooks/useUser';
import { useCurrency } from '@/hooks/useCurrency';
import { usePaydays } from '@/hooks/usePaydays';
import { useReceiptStash } from '@/hooks/useReceiptStash';
import { useFreeTrials, type FreeTrial } from '@/hooks/useFreeTrials';
import { usePremium } from '@/hooks/usePremium';
import PageTransition from '@/components/PageTransition';
import BillItem from '@/components/overview/BillItem';
import PaymentActionSheet from '@/components/overview/PaymentActionSheet';
import MarkPaidDrawer from '@/components/overview/MarkPaidDrawer';
import AddPaymentSheet from '@/components/AddPaymentSheet';
import AddTrialSheet from '@/components/AddTrialSheet';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

type ViewMode = 'monthly' | 'paycheck';

export default function Overview() {
  const { userId } = useUser();
  const { format: formatCurrency } = useCurrency();
  const { payments, markPaid, updatePayment, addPayment } = usePayments(userId);
  const { payDays, updatePayDays, upcomingPaydays, nextPayday } = usePaydays();
  const { saveReceipt } = useReceiptStash();
  const { isPremium } = usePremium();
  const { trials, loading: trialsLoading, fetchTrials, addTrial, cancelTrial, deleteTrial } = useFreeTrials(userId);
  const navigate = useNavigate();

  const [trialsOpen, setTrialsOpen] = useState(true);
  const [addTrialOpen, setAddTrialOpen] = useState(false);

  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [actionOpen, setActionOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [markPaidDrawerOpen, setMarkPaidDrawerOpen] = useState(false);
  const [paymentToMarkPaid, setPaymentToMarkPaid] = useState<Payment | null>(null);
  const [partialAmounts, setPartialAmounts] = useState<Record<string, number>>({});
  const [variableAmounts, setVariableAmounts] = useState<Record<string, number>>({});
  const [paidAnimating, setPaidAnimating] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');
  const [paydayInput, setPaydayInput] = useState('');

  const unpaid = useMemo(() => payments.filter(p => !p.is_paid), [payments]);

  const today = startOfDay(new Date());
  const weekEnd = endOfDay(addDays(today, 7));

  // Helper to get effective amount considering shared bills
  const getEffectiveAmount = useCallback((p: Payment) => {
    if (p.isShared && p.userShareAmount != null) return p.userShareAmount;
    const variable = variableAmounts[p.id];
    return p.amount === 0 ? (variable || 0) : p.amount;
  }, [variableAmounts]);

  const totalNext7 = useMemo(() => {
    return unpaid
      .filter(p => !isAfter(parseISO(p.due_date), weekEnd))
      .reduce((sum, p) => {
        const amt = getEffectiveAmount(p);
        const partial = partialAmounts[p.id] || 0;
        return sum + Math.max(0, amt - partial);
      }, 0);
  }, [unpaid, weekEnd, partialAmounts, getEffectiveAmount]);

  // Monthly groups
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

  // Paycheck view groups
  const paycheckGroups = useMemo(() => {
    if (viewMode !== 'paycheck' || upcomingPaydays.length === 0) return [];
    
    const result: { payday: Date; bills: Payment[]; total: number }[] = [];
    
    for (let i = 0; i < upcomingPaydays.length; i++) {
      const payday = upcomingPaydays[i];
      const prevPayday = i === 0 ? today : upcomingPaydays[i - 1];
      
      const bills = unpaid.filter(p => {
        const d = parseISO(p.due_date);
        return (i === 0 ? true : isAfter(d, prevPayday)) && !isAfter(d, payday);
      });
      
      if (bills.length > 0) {
        const total = bills.reduce((sum, p) => {
          const amt = getEffectiveAmount(p);
          const partial = partialAmounts[p.id] || 0;
          return sum + Math.max(0, amt - partial);
        }, 0);
        result.push({ payday, bills, total });
      }
    }
    
    // Bills after last payday
    const lastPayday = upcomingPaydays[upcomingPaydays.length - 1];
    const laterBills = unpaid.filter(p => isAfter(parseISO(p.due_date), lastPayday));
    if (laterBills.length > 0) {
      const total = laterBills.reduce((sum, p) => sum + Math.max(0, getEffectiveAmount(p) - (partialAmounts[p.id] || 0)), 0);
      result.push({ payday: lastPayday, bills: laterBills, total });
    }
    
    return result;
  }, [viewMode, unpaid, upcomingPaydays, today, partialAmounts, getEffectiveAmount]);

  // Next paycheck summary
  const nextPaycheckSummary = useMemo(() => {
    if (!nextPayday) return null;
    const bills = unpaid.filter(p => !isAfter(parseISO(p.due_date), nextPayday));
    const total = bills.reduce((sum, p) => sum + Math.max(0, getEffectiveAmount(p) - (partialAmounts[p.id] || 0)), 0);
    return { count: bills.length, total, date: nextPayday };
  }, [nextPayday, unpaid, partialAmounts, getEffectiveAmount]);

  useEffect(() => { if (userId && isPremium) fetchTrials(); }, [userId, isPremium, fetchTrials]);

  const activeTrials = useMemo(() => trials.filter(t => !t.is_cancelled), [trials]);

  const handleTap = useCallback((p: Payment) => {
    setSelectedPayment(p);
    setActionOpen(true);
  }, []);

  // Intercept mark paid to show the receipt drawer
  const handleInitiateMarkPaid = useCallback((p: Payment) => {
    setPaymentToMarkPaid(p);
    setMarkPaidDrawerOpen(true);
    setActionOpen(false);
  }, []);

  const handleConfirmPaid = useCallback(async (p: Payment, confirmationNumber?: string, receiptImage?: string) => {
    if (confirmationNumber || receiptImage) {
      saveReceipt(p.id, { confirmationNumber, receiptImage });
    }
    setPaidAnimating(prev => new Set(prev).add(p.id));
    setTimeout(async () => {
      await markPaid(p);
      setPaidAnimating(prev => {
        const next = new Set(prev);
        next.delete(p.id);
        return next;
      });
      toast.success(`${p.name} marked as paid`);
    }, 400);
  }, [markPaid, saveReceipt]);

  const handlePartialPay = useCallback((p: Payment, amount: number) => {
    setPartialAmounts(prev => ({
      ...prev,
      [p.id]: (prev[p.id] || 0) + amount,
    }));
    const total = (partialAmounts[p.id] || 0) + amount;
    if (total >= getEffectiveAmount(p)) {
      handleInitiateMarkPaid(p);
    } else {
      toast.success(`Partial payment of ${amount} recorded`);
    }
  }, [partialAmounts, handleInitiateMarkPaid, getEffectiveAmount]);

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

  const handleAddPayday = useCallback(() => {
    const day = parseInt(paydayInput);
    if (day >= 1 && day <= 31 && !payDays.includes(day)) {
      updatePayDays([...payDays, day]);
      setPaydayInput('');
    }
  }, [paydayInput, payDays, updatePayDays]);

  const handleRemovePayday = useCallback((day: number) => {
    updatePayDays(payDays.filter(d => d !== day));
  }, [payDays, updatePayDays]);

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
                    onSwipePay={handleInitiateMarkPaid}
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
          className="mb-6"
        >
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Overview</h1>
        </motion.header>

        {/* View Mode Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.03 }}
          className="mb-5 flex items-center gap-2"
        >
          <div className="flex bg-secondary/60 rounded-xl p-1 flex-1">
            <button
              onClick={() => setViewMode('monthly')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'monthly'
                  ? 'bg-card text-card-foreground shadow-sm'
                  : 'text-muted-foreground'
              }`}
            >
              Monthly View
            </button>
            <button
              onClick={() => setViewMode('paycheck')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'paycheck'
                  ? 'bg-card text-card-foreground shadow-sm'
                  : 'text-muted-foreground'
              }`}
            >
              Paycheck View
            </button>
          </div>

          {/* Payday Settings */}
          {viewMode === 'paycheck' && (
            <Popover>
              <PopoverTrigger asChild>
                <button className="w-9 h-9 rounded-xl bg-secondary/60 flex items-center justify-center">
                  <Settings2 className="w-4 h-4 text-muted-foreground" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-56 bg-card border-border" align="end">
                <p className="text-xs font-semibold text-card-foreground mb-2">Payday Dates</p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {payDays.map(day => (
                    <button
                      key={day}
                      onClick={() => handleRemovePayday(day)}
                      className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-destructive/10 hover:text-destructive transition-colors"
                    >
                      {day}{day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'}  ×
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min="1"
                    max="31"
                    value={paydayInput}
                    onChange={e => setPaydayInput(e.target.value)}
                    placeholder="Day"
                    className="h-8 text-xs bg-secondary/50 border-0 rounded-lg"
                  />
                  <Button onClick={handleAddPayday} size="sm" className="rounded-lg h-8 text-xs px-3">
                    Add
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </motion.div>

        {/* Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-8 rounded-3xl bg-card p-6"
        >
          {viewMode === 'monthly' ? (
            <>
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
            </>
          ) : nextPaycheckSummary ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Before Next Paycheck
                </p>
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Banknote className="w-4 h-4 text-primary" />
                </div>
              </div>
              <p className="text-4xl font-bold text-card-foreground tracking-tight">
                {formatCurrency(nextPaycheckSummary.total)}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {nextPaycheckSummary.count} bill{nextPaycheckSummary.count !== 1 ? 's' : ''} due before {format(nextPaycheckSummary.date, 'MMM d')}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No paydays configured</p>
          )}
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
          {viewMode === 'monthly' ? (
            <>
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
            </>
          ) : (
            paycheckGroups.map((group, i) => (
              <div key={i} className="mb-6">
                <div className="flex items-center gap-2 mb-3 ml-1">
                  <Banknote className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                    Before {format(group.payday, 'MMM d')}
                  </span>
                  <span className="text-xs text-muted-foreground/60 ml-auto mr-1">
                    {formatCurrency(group.total)}
                  </span>
                </div>
                <div className="space-y-2">
                  <AnimatePresence mode="popLayout">
                    {group.bills
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
                            onSwipePay={handleInitiateMarkPaid}
                            partialAmount={partialAmounts[p.id]}
                            isVariable={p.amount === 0 && !variableAmounts[p.id]}
                          />
                        </motion.div>
                      ))}
                  </AnimatePresence>
                </div>
              </div>
            ))
          )}
        </motion.div>

        {/* Free Trials Section */}
        {isPremium && activeTrials.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-6"
          >
            <button
              onClick={() => setTrialsOpen(prev => !prev)}
              className="flex items-center gap-2 mb-3 ml-1 w-full text-left"
            >
              <Clock3 className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">Free Trials</span>
              <span className="text-xs text-muted-foreground/60 ml-auto mr-1">{activeTrials.length}</span>
              {trialsOpen ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground/40" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/40" />}
            </button>
            <AnimatePresence>
              {trialsOpen && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden space-y-2">
                  {activeTrials.map(trial => {
                    const daysLeft = differenceInDays(parseISO(trial.expires_on), new Date());
                    const urgencyColor = daysLeft <= 1 ? 'text-destructive' : daysLeft <= 3 ? 'text-yellow-500' : 'text-muted-foreground';
                    const urgencyBg = daysLeft <= 1 ? 'bg-destructive/10' : daysLeft <= 3 ? 'bg-yellow-500/10' : 'bg-secondary/50';
                    return (
                      <motion.div
                        key={trial.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        className="rounded-2xl bg-card border border-border/50 p-4 flex items-center gap-3"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-card-foreground truncate">{trial.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${urgencyBg} ${urgencyColor}`}>
                              {daysLeft <= 0 ? 'Expired' : `${daysLeft}d left`}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {trial.cancel_url && (
                            <button
                              onClick={() => window.open(trial.cancel_url, '_blank')}
                              className="w-8 h-8 rounded-lg bg-secondary/60 flex items-center justify-center"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                            </button>
                          )}
                          <button
                            onClick={() => { cancelTrial(trial.id); toast.success('Trial marked as cancelled'); }}
                            className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                          </button>
                          <button
                            onClick={() => { deleteTrial(trial.id); toast.success('Trial removed'); }}
                            className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setAddTrialOpen(true)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-border text-xs font-medium text-muted-foreground"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Trial
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

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
          onMarkPaid={handleInitiateMarkPaid}
          onPartialPay={handlePartialPay}
          onUpdateReminder={handleUpdateReminder}
          onSetVariableAmount={handleSetVariable}
          partialAmounts={partialAmounts}
        />

        {/* Mark Paid Drawer (Receipt Stash) */}
        <MarkPaidDrawer
          payment={paymentToMarkPaid}
          open={markPaidDrawerOpen}
          onClose={() => setMarkPaidDrawerOpen(false)}
          onConfirm={handleConfirmPaid}
        />

        {/* Add Payment Sheet */}
        <AddPaymentSheet
          open={addOpen}
          onClose={() => setAddOpen(false)}
          onSubmit={handleAddSubmit}
          recentPayments={payments}
        />

        {/* Add Trial Sheet */}
        <AddTrialSheet
          open={addTrialOpen}
          onClose={() => setAddTrialOpen(false)}
          onSubmit={async (data) => { await addTrial(data); toast.success('Trial added!'); }}
        />
      </div>
    </PageTransition>
  );
}
