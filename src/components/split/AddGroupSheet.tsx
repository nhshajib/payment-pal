import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, UserPlus, Users, Crown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { haptic } from '@/lib/haptics';
import { useRoommates, type Roommate } from '@/hooks/useRoommates';
import { useUser } from '@/hooks/useUser';
import { usePremium } from '@/hooks/usePremium';

const EMOJIS = ['💰', '🏠', '✈️', '🍕', '🎉', '🛒', '⚡', '🎮'];

interface Props {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string, emoji: string, members: string[]) => void;
  groupCount: number;
}

export default function AddGroupSheet({ open, onClose, onCreate, groupCount }: Props) {
  const { userId } = useUser();
  const { isPremium } = usePremium();
  const { roommates, fetchRoommates } = useRoommates(userId);
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('💰');
  const [members, setMembers] = useState<string[]>([]);
  const [memberInput, setMemberInput] = useState('');
  const [showRoommates, setShowRoommates] = useState(false);

  const maxMembers = isPremium ? 999 : 4; // +1 owner = 5 for free, unlimited for premium
  const maxGroups = isPremium ? 999 : 3;
  const atGroupLimit = groupCount >= maxGroups;

  useEffect(() => {
    if (open && userId) fetchRoommates();
  }, [open, userId, fetchRoommates]);

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
    setName('');
    setEmoji('💰');
    setMembers([]);
    setMemberInput('');
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
                <h2 className="text-[17px] font-bold text-foreground tracking-[-0.3px]">New Group</h2>
                <motion.button whileTap={{ scale: 0.85 }} onClick={onClose} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                  <X className="w-4 h-4 text-muted-foreground" />
                </motion.button>
              </div>

              {atGroupLimit ? (
                /* Premium upsell for group limit */
                <div className="px-5 py-10 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-3">
                    <Crown className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">Group Limit Reached</h3>
                  <p className="text-sm text-muted-foreground/60 mt-1.5 max-w-[260px] mx-auto">
                    Free users can have up to {maxGroups} groups. Delete an existing group or upgrade to Premium for unlimited groups.
                  </p>
                  <div className="flex gap-3 mt-6">
                    <Button variant="secondary" onClick={onClose} className="flex-1 rounded-[14px] h-[48px] text-[15px] font-semibold">
                      Got it
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="px-5 py-5 max-h-[65vh] overflow-y-auto space-y-5">
                    {/* Emoji Picker */}
                    <div>
                      <label className="text-[11px] font-semibold uppercase tracking-[0.8px] text-muted-foreground mb-2 block">Icon</label>
                      <div className="flex gap-2 flex-wrap">
                        {EMOJIS.map(e => (
                          <motion.button
                            key={e}
                            whileTap={{ scale: 0.85 }}
                            onClick={() => { setEmoji(e); haptic(10); }}
                            className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl transition-colors ${emoji === e ? 'bg-primary/15 ring-2 ring-primary' : 'mono-card-solid'}`}
                          >
                            {e}
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Group Name */}
                    <div>
                      <label className="text-[11px] font-semibold uppercase tracking-[0.8px] text-muted-foreground mb-2 block">Group Name</label>
                      <Input
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="e.g. Apartment, Trip to Paris"
                        className="h-12 bg-secondary/50 border-0 rounded-xl text-[15px]"
                        maxLength={40}
                      />
                    </div>

                    {/* Members */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-[11px] font-semibold uppercase tracking-[0.8px] text-muted-foreground">
                          Members ({members.length + 1}/{isPremium ? '∞' : '5'})
                        </label>
                        {confirmedRoommates.length > 0 && (
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => { setShowRoommates(!showRoommates); haptic(10); }}
                            className="text-[12px] font-semibold text-primary flex items-center gap-1"
                          >
                            <Users className="w-3.5 h-3.5" />
                            {showRoommates ? 'Hide' : 'Roommates'}
                          </motion.button>
                        )}
                      </div>
                      
                      {/* Owner chip */}
                      <div className="flex items-center gap-2 mb-2 px-3 py-2 rounded-xl bg-primary/10 border border-primary/20">
                        <span className="text-sm font-medium text-foreground">You (Owner)</span>
                      </div>

                      {/* Roommates quick-add */}
                      <AnimatePresence>
                        {showRoommates && confirmedRoommates.length > 0 && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden mb-3"
                          >
                            <p className="text-[11px] text-muted-foreground/50 mb-1.5 ml-0.5">Tap to add from your roommates:</p>
                            <div className="flex gap-2 flex-wrap">
                              {confirmedRoommates.map(r => {
                                const displayName = r.partner_name || r.nickname || 'Roommate';
                                const alreadyAdded = members.includes(displayName);
                                return (
                                  <motion.button
                                    key={r.id}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => addRoommateAsMember(r)}
                                    disabled={alreadyAdded || members.length >= maxMembers}
                                    className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                                      alreadyAdded
                                        ? 'bg-primary/10 text-primary border border-primary/20'
                                        : 'mono-card-solid text-foreground'
                                    } disabled:opacity-40`}
                                  >
                                    {displayName} {alreadyAdded ? '✓' : ''}
                                  </motion.button>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Added members */}
                      <div className="space-y-1.5 mb-3">
                        {members.map((m, i) => (
                          <div key={i} className="flex items-center justify-between px-3 py-2 rounded-xl mono-card-solid">
                            <span className="text-sm font-medium text-foreground">{m}</span>
                            <motion.button whileTap={{ scale: 0.85 }} onClick={() => removeMember(i)}>
                              <X className="w-4 h-4 text-muted-foreground" />
                            </motion.button>
                          </div>
                        ))}
                      </div>

                      {members.length < maxMembers && (
                        <div className="flex gap-2">
                          <Input
                            value={memberInput}
                            onChange={e => setMemberInput(e.target.value)}
                            placeholder="Add new member name"
                            className="h-11 bg-secondary/50 border-0 rounded-xl text-sm flex-1"
                            maxLength={30}
                            onKeyDown={e => e.key === 'Enter' && addMember()}
                          />
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={addMember}
                            className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0"
                          >
                            <UserPlus className="w-4 h-4 text-muted-foreground" />
                          </motion.button>
                        </div>
                      )}

                      {!isPremium && members.length >= maxMembers && (
                        <p className="text-[11px] text-primary mt-2 ml-1 font-medium">
                          Free limit: 5 members per group. Upgrade for unlimited.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 px-5 py-4 border-t border-border/50 pb-safe">
                    <motion.div whileTap={{ scale: 0.96 }} className="flex-1">
                      <Button variant="secondary" onClick={onClose} className="w-full rounded-[14px] h-[52px] text-[17px] font-semibold">
                        Cancel
                      </Button>
                    </motion.div>
                    <motion.div whileTap={{ scale: 0.96 }} className="flex-1">
                      <Button
                        onClick={handleCreate}
                        disabled={!name.trim()}
                        className="w-full rounded-[14px] h-[52px] text-[17px] font-semibold bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                      >
                        Create
                      </Button>
                    </motion.div>
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
