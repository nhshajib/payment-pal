import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, RefreshCw, User, UserPlus, Send, ChevronDown, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { haptic } from '@/lib/haptics';
import { hashPhone } from '@/lib/hash';
import { supabase } from '@/integrations/supabase/client';
import { useCountryCode } from '@/hooks/useCountryCode';
import { useUser } from '@/hooks/useUser';
import { useRoommates } from '@/hooks/useRoommates';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onClose: () => void;
  onAddMember: (name: string) => Promise<void>;
  existingMemberNames: string[];
  groupName: string;
}

export default function AddMemberSheet({ open, onClose, onAddMember, existingMemberNames, groupName }: Props) {
  const { userId, userName } = useUser();
  const { country, allCountries, setCountry } = useCountryCode();
  const { roommates } = useRoommates(userId);
  const [phone, setPhone] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<{ found: boolean; name?: string; phoneHash?: string } | null>(null);
  const [nickname, setNickname] = useState('');
  const [manualName, setManualName] = useState('');
  const [mode, setMode] = useState<'search' | 'manual'>('search');
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');

  const confirmedRoommates = roommates.filter(r => (r.status === 'confirmed' || r.nickname) && !existingMemberNames.includes(r.partner_name || r.nickname || ''));

  const reset = () => {
    setPhone('');
    setSearchResult(null);
    setNickname('');
    setManualName('');
    setMode('search');
    setShowCountryPicker(false);
    setCountrySearch('');
  };

  const handleClose = () => {
    onClose();
    setTimeout(reset, 300);
  };

  const handleSearch = async () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 7) { toast.error('Enter a valid phone number'); return; }
    setSearching(true);
    try {
      const fullPhone = country.dial + digits;
      const fullHash = await hashPhone(fullPhone);
      const rawHash = await hashPhone(digits);

      const { data } = await supabase.from('users').select('id, name, phone_hash').eq('phone_hash', fullHash).maybeSingle();
      if (data) {
        setSearchResult({ found: true, name: (data as any).name || 'User', phoneHash: fullHash });
      } else {
        const { data: data2 } = await supabase.from('users').select('id, name, phone_hash').eq('phone_hash', rawHash).maybeSingle();
        if (data2) {
          setSearchResult({ found: true, name: (data2 as any).name || 'User', phoneHash: rawHash });
        } else {
          setSearchResult({ found: false, phoneHash: fullHash });
        }
      }
    } catch { toast.error('Search failed'); }
    finally { setSearching(false); }
  };

  const handleAddFound = async () => {
    if (!searchResult?.name) return;
    if (existingMemberNames.includes(searchResult.name)) {
      toast('Already in group');
      return;
    }
    await onAddMember(searchResult.name);
    toast.success(`${searchResult.name} added!`);
    haptic(10);
    handleClose();
  };

  const handleInviteAndAdd = async () => {
    const name = nickname.trim() || 'Friend';
    if (existingMemberNames.includes(name)) {
      toast('Already in group');
      return;
    }
    await onAddMember(name);

    // Send invite via native share
    const msg = `Hey${nickname ? ' ' + nickname : ''}! ${userName || 'Someone'} added you to "${groupName}" on PayTrack for splitting bills. Download the app to join: https://trakpay.lovable.app`;
    if (navigator.share) {
      try { await navigator.share({ title: 'Join my group on PayTrack', text: msg }); }
      catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(msg);
      toast.success('Invite link copied!');
    }

    toast.success(`${name} added & invite sent!`);
    haptic(10);
    handleClose();
  };

  const handleManualAdd = async () => {
    const name = manualName.trim();
    if (!name) return;
    if (existingMemberNames.includes(name)) {
      toast('Already in group');
      return;
    }
    await onAddMember(name);
    toast.success(`${name} added!`);
    haptic(10);
    handleClose();
  };

  const handleAddRoommate = async (displayName: string) => {
    if (existingMemberNames.includes(displayName)) {
      toast('Already in group');
      return;
    }
    await onAddMember(displayName);
    toast.success(`${displayName} added!`);
    haptic(10);
  };

  const filteredCountries = allCountries.filter(c =>
    !countrySearch || c.name.toLowerCase().includes(countrySearch.toLowerCase()) || c.dial.includes(countrySearch)
  );

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70]"
            onClick={handleClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 32, mass: 0.8 }}
            className="fixed bottom-0 left-0 right-0 z-[70] max-w-md mx-auto"
          >
            <div className="rounded-t-[28px] overflow-hidden shadow-2xl bg-popover border border-border/30">
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-[5px] rounded-full bg-muted-foreground/20" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-2">
                <div>
                  <h2 className="text-[18px] font-bold text-foreground tracking-tight">Add Member</h2>
                  <p className="text-[12px] text-muted-foreground/50 mt-0.5">Search by phone or add manually</p>
                </div>
                <motion.button whileTap={{ scale: 0.85 }} onClick={handleClose}
                  className="w-8 h-8 rounded-full bg-secondary/80 flex items-center justify-center">
                  <X className="w-4 h-4 text-muted-foreground" />
                </motion.button>
              </div>

              {/* Country picker overlay */}
              <AnimatePresence>
                {showCountryPicker && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="absolute inset-x-0 top-16 bottom-0 z-10 bg-popover px-5 py-3 overflow-y-auto"
                  >
                    <Input
                      placeholder="Search countries..."
                      value={countrySearch}
                      onChange={e => setCountrySearch(e.target.value)}
                      className="h-11 bg-secondary/50 border-0 rounded-xl text-sm mb-3"
                      autoFocus
                    />
                    <div className="space-y-1 max-h-[40vh] overflow-y-auto">
                      {filteredCountries.map(c => (
                        <motion.button
                          key={c.code}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => { setCountry(c); setShowCountryPicker(false); setCountrySearch(''); }}
                          className={`w-full text-left px-3 py-2.5 rounded-xl text-sm flex items-center gap-3 transition-all ${
                            country.code === c.code ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-secondary/50'
                          }`}
                        >
                          <span className="text-lg">{c.flag}</span>
                          <span className="flex-1 font-medium">{c.name}</span>
                          <span className="text-muted-foreground text-xs">{c.dial}</span>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="px-5 py-4 space-y-4 max-h-[65vh] overflow-y-auto">
                {/* Mode Toggle */}
                <div className="flex p-1 rounded-[10px] bg-muted">
                  {(['search', 'manual'] as const).map(m => (
                    <motion.button
                      key={m}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => { setMode(m); setSearchResult(null); }}
                      className={`relative flex-1 py-[7px] rounded-[8px] text-[13px] font-semibold z-10 transition-colors ${
                        mode === m ? 'text-foreground' : 'text-muted-foreground'
                      }`}
                    >
                      {mode === m && (
                        <motion.div
                          layoutId="add-member-tab"
                          className="absolute inset-0 rounded-[8px] bg-card shadow-sm"
                          transition={{ type: 'spring', stiffness: 300, damping: 22, mass: 0.8 }}
                        />
                      )}
                      <span className="relative z-10">
                        {m === 'search' ? '📱 Phone Search' : '✏️ Manual'}
                      </span>
                    </motion.button>
                  ))}
                </div>

                {/* Roommates quick-add */}
                {confirmedRoommates.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-3.5 h-3.5 text-muted-foreground/50" />
                      <span className="text-[11px] font-semibold uppercase tracking-[0.8px] text-muted-foreground/60">Your Roommates</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {confirmedRoommates.map(r => {
                        const displayName = r.partner_name || r.nickname || 'Roommate';
                        return (
                          <motion.button
                            key={r.id}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleAddRoommate(displayName)}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] font-medium bg-secondary/50 text-foreground hover:bg-secondary/70 border border-transparent"
                          >
                            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                              {displayName.charAt(0).toUpperCase()}
                            </div>
                            {displayName}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <AnimatePresence mode="wait">
                  {mode === 'search' ? (
                    <motion.div
                      key="search"
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -15 }}
                      className="space-y-3"
                    >
                      <p className="text-[13px] text-muted-foreground leading-relaxed">
                        Search by phone number to find someone on PayTrack, or invite them to join.
                      </p>

                      {/* Phone input */}
                      <div className="flex gap-2">
                        <motion.button whileTap={{ scale: 0.95 }} type="button"
                          onClick={() => setShowCountryPicker(true)}
                          className="h-12 px-3 rounded-xl bg-secondary/50 flex items-center gap-1.5 flex-shrink-0 text-foreground"
                        >
                          <span className="text-base">{country.flag}</span>
                          <span className="text-xs font-medium text-muted-foreground">{country.dial}</span>
                          <ChevronDown className="w-3 h-3 text-muted-foreground/50" />
                        </motion.button>
                        <Input
                          type="tel"
                          placeholder="Phone number"
                          value={phone}
                          onChange={e => { setPhone(e.target.value); setSearchResult(null); }}
                          className="h-12 bg-secondary/50 border-0 rounded-xl text-sm flex-1"
                        />
                      </div>

                      {/* Search button */}
                      <motion.div whileTap={{ scale: 0.97 }}>
                        <Button
                          onClick={handleSearch}
                          disabled={searching || phone.replace(/\D/g, '').length < 7}
                          className="w-full rounded-xl h-12 text-[15px] font-semibold"
                        >
                          {searching ? (
                            <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Searching...</>
                          ) : (
                            <><Search className="w-4 h-4 mr-2" />Find User</>
                          )}
                        </Button>
                      </motion.div>

                      {/* Search result */}
                      <AnimatePresence>
                        {searchResult && (
                          <motion.div
                            initial={{ opacity: 0, y: -8, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                            className="rounded-2xl overflow-hidden border border-border/50"
                          >
                            {searchResult.found ? (
                              <div className="p-4 space-y-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-11 h-11 rounded-full bg-primary/15 flex items-center justify-center">
                                    <User className="w-5 h-5 text-primary" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-[15px] font-semibold text-foreground">{searchResult.name}</p>
                                    <p className="text-xs text-primary font-medium">Found on PayTrack ✓</p>
                                  </div>
                                </div>
                                <motion.div whileTap={{ scale: 0.97 }}>
                                  <Button className="w-full rounded-xl h-11 text-sm font-semibold" onClick={handleAddFound}>
                                    <UserPlus className="w-4 h-4 mr-2" /> Add {searchResult.name} to Group
                                  </Button>
                                </motion.div>
                              </div>
                            ) : (
                              <div className="p-4 space-y-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-11 h-11 rounded-full bg-muted flex items-center justify-center">
                                    <User className="w-5 h-5 text-muted-foreground" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-[15px] font-semibold text-foreground">Not on PayTrack yet</p>
                                    <p className="text-xs text-muted-foreground">Add a nickname and send an invite</p>
                                  </div>
                                </div>
                                <Input
                                  type="text"
                                  placeholder="Nickname (e.g. Alex)"
                                  value={nickname}
                                  onChange={e => setNickname(e.target.value)}
                                  className="h-11 bg-secondary/50 border-0 rounded-xl text-sm"
                                  maxLength={30}
                                />
                                <motion.div whileTap={{ scale: 0.97 }}>
                                  <Button className="w-full rounded-xl h-11 text-sm font-semibold" onClick={handleInviteAndAdd}>
                                    <Send className="w-4 h-4 mr-2" /> Invite & Add to Group
                                  </Button>
                                </motion.div>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="manual"
                      initial={{ opacity: 0, x: 15 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 15 }}
                      className="space-y-3"
                    >
                      <p className="text-[13px] text-muted-foreground leading-relaxed">
                        Add someone by name. They won't receive a notification.
                      </p>
                      <div className="flex gap-2">
                        <Input
                          value={manualName}
                          onChange={e => setManualName(e.target.value)}
                          placeholder="Enter their name..."
                          className="h-12 bg-secondary/50 border-0 rounded-xl text-sm flex-1"
                          maxLength={30}
                          onKeyDown={e => e.key === 'Enter' && handleManualAdd()}
                        />
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={handleManualAdd}
                          disabled={!manualName.trim()}
                          className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 disabled:opacity-50"
                        >
                          <UserPlus className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Bottom safe area */}
              <div className="h-8" />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
