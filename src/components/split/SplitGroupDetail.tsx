import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Plus, UserPlus, Trash2, Receipt, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useSplitGroupDetail, type SplitGroup } from '@/hooks/useSplitGroups';
import { useCurrency } from '@/hooks/useCurrency';
import { Input } from '@/components/ui/input';
import AddExpenseSheet from '@/components/split/AddExpenseSheet';
import BalanceSummary from '@/components/split/BalanceSummary';
import PageTransition from '@/components/PageTransition';
import { haptic } from '@/lib/haptics';
import { toast } from 'sonner';

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
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [activeTab, setActiveTab] = useState<'expenses' | 'balances'>('expenses');

  const handleAddMember = async () => {
    if (!newMemberName.trim()) return;
    if (members.length >= 5) {
      toast.error('Maximum 5 members per group');
      return;
    }
    await addMember(newMemberName.trim());
    setNewMemberName('');
    setShowAddMember(false);
    toast.success('Member added');
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
            <p className="text-[11px] font-semibold uppercase tracking-[0.8px] text-muted-foreground/60 mb-1">Bills</p>
            <p className="text-xl font-extrabold text-foreground tracking-tight">{expenses.length}</p>
          </div>
        </div>

        {/* Members */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2 ml-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.8px] text-muted-foreground">Members</p>
            {members.length < 5 && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => { setShowAddMember(!showAddMember); haptic(10); }}
                className="text-[12px] font-semibold text-primary flex items-center gap-1"
              >
                <UserPlus className="w-3.5 h-3.5" /> Add
              </motion.button>
            )}
          </div>

          <AnimatePresence>
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
              {expenses.length === 0 ? (
                <div className="text-center py-16">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mono-card mb-3">
                    <Receipt className="w-6 h-6 text-muted-foreground/30" />
                  </div>
                  <p className="text-sm text-muted-foreground/50">No expenses yet</p>
                  <p className="text-xs text-muted-foreground/30 mt-1">Add your first bill</p>
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

        {/* FAB */}
        {members.length >= 2 && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => { haptic(15); setShowAddExpense(true); }}
            className="fixed bottom-20 right-5 z-40 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center"
          >
            <Plus className="w-6 h-6" />
          </motion.button>
        )}

        <AddExpenseSheet
          open={showAddExpense}
          onClose={() => setShowAddExpense(false)}
          members={members}
          onAdd={async (title, amount, paidBy, participants, date, notes) => {
            await addExpense(title, amount, paidBy, participants, date, notes);
            setShowAddExpense(false);
            toast.success('Expense added!');
          }}
        />
      </div>
    </PageTransition>
  );
}
