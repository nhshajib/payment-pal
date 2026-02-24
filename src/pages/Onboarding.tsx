import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@/hooks/useUser';
import { useCountryCode } from '@/hooks/useCountryCode';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  CreditCard, Receipt, Wallet, Repeat, ArrowRight, ChevronLeft,
  Sparkles, Hand, Phone, Lock, User, ChevronDown,
} from 'lucide-react';
import PinInput from '@/components/PinInput';
import NumberPad from '@/components/NumberPad';

const floatingIcons = [
  { Icon: CreditCard, x: '10%', y: '15%', delay: 0, rotate: -15, size: 'w-10 h-10' },
  { Icon: Receipt, x: '80%', y: '10%', delay: 0.15, rotate: 12, size: 'w-8 h-8' },
  { Icon: Wallet, x: '18%', y: '35%', delay: 0.3, rotate: -8, size: 'w-7 h-7' },
  { Icon: Repeat, x: '75%', y: '30%', delay: 0.45, rotate: 20, size: 'w-9 h-9' },
  { Icon: Sparkles, x: '50%', y: '8%', delay: 0.6, rotate: 0, size: 'w-6 h-6' },
  { Icon: CreditCard, x: '85%', y: '40%', delay: 0.75, rotate: -25, size: 'w-6 h-6' },
];

type Screen = 'landing' | 'login-phone' | 'login-pin' | 'signup';

