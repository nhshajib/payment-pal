import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Plus, UserPlus, Trash2, Receipt, X, Crown, Users, Lock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useSplitGroupDetail, type SplitGroup } from '@/hooks/useSplitGroups';
import { useCurrency } from '@/hooks/useCurrency';
import { usePremium } from '@/hooks/usePremium';
import { useRoommates } from '@/hooks/useRoommates';
import { useUser } from '@/hooks/useUser';
import { Input } from '@/components/ui/input';
import AddExpenseSheet from '@/components/split/AddExpenseSheet';
import BalanceSummary from '@/components/split/BalanceSummary';
import PageTransition from '@/components/PageTransition';
import { haptic } from '@/lib/haptics';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const FREE_EXPENSE_LIMIT = 15;

interface Props {
  group: SplitGroup;
  onBack: () => void;
}

export default function SplitGroupDetail({ group, onBack }: Props) {
  const {
    members, expenses, shares, loading,
    addMember, removeMember, addExpense, deleteExpense, settleShare,
    balances, settlements, totalExpenses,
  } = useSplitGroupDetail(group.id);
  const { format: formatCurrency } = useCurrency();
  const { isPremium } = usePremium();
  const { userId } = useUser();
  const { roommates } = useRoommates(userId);
  const navigate = useNavigate();
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showRoommatesPicker, setShowRoommatesPicker] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [activeTab, setActiveTab] = useState<'expenses' | 'balances'>('expenses');

  const maxMembers = isPremium ? 999 : 5;
  const maxExpenses = isPremium ? 999 : FREE_EXPENSE_LIMIT;
  const atMemberLimit = members.length >= maxMembers;
  const atExpenseLimit = expenses.length >= maxExpenses;
  const confirmedRoommates = roommates.filter(r => r.status === 'confirmed' || r.nickname);

  const handleAddMember = async () => {
    if (!newMemberName.trim()) return;
    if (atMemberLimit) {
      toast.error(isPremium ? 'Member limit reached' : 'Free limit: 5 members. Upgrade for unlimited.');
      return;
    }
    await addMember(newMemberName.trim());
    setNewMemberName('');
    setShowAddMember(false);
    toast.success('Member added');
  };

  const handleAddRoommate = async (name: string) => {
    if (members.find(m => m.name === name)) {
      toast('Already in group');
      return;
    }
    if (atMemberLimit) {
      toast.error(isPremium ? 'Member limit reached' : 'Upgrade to add more members');
      return;
    }
    await addMember(name);
    toast.success(`${name} added`);
    haptic(10);
  };

  return (
    <PageTransition>
      <div className="min-h-screen pb-28 px-5 pt-6 max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-card flex items-center justify-center flex-shrink-0"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </motion.button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{group.emoji}</span>
              <h1 className="text-2xl font-bold text-foreground tracking-tight truncate">{group.name}</h1>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1 rounded-2xl mono-card p-4 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.8px] text-muted-foreground/60 mb-1">Total</p>
            <p className="text-xl font-extrabold text-foreground tracking-tight">{formatCurrency(totalExpenses)}</p>
          </div>
          <div className="flex-1 rounded-2xl mono-card p-4 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.8px] text-muted-foreground/60 mb-1">Members</p>
            <p className="text-xl font-extrabold text-foreground tracking-tight">{members.length}</p>
          </div>
          <div className="flex-1 rounded-2xl mono-card p-4 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.8px] text-muted-foreground/60 mb-1">
              {isPremium ? 'Bills' : `Bills`}
            </p>
            <p className="text-xl font-extrabold text-foreground tracking-tight">
              {expenses.length}
              {!isPremium && <span className="text-[13px] text-muted-foreground/40 font-normal">/{FREE_EXPENSE_LIMIT}</span>}
            </p>
          </div>
        </div>

        {/* Members */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2 ml-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.8px] text-muted-foreground">Members</p>
            {!atMemberLimit && (
              <div className="flex items-center gap-2">
                {confirmedRoommates.length > 0 && (
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => { setShowRoommatesPicker(!showRoommatesPicker); haptic(10); }}
                    className="text-[12px] font-semibold text-primary flex items-center gap-1"
                  >
                    <Users className="w-3.5 h-3.5" /> Roommates
                  </motion.button>
                )}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => { setShowAddMember(!showAddMember); haptic(10); }}
                  className="text-[12px] font-semibold text-primary flex items-center gap-1"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Add
                </motion.button>
              </div>
            )}
          </div>

          <AnimatePresence>
            {showRoommatesPicker && confirmedRoommates.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mb-2"
              >
                <div className="rounded-xl mono-card p-2 flex flex-wrap gap-2">
                  {confirmedRoommates.map(r => {
                    const displayName = r.partner_name || r.nickname || 'Roommate';
                    const exists = members.some(m => m.name === displayName);
                    return (
                      <motion.button
                        key={r.id}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleAddRoommate(displayName)}
                        disabled={exists || atMemberLimit}
                        className={`px-3 py-2 rounded-lg text-sm font-medium ${
                          exists ? 'bg-primary/10 text-primary' : 'mono-card-solid text-foreground'
                        } disabled:opacity-50`}
                      >
                        {displayName} {exists ? '✓' : ''}
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {showAddMember && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mb-2"
              >
                <div className="flex gap-2">
                  <Input
                    value={newMemberName}
                    onChange={e => setNewMemberName(e.target.value)}
                    placeholder="Name"
                    className="h-11 bg-secondary/50 border-0 rounded-xl text-sm flex-1"
                    maxLength={30}
                    onKeyDown={e => e.key === 'Enter' && handleAddMember()}
                  />
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={handleAddMember}
                    className="w-11 h-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!isPremium && atMemberLimit && (
            <div className="rounded-xl bg-primary/10 border border-primary/20 p-3 mb-2 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-foreground">Free limit reached</p>
                <p className="text-[11px] text-muted-foreground/60">5 members max per event</p>
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/premium')}
                className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-[11px] font-semibold"
              >
                Upgrade
              </motion.button>
            </div>
          )}

          <div className="flex gap-2 flex-wrap">
            {members.map(m => (
              <div
                key={m.id}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl mono-card-solid"
              >
                <span className="text-sm font-medium text-foreground">{m.name}</span>
                {m.is_owner && <span className="text-[10px] text-muted-foreground/50">👑</span>}
                {!m.is_owner && (
                  <motion.button
                    whileTap={{ scale: 0.8 }}
                    onClick={() => { removeMember(m.id); toast.success('Removed'); }}
                  >
                    <X className="w-3 h-3 text-muted-foreground/40" />
                  </motion.button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 rounded-[10px] bg-muted mb-5">
          {(['expenses', 'balances'] as const).map(tab => (
            <motion.button
              key={tab}
              whileTap={{ scale: 0.96 }}
              onClick={() => { setActiveTab(tab); haptic(10); }}
              className={`relative flex-1 py-[7px] rounded-[8px] text-[13px] font-semibold z-10 transition-colors ${
                activeTab === tab ? 'text-foreground' : 'text-muted-foreground'
              }`}
            >
              {activeTab === tab && (
                <motion.div
                  layoutId="split-tab"
                  className="absolute inset-0 rounded-[8px] bg-card shadow-sm"
                  transition={{ type: 'spring', stiffness: 300, damping: 22, mass: 0.8 }}
                />
              )}
              <span className="relative z-10 capitalize">{tab}</span>
            </motion.button>
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'expenses' ? (
            <motion.div key="expenses" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              {/* Expense limit banner for free users */}
              {!isPremium && atExpenseLimit && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20 p-5 mb-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Lock className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[15px] font-bold text-foreground mb-1">Expense Limit Reached</h4>
                      <p className="text-[13px] text-muted-foreground/70 leading-relaxed">
                        You've added {FREE_EXPENSE_LIMIT} expenses in this group. Upgrade to Premium for unlimited expense tracking.
                      </p>
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => navigate('/premium')}
                        className="mt-3 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold inline-flex items-center gap-1.5"
                      >
                        <Crown className="w-3.5 h-3.5" />
                        Upgrade to Premium
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}

              {expenses.length === 0 ? (
                <div className="text-center py-16">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mono-card mb-3">
                    <Receipt className="w-6 h-6 text-muted-foreground/30" />
                  </div>
                  <p className="text-sm text-muted-foreground/50">No expenses yet</p>
                  {members.length < 2 ? (
                    <p className="text-xs text-muted-foreground/30 mt-1">Add at least 2 members to split expenses</p>
                  ) : (
                    <p className="text-xs text-muted-foreground/30 mt-1">Add your first bill</p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {expenses.map((exp, i) => {
                    const payer = members.find(m => m.id === exp.paid_by);
                    const expShares = shares.filter(s => s.expense_id === exp.id);
                    return (
                      <motion.div
                        key={exp.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="rounded-2xl mono-card px-4 py-4"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-[15px] font-semibold text-foreground truncate">{exp.title}</h3>
                            <p className="text-[12px] text-muted-foreground/50 mt-0.5">
                              {payer?.name || 'Unknown'} paid · {format(parseISO(exp.date), 'MMM d')}
                            </p>
                            {exp.notes && (
                              <p className="text-[11px] text-muted-foreground/40 mt-1 truncate">{exp.notes}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-[17px] font-bold text-foreground">{formatCurrency(Number(exp.amount))}</span>
                            <motion.button
                              whileTap={{ scale: 0.8 }}
                              onClick={() => { deleteExpense(exp.id); toast.success('Deleted'); }}
                              className="w-8 h-8 rounded-lg flex items-center justify-center"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-muted-foreground/40" />
                            </motion.button>
                          </div>
                        </div>
                        {expShares.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-border/20 flex flex-wrap gap-1.5">
                            {expShares.map(s => {
                              const member = members.find(m => m.id === s.member_id);
                              return (
                                <motion.button
                                  key={s.id}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => { settleShare(s.id, !s.is_settled); haptic(10); }}
                                  className={`text-[11px] px-2 py-1 rounded-lg font-medium transition-colors ${
                                    s.is_settled
                                      ? 'bg-emerald-500/15 text-emerald-500 line-through'
                                      : 'bg-muted text-muted-foreground'
                                  }`}
                                >
                                  {member?.name}: {formatCurrency(Number(s.amount))}
                                </motion.button>
                              );
                            })}
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div key="balances" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <BalanceSummary balances={balances} settlements={settlements} />
              {balances.length === 0 && (
                <div className="text-center py-16">
                  <p className="text-sm text-muted-foreground/50">Add expenses to see balances</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* FAB - Disabled when at expense limit for free users */}
        {members.length >= 2 && (
          <>
            {!isPremium && atExpenseLimit ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="fixed bottom-20 right-5 z-40"
              >
                <div className="relative">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      haptic(20);
                      toast('Upgrade to Premium for unlimited expenses', {
                        description: 'Free users can add up to 15 expenses per group',
                        action: {
                          label: 'Upgrade',
                          onClick: () => navigate('/premium'),
                        },
                      });
                    }}
                    className="w-14 h-14 rounded-full bg-muted border border-border flex items-center justify-center relative"
                  >
                    <Lock className="w-5 h-5 text-muted-foreground" />
                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Crown className="w-3 h-3 text-primary-foreground" />
                    </div>
                  </motion.button>
                </div>
              </motion.div>
            ) : (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => { haptic(15); setShowAddExpense(true); }}
                className="fixed bottom-20 right-5 z-40 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center"
              >
                <Plus className="w-6 h-6" />
              </motion.button>
            )}
          </>
        )}

        <AddExpenseSheet
          open={showAddExpense}
          onClose={() => setShowAddExpense(false)}
          members={members}
          onAdd={async (title, amount, paidBy, participants, date, notes) => {
            if (!isPremium && expenses.length >= FREE_EXPENSE_LIMIT) {
              toast.error('Free limit reached. Upgrade to Premium.');
              setShowAddExpense(false);
              return;
            }
            await addExpense(title, amount, paidBy, participants, date, notes);
            setShowAddExpense(false);
            toast.success('Expense added!');
          }}
        />
      </div>
    </PageTransition>
  );
}
