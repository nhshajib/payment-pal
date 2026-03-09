import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { haptic } from '@/lib/haptics';
import { useCurrency } from '@/hooks/useCurrency';
import type { SplitMember } from '@/hooks/useSplitGroups';

interface Props {
  open: boolean;
  onClose: () => void;
  members: SplitMember[];
  onAdd: (title: string, amount: number, paidBy: string, participants: string[], date: string, notes: string) => void;
}

export default function AddExpenseSheet({ open, onClose, members, onAdd }: Props) {
  const { format: formatCurrency } = useCurrency();
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [participants, setParticipants] = useState<string[]>([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');

  // Reset state when sheet opens or members change
  useEffect(() => {
    if (open && members.length > 0) {
      setPaidBy(members[0].id);
      setParticipants(members.map(m => m.id));
      setTitle('');
      setAmount('');
      setDate(new Date().toISOString().slice(0, 10));
      setNotes('');
    }
  }, [open, members]);

  const toggleParticipant = (id: string) => {
    setParticipants(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
    haptic(10);
  };

  const handleAdd = () => {
    const amt = parseFloat(amount);
    if (!title.trim() || isNaN(amt) || amt <= 0 || !paidBy || participants.length === 0) return;
    onAdd(title.trim(), amt, paidBy, participants, date, notes);
    setTitle('');
    setAmount('');
    setNotes('');
    setParticipants(members.map(m => m.id));
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-[70]"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 32, mass: 0.8 }}
            className="fixed bottom-0 left-0 right-0 z-[70] max-w-md mx-auto"
          >
            <div className="rounded-t-[22px] overflow-hidden shadow-2xl bg-popover border border-border/50 border-b-0">
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-9 h-[4px] rounded-full bg-muted-foreground/30" />
              </div>

              <div className="flex items-center justify-between px-5 py-3 border-b border-border/50">
                <h2 className="text-[17px] font-bold text-foreground tracking-[-0.3px]">Add Expense</h2>
                <motion.button whileTap={{ scale: 0.85 }} onClick={onClose} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                  <X className="w-4 h-4 text-muted-foreground" />
                </motion.button>
              </div>

              <div className="px-5 py-5 max-h-[65vh] overflow-y-auto space-y-5">
                {/* Title */}
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-[0.8px] text-muted-foreground mb-2 block">Description</label>
                  <Input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. Dinner, Groceries"
                    className="h-12 bg-secondary/50 border-0 rounded-xl text-[15px]"
                    maxLength={50}
                  />
                </div>

                {/* Amount */}
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-[0.8px] text-muted-foreground mb-2 block">Amount</label>
                  <Input
                    value={amount}
                    onChange={e => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                    placeholder="0.00"
                    inputMode="decimal"
                    className="h-12 bg-secondary/50 border-0 rounded-xl text-[15px]"
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-[0.8px] text-muted-foreground mb-2 block">Date</label>
                  <Input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="h-12 bg-secondary/50 border-0 rounded-xl text-[15px]"
                  />
                </div>

                {/* Paid By */}
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-[0.8px] text-muted-foreground mb-2 block">Paid By</label>
                  <div className="flex gap-2 flex-wrap">
                    {members.map(m => (
                      <motion.button
                        key={m.id}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => { setPaidBy(m.id); haptic(10); }}
                        className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                          paidBy === m.id
                            ? 'bg-primary text-primary-foreground'
                            : 'mono-card-solid text-foreground'
                        }`}
                      >
                        {m.name}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Split Among */}
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-[0.8px] text-muted-foreground mb-2 block">Split Among</label>
                  <div className="space-y-1.5">
                    {members.map(m => {
                      const isSelected = participants.includes(m.id);
                      return (
                        <motion.button
                          key={m.id}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => toggleParticipant(m.id)}
                          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors ${
                            isSelected ? 'bg-primary/10 border border-primary/20' : 'mono-card-solid'
                          }`}
                        >
                          <span className="text-sm font-medium text-foreground">{m.name}</span>
                          {isSelected && <Check className="w-4 h-4 text-primary" />}
                        </motion.button>
                      );
                    })}
                  </div>
                  {participants.length > 0 && amount && (
                    <p className="text-[12px] text-muted-foreground/50 mt-2 ml-1">
                      Each pays: {formatCurrency(parseFloat(amount || '0') / participants.length)}
                    </p>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-[0.8px] text-muted-foreground mb-2 block">Notes (optional)</label>
                  <Input
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Add a note..."
                    className="h-12 bg-secondary/50 border-0 rounded-xl text-[15px]"
                    maxLength={100}
                  />
                </div>
              </div>

              <div className="flex gap-3 px-5 py-4 border-t border-border/50 pb-safe">
                <motion.div whileTap={{ scale: 0.96 }} className="flex-1">
                  <Button variant="secondary" onClick={onClose} className="w-full rounded-[14px] h-[52px] text-[17px] font-semibold">
                    Cancel
                  </Button>
                </motion.div>
                <motion.div whileTap={{ scale: 0.96 }} className="flex-1">
                  <Button
                    onClick={handleAdd}
                    disabled={!title.trim() || !amount || participants.length === 0}
                    className="w-full rounded-[14px] h-[52px] text-[17px] font-semibold bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                  >
                    Add
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
