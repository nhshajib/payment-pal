import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, UserPlus, Users, Crown, Sparkles, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { haptic } from '@/lib/haptics';
import { useRoommates, type Roommate } from '@/hooks/useRoommates';
import { useUser } from '@/hooks/useUser';
import { usePremium } from '@/hooks/usePremium';

const EMOJI_CATEGORIES = [
  { emoji: '🏠', label: 'Home' },
  { emoji: '✈️', label: 'Trip' },
  { emoji: '🍕', label: 'Food' },
  { emoji: '🎉', label: 'Party' },
  { emoji: '🛒', label: 'Shopping' },
  { emoji: '💼', label: 'Work' },
  { emoji: '🎮', label: 'Gaming' },
  { emoji: '💰', label: 'General' },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string, emoji: string, members: string[]) => void;
  groupCount: number;
}

export default function AddGroupSheet({ open, onClose, onCreate, groupCount }: Props) {
  const { userId, userName } = useUser();
  const { isPremium } = usePremium();
  const { roommates, fetchRoommates } = useRoommates(userId);
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('💰');
  const [members, setMembers] = useState<string[]>([]);
  const [memberInput, setMemberInput] = useState('');
  const [step, setStep] = useState<'details' | 'members'>('details');

  const maxMembers = isPremium ? 999 : 4;
  const maxGroups = isPremium ? 999 : 3;
  const atGroupLimit = groupCount >= maxGroups;

  useEffect(() => {
    if (open && userId) fetchRoommates();
  }, [open, userId, fetchRoommates]);

  useEffect(() => {
    if (!open) {
      // Reset state when closing
      setTimeout(() => {
        setStep('details');
        setName('');
        setEmoji('💰');
        setMembers([]);
        setMemberInput('');
      }, 300);
    }
  }, [open]);

  const confirmedRoommates = roommates.filter(r => r.status === 'confirmed' || r.nickname);

  const addMember = () => {
    const trimmed = memberInput.trim();
    if (!trimmed || members.length >= maxMembers) return;
    if (members.includes(trimmed)) return;
    setMembers(prev => [...prev, trimmed]);
    setMemberInput('');
    haptic(10);
  };

  const addRoommateAsMember = (r: Roommate) => {
    const displayName = r.partner_name || r.nickname || 'Roommate';
    if (members.includes(displayName) || members.length >= maxMembers) return;
    setMembers(prev => [...prev, displayName]);
    haptic(10);
  };

  const removeMember = (i: number) => {
    setMembers(prev => prev.filter((_, idx) => idx !== i));
    haptic(10);
  };

  const handleCreate = () => {
    if (!name.trim()) return;
    onCreate(name.trim(), emoji, members);
  };

  const canProceed = name.trim().length > 0;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70]"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 32, mass: 0.8 }}
            className="fixed bottom-0 left-0 right-0 z-[70] max-w-md mx-auto"
          >
            <div className="rounded-t-[28px] overflow-hidden shadow-2xl bg-popover border border-border/30">
              {/* Handle bar */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-[5px] rounded-full bg-muted-foreground/20" />
              </div>

              {atGroupLimit ? (
                /* Premium upsell for group limit */
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="px-6 py-12 text-center"
                >
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.1 }}
                    className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center mx-auto mb-5"
                  >
                    <Crown className="w-9 h-9 text-primary" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-foreground tracking-tight">Group Limit Reached</h3>
                  <p className="text-[15px] text-muted-foreground/60 mt-2 max-w-[280px] mx-auto leading-relaxed">
                    Free users can have up to {maxGroups} groups. Delete one or upgrade to Premium.
                  </p>
                  <div className="flex gap-3 mt-8 px-4">
                    <Button variant="secondary" onClick={onClose} className="flex-1 rounded-2xl h-[54px] text-[16px] font-semibold">
                      Maybe Later
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <>
                  {/* Header */}
                  <div className="flex items-center justify-between px-5 py-2">
                    <div className="flex items-center gap-2">
                      {step === 'members' && (
                        <motion.button
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setStep('details')}
                          className="w-8 h-8 rounded-full bg-secondary/50 flex items-center justify-center mr-1"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                            <path d="M15 18l-6-6 6-6" />
                          </svg>
                        </motion.button>
                      )}
                      <div>
                        <h2 className="text-[18px] font-bold text-foreground tracking-tight">
                          {step === 'details' ? 'New Group' : 'Add Members'}
                        </h2>
                        <p className="text-[12px] text-muted-foreground/50 mt-0.5">
                          {step === 'details' ? 'Give it a name and icon' : 'Who\'s splitting with you?'}
                        </p>
                      </div>
                    </div>
                    <motion.button 
                      whileTap={{ scale: 0.85 }} 
                      onClick={onClose} 
                      className="w-8 h-8 rounded-full bg-secondary/80 flex items-center justify-center"
                    >
                      <X className="w-4 h-4 text-muted-foreground" />
                    </motion.button>
                  </div>

                  {/* Step Progress */}
                  <div className="flex gap-2 px-5 py-3">
                    <div className={`flex-1 h-1 rounded-full transition-colors ${step === 'details' || step === 'members' ? 'bg-primary' : 'bg-muted'}`} />
                    <div className={`flex-1 h-1 rounded-full transition-colors ${step === 'members' ? 'bg-primary' : 'bg-muted'}`} />
                  </div>

                  <AnimatePresence mode="wait">
                    {step === 'details' ? (
                      <motion.div
                        key="details"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className="px-5 py-4 space-y-6"
                      >
                        {/* Emoji Picker - Card style */}
                        <div>
                          <label className="text-[12px] font-semibold text-muted-foreground mb-3 block">
                            Choose an icon
                          </label>
                          <div className="grid grid-cols-4 gap-2">
                            {EMOJI_CATEGORIES.map(({ emoji: e, label }) => {
                              const isSelected = emoji === e;
                              return (
                                <motion.button
                                  key={e}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => { setEmoji(e); haptic(10); }}
                                  className={`relative flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl transition-all ${
                                    isSelected 
                                      ? 'bg-primary/10 ring-2 ring-primary shadow-lg shadow-primary/10' 
                                      : 'bg-secondary/40 hover:bg-secondary/60'
                                  }`}
                                >
                                  <span className="text-2xl">{e}</span>
                                  <span className={`text-[10px] font-medium ${isSelected ? 'text-primary' : 'text-muted-foreground/60'}`}>
                                    {label}
                                  </span>
                                  {isSelected && (
                                    <motion.div
                                      layoutId="emoji-check"
                                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center"
                                    >
                                      <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />
                                    </motion.div>
                                  )}
                                </motion.button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Group Name - Premium input */}
                        <div>
                          <label className="text-[12px] font-semibold text-muted-foreground mb-2 block">
                            Group name
                          </label>
                          <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl pointer-events-none">
                              {emoji}
                            </div>
                            <Input
                              value={name}
                              onChange={e => setName(e.target.value)}
                              placeholder="e.g. Weekend Trip, Apartment"
                              className="h-14 pl-14 pr-4 bg-secondary/40 border-0 rounded-2xl text-[16px] font-medium placeholder:text-muted-foreground/30 focus:ring-2 focus:ring-primary/50 focus:bg-secondary/60 transition-all"
                              maxLength={40}
                              autoFocus
                            />
                          </div>
                          <p className="text-[11px] text-muted-foreground/40 mt-2 ml-1">
                            {40 - name.length} characters remaining
                          </p>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="members"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.2 }}
                        className="px-5 py-4 max-h-[50vh] overflow-y-auto"
                      >
                        {/* Owner card */}
                        <div className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 mb-4">
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                            <span className="text-sm font-bold text-primary">
                              {(userName || 'Me').charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1">
                            <p className="text-[15px] font-semibold text-foreground">{userName || 'Me'}</p>
                            <p className="text-[11px] text-primary font-medium">Owner · That's you!</p>
                          </div>
                          <Sparkles className="w-4 h-4 text-primary/60" />
                        </div>

                        {/* Roommates Section */}
                        {confirmedRoommates.length > 0 && (
                          <div className="mb-5">
                            <div className="flex items-center gap-2 mb-3">
                              <Users className="w-4 h-4 text-muted-foreground/50" />
                              <span className="text-[12px] font-semibold text-muted-foreground/70">Your Roommates</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {confirmedRoommates.map(r => {
                                const displayName = r.partner_name || r.nickname || 'Roommate';
                                const alreadyAdded = members.includes(displayName);
                                return (
                                  <motion.button
                                    key={r.id}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => addRoommateAsMember(r)}
                                    disabled={alreadyAdded || members.length >= maxMembers}
                                    className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-[14px] font-medium transition-all ${
                                      alreadyAdded
                                        ? 'bg-primary/15 text-primary border border-primary/30'
                                        : 'bg-secondary/50 text-foreground hover:bg-secondary/70 border border-transparent'
                                    } disabled:opacity-40`}
                                  >
                                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[11px] font-bold text-muted-foreground">
                                      {displayName.charAt(0).toUpperCase()}
                                    </div>
                                    {displayName}
                                    {alreadyAdded && <Check className="w-3.5 h-3.5 ml-0.5" />}
                                  </motion.button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Added Members */}
                        {members.length > 0 && (
                          <div className="mb-5">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-[12px] font-semibold text-muted-foreground/70">
                                Added ({members.length}/{isPremium ? '∞' : '4'})
                              </span>
                            </div>
                            <div className="space-y-2">
                              {members.map((m, i) => (
                                <motion.div
                                  key={i}
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, x: -20 }}
                                  className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40"
                                >
                                  <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                                    <span className="text-sm font-bold text-muted-foreground">
                                      {m.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                  <span className="flex-1 text-[15px] font-medium text-foreground">{m}</span>
                                  <motion.button
                                    whileTap={{ scale: 0.85 }}
                                    onClick={() => removeMember(i)}
                                    className="w-7 h-7 rounded-full bg-destructive/10 flex items-center justify-center"
                                  >
                                    <X className="w-3.5 h-3.5 text-destructive" />
                                  </motion.button>
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Add New Member Input */}
                        {members.length < maxMembers && (
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <UserPlus className="w-4 h-4 text-muted-foreground/50" />
                              <span className="text-[12px] font-semibold text-muted-foreground/70">Add Someone New</span>
                            </div>
                            <div className="flex gap-2">
                              <Input
                                value={memberInput}
                                onChange={e => setMemberInput(e.target.value)}
                                placeholder="Enter their name..."
                                className="h-12 bg-secondary/40 border-0 rounded-xl text-[15px] placeholder:text-muted-foreground/30 flex-1"
                                maxLength={30}
                                onKeyDown={e => e.key === 'Enter' && addMember()}
                              />
                              <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={addMember}
                                disabled={!memberInput.trim()}
                                className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 disabled:opacity-40 disabled:bg-muted"
                              >
                                <Plus className="w-5 h-5" />
                              </motion.button>
                            </div>
                          </div>
                        )}

                        {!isPremium && members.length >= maxMembers && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-4 p-3 rounded-xl bg-primary/10 border border-primary/20 flex items-center gap-3"
                          >
                            <Crown className="w-5 h-5 text-primary flex-shrink-0" />
                            <p className="text-[12px] text-muted-foreground leading-relaxed">
                              <span className="font-semibold text-foreground">Free limit reached.</span> Upgrade to Premium for unlimited members.
                            </p>
                          </motion.div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Actions */}
                  <div className="px-5 py-5 border-t border-border/30 pb-safe">
                    {step === 'details' ? (
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => { if (canProceed) { setStep('members'); haptic(15); } }}
                        disabled={!canProceed}
                        className={`w-full h-[56px] rounded-2xl text-[17px] font-semibold flex items-center justify-center gap-2 transition-all ${
                          canProceed
                            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        Continue
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                      </motion.button>
                    ) : (
                      <div className="flex gap-3">
                        <motion.button
                          whileTap={{ scale: 0.96 }}
                          onClick={() => setStep('details')}
                          className="flex-1 h-[56px] rounded-2xl bg-secondary text-foreground text-[17px] font-semibold"
                        >
                          Back
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.96 }}
                          onClick={handleCreate}
                          className="flex-[2] h-[56px] rounded-2xl bg-primary text-primary-foreground text-[17px] font-semibold shadow-lg shadow-primary/25 flex items-center justify-center gap-2"
                        >
                          <Sparkles className="w-4 h-4" />
                          Create Group
                        </motion.button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