export default function Onboarding() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [pinError, setPinError] = useState(false);
  const { register, login } = useUser();
  const { country, allCountries, setCountry } = useCountryCode();
  const navigate = useNavigate();
  const [screen, setScreen] = useState<Screen>('landing');
  const [showWelcomeBack, setShowWelcomeBack] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [activePinField, setActivePinField] = useState<'pin' | 'confirm'>('pin');

  useEffect(() => {
    if (sessionStorage.getItem('paytrack_signed_out')) {
      sessionStorage.removeItem('paytrack_signed_out');
      setShowWelcomeBack(true);
      const timer = setTimeout(() => setShowWelcomeBack(false), 3500);
      return () => clearTimeout(timer);
    }
  }, []);

  const formatPhone = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 15);
    return digits;
  };

  const handleContinueToPin = () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 7) {
      toast.error('Enter a valid phone number');
      return;
    }
    setPin('');
    setPinError(false);
    setScreen('login-pin');
  };

  const handleLoginPinEntry = useCallback(async (fullPin: string) => {
    setLoading(true);
    setPinError(false);
    try {
      const fullPhone = country.dial + phone.replace(/\D/g, '');
      await login(fullPhone, fullPin);
      toast.success('Welcome back!');
      navigate('/schedule');
    } catch (err: any) {
      setPinError(true);
      setTimeout(() => {
        setPinError(false);
        setPin('');
      }, 600);
      if (err?.message?.includes('No account')) {
        toast.error('No account found');
      } else {
        toast.error('Incorrect PIN');
      }
    } finally {
      setLoading(false);
    }
  }, [login, navigate, country.dial, phone]);

  const handleSignup = async () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 7) { toast.error('Enter a valid phone number'); return; }
    if (!name.trim()) { toast.error('Please enter your name'); return; }
    if (pin.length !== 4) { toast.error('Enter a 4-digit PIN'); return; }
    if (pin !== confirmPin) { toast.error('PINs do not match'); return; }

    setLoading(true);
    try {
      const fullPhone = country.dial + digits;
      await register(fullPhone, name.trim(), pin);
      toast.success('Welcome to PayTrack!');
      navigate('/schedule');
    } catch (err: any) {
      toast.error(err?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setPhone('');
    setName('');
    setPin('');
    setConfirmPin('');
    setLoading(false);
    setPinError(false);
    setActivePinField('pin');
  };

  const handleLoginPadPress = (digit: string) => {
    if (pin.length >= 4) return;
    const newPin = pin + digit;
    setPin(newPin);
    if (newPin.length === 4) {
      handleLoginPinEntry(newPin);
    }
  };

  const handleLoginPadDelete = () => {
    setPin(p => p.slice(0, -1));
  };

  const handleSignupPadPress = (digit: string) => {
    if (activePinField === 'pin') {
      if (pin.length >= 4) return;
      const newPin = pin + digit;
      setPin(newPin);
      if (newPin.length === 4) setActivePinField('confirm');
    } else {
      if (confirmPin.length >= 4) return;
      setConfirmPin(prev => prev + digit);
    }
  };

  const handleSignupPadDelete = () => {
    if (activePinField === 'confirm') {
      if (confirmPin.length === 0) {
        setActivePinField('pin');
        return;
      }
      setConfirmPin(p => p.slice(0, -1));
    } else {
      setPin(p => p.slice(0, -1));
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background relative overflow-hidden">
      {/* Background gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, hsl(358, 94%, 47%, 0.12) 0%, transparent 60%), radial-gradient(ellipse at 20% 80%, hsl(280, 70%, 55%, 0.06) 0%, transparent 50%)',
        }}
      />
      <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }} />

      {/* Floating icons (only on landing) */}
      {screen === 'landing' && floatingIcons.map(({ Icon, x, y, delay, rotate, size }, i) => (
        <motion.div key={i} className="absolute text-muted-foreground/10" style={{ left: x, top: y }}
          initial={{ opacity: 0, scale: 0, rotate: 0 }}
          animate={{ opacity: 1, scale: 1, rotate, y: [0, -10, 0] }}
          transition={{ delay: delay + 0.3, duration: 0.6, y: { delay: delay + 1, duration: 4, repeat: Infinity, ease: 'easeInOut' } }}
        >
          <Icon className={size} />
        </motion.div>
      ))}

      <AnimatePresence mode="wait">
        {/* ─── LANDING ─── */}
        {screen === 'landing' && (
          <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }} className="relative z-10 w-full max-w-xs flex flex-col items-center"
          >
            <motion.div initial={{ opacity: 0, scale: 0.7, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.7, type: 'spring', stiffness: 200, damping: 20 }} className="text-center mb-4"
            >
              <motion.div className="absolute left-1/2 -translate-x-1/2 w-40 h-40 rounded-full"
                style={{ background: 'radial-gradient(circle, hsl(358, 94%, 47%, 0.2) 0%, transparent 70%)' }}
                initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1.5, opacity: 1 }} transition={{ delay: 0.3, duration: 1 }}
              />
              <h1 className="text-6xl font-extrabold tracking-tight relative">
                <span className="text-foreground">Pay</span>
                <span className="text-primary">Track</span>
              </h1>
            </motion.div>

            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.5 }}
              className="text-muted-foreground text-sm tracking-wide mb-14 text-center">
              Never miss a payment again
            </motion.p>

            <AnimatePresence>
              {showWelcomeBack && (
                <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }} transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                  className="w-full mb-4 glass rounded-2xl border border-primary/20 p-4 flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
                    <Hand className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-card-foreground">Welcome back!</p>
                    <p className="text-xs text-muted-foreground">Sign in to pick up where you left off</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.4 }}
              className="w-full space-y-3"
            >
              <motion.button whileTap={{ scale: 0.96 }} transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                onClick={() => { resetForm(); setScreen('login-phone'); }}
                className="w-full h-14 text-base font-bold rounded-xl shadow-xl shadow-primary/30 gap-2 bg-primary text-primary-foreground flex items-center justify-center"
              >
                <Phone className="w-5 h-5" />
                Sign In
              </motion.button>

              <div className="flex items-center gap-3 py-1">
                <div className="flex-1 h-px bg-border/50" />
                <span className="text-xs text-muted-foreground/60 uppercase tracking-widest">or</span>
                <div className="flex-1 h-px bg-border/50" />
              </div>

              <motion.button whileTap={{ scale: 0.96 }} transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                onClick={() => { resetForm(); setScreen('signup'); }}
                className="w-full h-14 text-base font-semibold rounded-2xl border border-border/60 bg-card/50 backdrop-blur-sm gap-2 text-foreground flex items-center justify-center"
              >
                <User className="w-5 h-5" />
                Create Account
              </motion.button>
            </motion.div>

            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9, duration: 0.5 }}
              className="text-muted-foreground/40 text-xs mt-8 text-center">
              Secured with a 4-digit PIN
            </motion.p>
          </motion.div>
        )}

        {/* ─── LOGIN STEP 1: PHONE ─── */}
        {screen === 'login-phone' && (
          <motion.div key="login-phone" initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="relative z-10 w-full max-w-xs"
          >
            <motion.button initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
              onClick={() => setScreen('landing')}
              className="flex items-center gap-1 text-muted-foreground mb-8"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm">Back</span>
            </motion.button>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-8">
              <h2 className="text-3xl font-extrabold text-foreground tracking-tight">Welcome back</h2>
              <p className="text-muted-foreground text-sm mt-1">Enter your phone number to continue</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              <div className="rounded-2xl bg-card p-5 border border-border/50 space-y-4">
                <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-[0.8px] block">Phone Number</label>
                <div className="flex gap-2">
                  <motion.button whileTap={{ scale: 0.95 }} type="button"
                    onClick={() => setShowCountryPicker(!showCountryPicker)}
                    className="h-14 px-3 rounded-xl bg-secondary/50 flex items-center gap-1.5 flex-shrink-0 text-foreground"
                  >
                    <span className="text-lg">{country.flag}</span>
                    <span className="text-sm font-medium">{country.dial}</span>
                    <ChevronDown className="w-3 h-3 text-muted-foreground" />
                  </motion.button>
                  <input
                    type="tel"
                    placeholder="Phone number"
                    value={phone}
                    onChange={e => setPhone(formatPhone(e.target.value))}
                    className="flex-1 h-14 rounded-xl bg-secondary/50 border-0 text-lg tracking-wider text-foreground placeholder:text-muted-foreground/40 px-4 outline-none focus:ring-1 focus:ring-primary"
                    maxLength={15}
                    autoFocus
                  />
                </div>

                <AnimatePresence>
                  {showCountryPicker && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }} className="overflow-hidden"
                    >
                      <div className="max-h-40 overflow-y-auto rounded-xl bg-secondary/30 divide-y divide-border/30">
                        {allCountries.map(c => (
                          <button key={c.code} onClick={() => { setCountry(c); setShowCountryPicker(false); }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${c.code === country.code ? 'bg-primary/10' : ''}`}
                          >
                            <span className="text-lg">{c.flag}</span>
                            <span className="text-sm text-foreground font-medium">{c.dial}</span>
                            <span className="text-xs text-muted-foreground">{c.code}</span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.button whileTap={{ scale: 0.96 }} transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                  onClick={handleContinueToPin}
                  className="w-full h-14 text-base font-bold rounded-xl shadow-lg shadow-primary/25 gap-2 bg-primary text-primary-foreground flex items-center justify-center"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* ─── LOGIN STEP 2: PIN (iOS Lock Screen) ─── */}
        {screen === 'login-pin' && (
          <motion.div key="login-pin" initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="relative z-10 w-full max-w-xs flex flex-col items-center"
          >
            <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
              onClick={() => { setPin(''); setScreen('login-phone'); }}
              className="self-start flex items-center gap-1 text-muted-foreground mb-12"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm">Back</span>
            </motion.button>

            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-3">
              <div className="w-16 h-16 rounded-2xl bg-secondary/60 flex items-center justify-center mx-auto mb-5">
                <Lock className="w-7 h-7 text-foreground" />
              </div>
              <h2 className="text-2xl font-bold text-foreground tracking-tight">Enter PIN</h2>
              <p className="text-muted-foreground text-sm mt-1">{country.flag} {country.dial} {phone}</p>
            </motion.div>

            <div className="my-10">
              <PinInput length={4} filled={pin.length} error={pinError} />
            </div>

            <NumberPad onPress={handleLoginPadPress} onDelete={handleLoginPadDelete} disabled={loading} />
          </motion.div>
        )}

        {/* ─── SIGNUP ─── */}
        {screen === 'signup' && (
          <motion.div key="signup" initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="relative z-10 w-full max-w-xs"
          >
            <motion.button initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
              onClick={() => setScreen('landing')}
              className="flex items-center gap-1 text-muted-foreground mb-8"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm">Back</span>
            </motion.button>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6">
              <h2 className="text-3xl font-extrabold text-foreground tracking-tight">Create account</h2>
              <p className="text-muted-foreground text-sm mt-1">Set up your profile to start tracking</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              <div className="rounded-2xl bg-card p-5 border border-border/50 space-y-4">
                {/* Name */}
                <div>
                  <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-[0.8px] mb-2 block">Full Name</label>
                  <input type="text" placeholder="Your name" value={name} onChange={e => setName(e.target.value)}
                    className="w-full h-14 rounded-xl bg-secondary/50 border-0 text-lg text-foreground placeholder:text-muted-foreground/40 px-4 outline-none focus:ring-1 focus:ring-primary"
                    maxLength={50} autoFocus
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-[0.8px] mb-2 block">Phone Number</label>
                  <div className="flex gap-2">
                    <motion.button whileTap={{ scale: 0.95 }} type="button"
                      onClick={() => setShowCountryPicker(!showCountryPicker)}
                      className="h-14 px-3 rounded-xl bg-secondary/50 flex items-center gap-1.5 flex-shrink-0 text-foreground"
                    >
                      <span className="text-lg">{country.flag}</span>
                      <span className="text-sm font-medium">{country.dial}</span>
                      <ChevronDown className="w-3 h-3 text-muted-foreground" />
                    </motion.button>
                    <input type="tel" placeholder="Phone number" value={phone}
                      onChange={e => setPhone(formatPhone(e.target.value))}
                      className="flex-1 h-14 rounded-xl bg-secondary/50 border-0 text-lg tracking-wider text-foreground placeholder:text-muted-foreground/40 px-4 outline-none focus:ring-1 focus:ring-primary"
                      maxLength={15}
                    />
                  </div>
                  <AnimatePresence>
                    {showCountryPicker && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-2"
                      >
                        <div className="max-h-32 overflow-y-auto rounded-xl bg-secondary/30 divide-y divide-border/30">
                          {allCountries.map(c => (
                            <button key={c.code} onClick={() => { setCountry(c); setShowCountryPicker(false); }}
                              className={`w-full flex items-center gap-3 px-3 py-2 text-left ${c.code === country.code ? 'bg-primary/10' : ''}`}
                            >
                              <span>{c.flag}</span>
                              <span className="text-sm text-foreground font-medium">{c.dial}</span>
                              <span className="text-xs text-muted-foreground">{c.code}</span>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* PIN */}
                <div>
                  <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-[0.8px] mb-3 block">
                    {activePinField === 'pin' ? '4-Digit PIN' : 'Confirm PIN'}
                  </label>
                  <div className="flex items-center gap-8 justify-center mb-2">
                    <div className="text-center">
                      <p className={`text-[10px] uppercase tracking-wider mb-2 font-semibold ${activePinField === 'pin' ? 'text-primary' : 'text-muted-foreground/40'}`}>PIN</p>
                      <div className="flex gap-3">
                        {[0, 1, 2, 3].map(i => (
                          <div key={`p-${i}`} className={`w-3.5 h-3.5 rounded-full transition-all ${
                            i < pin.length ? 'bg-foreground' : 'border-2 border-muted-foreground/30'
                          }`} />
                        ))}
                      </div>
                    </div>
                    <div className="text-center">
                      <p className={`text-[10px] uppercase tracking-wider mb-2 font-semibold ${activePinField === 'confirm' ? 'text-primary' : 'text-muted-foreground/40'}`}>Confirm</p>
                      <div className="flex gap-3">
                        {[0, 1, 2, 3].map(i => (
                          <div key={`c-${i}`} className={`w-3.5 h-3.5 rounded-full transition-all ${
                            i < confirmPin.length ? 'bg-foreground' : 'border-2 border-muted-foreground/30'
                          }`} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Compact number pad for signup */}
              <div className="grid grid-cols-3 gap-2.5 max-w-[240px] mx-auto">
                {['1','2','3','4','5','6','7','8','9','','0','del'].map((key, i) => {
                  if (key === '') return <div key={i} />;
                  const isDel = key === 'del';
                  return (
                    <motion.button key={i} type="button" whileTap={{ scale: 0.85 }}
                      onClick={() => isDel ? handleSignupPadDelete() : handleSignupPadPress(key)}
                      className={`w-[60px] h-[60px] rounded-full flex items-center justify-center mx-auto ${isDel ? '' : 'bg-secondary/60'}`}
                    >
                      {isDel ? (
                        <span className="text-sm text-muted-foreground">⌫</span>
                      ) : (
                        <span className="text-[22px] font-light text-foreground">{key}</span>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              <motion.button whileTap={{ scale: 0.96 }} transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                onClick={handleSignup} disabled={loading || pin.length !== 4 || confirmPin.length !== 4}
                className="w-full h-14 text-base font-bold rounded-xl shadow-lg shadow-primary/25 gap-2 bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40"
              >
                {loading ? (
                  <motion.div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
                    animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
                ) : (
                  <>
                    Get Started
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>

              <p className="text-muted-foreground/40 text-xs text-center">
                Your PIN secures your account on this device
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
