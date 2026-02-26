import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@/hooks/useUser';
import { useCountryCode } from '@/hooks/useCountryCode';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ArrowRight, ChevronLeft, Hand, Phone, Lock, User, ChevronDown, Shield,
} from 'lucide-react';
import PinInput from '@/components/PinInput';
import NumberPad from '@/components/NumberPad';

type Screen = 'landing' | 'login-phone' | 'login-pin' | 'signup-info' | 'signup-pin' | 'signup-confirm';

const slideIn = { initial: { opacity: 0, x: 60 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -60 } };
const spring = { type: 'spring' as const, stiffness: 300, damping: 30 };

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

  useEffect(() => {
    if (sessionStorage.getItem('paytrack_signed_out')) {
      sessionStorage.removeItem('paytrack_signed_out');
      setShowWelcomeBack(true);
      const timer = setTimeout(() => setShowWelcomeBack(false), 3500);
      return () => clearTimeout(timer);
    }
  }, []);

  const formatPhone = (val: string) => val.replace(/\D/g, '').slice(0, 15);

  const resetForm = () => {
    setPhone(''); setName(''); setPin(''); setConfirmPin('');
    setLoading(false); setPinError(false);
  };

  // ── Login handlers ──
  const handleContinueToPin = () => {
    if (phone.replace(/\D/g, '').length < 7) { toast.error('Enter a valid phone number'); return; }
    setPin(''); setPinError(false); setScreen('login-pin');
  };

  const handleLoginPinEntry = useCallback(async (fullPin: string) => {
    setLoading(true); setPinError(false);
    try {
      await login(country.dial + phone.replace(/\D/g, ''), fullPin);
      toast.success('Welcome back!');
      navigate('/schedule');
    } catch (err: any) {
      setPinError(true);
      setTimeout(() => { setPinError(false); setPin(''); }, 600);
      toast.error(err?.message?.includes('No account') ? 'No account found' : 'Incorrect PIN');
    } finally { setLoading(false); }
  }, [login, navigate, country.dial, phone]);

  const handleLoginPadPress = (digit: string) => {
    if (pin.length >= 4) return;
    const newPin = pin + digit;
    setPin(newPin);
    if (newPin.length === 4) handleLoginPinEntry(newPin);
  };

  // ── Signup handlers ──
  const handleSignupInfoContinue = () => {
    if (phone.replace(/\D/g, '').length < 7) { toast.error('Enter a valid phone number'); return; }
    if (!name.trim()) { toast.error('Please enter your name'); return; }
    setPin(''); setScreen('signup-pin');
  };

  const handleSignupPinPress = (digit: string) => {
    if (pin.length >= 4) return;
    const newPin = pin + digit;
    setPin(newPin);
    if (newPin.length === 4) {
      setTimeout(() => setScreen('signup-confirm'), 300);
    }
  };

  const handleConfirmPinPress = useCallback(async (digit: string) => {
    if (confirmPin.length >= 4) return;
    const newConfirm = confirmPin + digit;
    setConfirmPin(newConfirm);
    if (newConfirm.length === 4) {
      if (newConfirm !== pin) {
        setPinError(true);
        setTimeout(() => { setPinError(false); setConfirmPin(''); }, 600);
        toast.error('PINs do not match');
        return;
      }
      setLoading(true);
      try {
        await register(country.dial + phone.replace(/\D/g, ''), name.trim(), pin);
        toast.success('Welcome to PayTrack!');
        navigate('/schedule');
      } catch (err: any) {
        toast.error(err?.message || 'Something went wrong');
        setPinError(true);
        setTimeout(() => { setPinError(false); setConfirmPin(''); }, 600);
      } finally { setLoading(false); }
    }
  }, [confirmPin, pin, register, country.dial, phone, name, navigate]);

  // ── Shared components ──
  const BackButton = ({ onBack }: { onBack: () => void }) => (
    <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
      onClick={onBack} className="self-start flex items-center gap-1 text-white/50 mb-8"
    >
      <ChevronLeft className="w-5 h-5" />
      <span className="text-sm">Back</span>
    </motion.button>
  );

  const CountryPicker = () => (
    <>
      <motion.button whileTap={{ scale: 0.95 }} type="button"
        onClick={() => setShowCountryPicker(!showCountryPicker)}
        className="h-[52px] px-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center gap-1.5 flex-shrink-0 text-white active:bg-white/[0.08] transition-colors"
      >
        <span className="text-lg">{country.flag}</span>
        <span className="text-sm font-medium text-white/80">{country.dial}</span>
        <ChevronDown className="w-3 h-3 text-white/30" />
      </motion.button>
      <AnimatePresence>
        {showCountryPicker && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }} className="overflow-hidden col-span-2"
          >
            <div className="max-h-36 overflow-y-auto rounded-xl bg-white/[0.04] border border-white/[0.08] divide-y divide-white/[0.04] mt-2">
              {allCountries.map(c => (
                <button key={c.code} onClick={() => { setCountry(c); setShowCountryPicker(false); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-left transition-colors active:bg-white/[0.08] ${c.code === country.code ? 'bg-white/[0.06]' : ''}`}
                >
                  <span className="text-lg">{c.flag}</span>
                  <span className="text-sm text-white/80 font-medium">{c.dial}</span>
                  <span className="text-xs text-white/30">{c.code}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );

  const PhoneInput = () => (
    <div className="space-y-2">
      <label className="text-[11px] text-white/30 font-semibold uppercase tracking-[0.1em] block">Phone Number</label>
      <div className="flex gap-2">
        <CountryPicker />
        <input type="tel" placeholder="Phone number" value={phone}
          onChange={e => setPhone(formatPhone(e.target.value))}
          className="flex-1 h-[52px] rounded-xl bg-white/[0.04] border border-white/[0.08] text-[17px] tracking-wider text-white placeholder:text-white/20 px-4 outline-none focus:border-white/20 transition-colors"
          maxLength={15}
        />
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center overflow-y-auto">
      <div className="w-full max-w-[340px] px-6 py-12 flex-shrink-0">
        <AnimatePresence mode="wait">

          {/* ─── LANDING ─── */}
          {screen === 'landing' && (
            <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }} className="flex flex-col items-center"
            >
              <motion.div initial={{ opacity: 0, scale: 0.7, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.7, type: 'spring', stiffness: 200, damping: 20 }} className="text-center mb-3"
              >
                <h1 className="text-[52px] font-extrabold tracking-tight">
                  <span className="text-white">Pay</span>
                  <span className="text-white/40">Track</span>
                </h1>
              </motion.div>

              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4, duration: 0.5 }}
                className="text-white/30 text-[13px] tracking-wide mb-16 text-center">
                Never miss a payment again
              </motion.p>

              <AnimatePresence>
                {showWelcomeBack && (
                  <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }} transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                    className="w-full mb-5 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 flex items-center gap-3"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center flex-shrink-0">
                      <Hand className="w-5 h-5 text-white/60" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Welcome back!</p>
                      <p className="text-xs text-white/30">Sign in to pick up where you left off</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.4 }}
                className="w-full space-y-3"
              >
                <motion.button whileTap={{ scale: 0.97 }}
                  onClick={() => { resetForm(); setScreen('login-phone'); }}
                  className="w-full h-[52px] text-[15px] font-semibold rounded-[14px] gap-2 bg-white text-black flex items-center justify-center active:bg-white/90 transition-colors"
                >
                  <Phone className="w-[18px] h-[18px]" />
                  Sign In
                </motion.button>

                <div className="flex items-center gap-3 py-1.5">
                  <div className="flex-1 h-px bg-white/[0.06]" />
                  <span className="text-[10px] text-white/20 uppercase tracking-[0.2em]">or</span>
                  <div className="flex-1 h-px bg-white/[0.06]" />
                </div>

                <motion.button whileTap={{ scale: 0.97 }}
                  onClick={() => { resetForm(); setScreen('signup-info'); }}
                  className="w-full h-[52px] text-[15px] font-semibold rounded-[14px] border border-white/[0.1] bg-white/[0.04] gap-2 text-white flex items-center justify-center active:bg-white/[0.08] transition-colors"
                >
                  <User className="w-[18px] h-[18px]" />
                  Create Account
                </motion.button>
              </motion.div>

              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8, duration: 0.5 }}
                className="text-white/15 text-[11px] mt-10 text-center flex items-center gap-1.5">
                <Shield className="w-3 h-3" />
                Secured with a 4-digit PIN
              </motion.p>
            </motion.div>
          )}

          {/* ─── LOGIN: PHONE ─── */}
          {screen === 'login-phone' && (
            <motion.div key="login-phone" {...slideIn} transition={spring}>
              <BackButton onBack={() => setScreen('landing')} />

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-8">
                <h2 className="text-[28px] font-bold text-white tracking-tight">Welcome back</h2>
                <p className="text-white/30 text-[14px] mt-1">Enter your phone number to continue</p>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-5">
                <PhoneInput />

                <motion.button whileTap={{ scale: 0.97 }}
                  onClick={handleContinueToPin}
                  className="w-full h-[52px] text-[15px] font-semibold rounded-[14px] gap-2 bg-white text-black flex items-center justify-center active:bg-white/90 transition-colors"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </motion.div>
            </motion.div>
          )}

          {/* ─── LOGIN: PIN ─── */}
          {screen === 'login-pin' && (
            <motion.div key="login-pin" {...slideIn} transition={spring} className="flex flex-col items-center">
              <BackButton onBack={() => { setPin(''); setScreen('login-phone'); }} />

              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-3">
                <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mx-auto mb-5">
                  <Lock className="w-7 h-7 text-white/80" />
                </div>
                <h2 className="text-[22px] font-bold text-white tracking-tight">Enter PIN</h2>
                <p className="text-white/30 text-[13px] mt-1">{country.flag} {country.dial} {phone}</p>
              </motion.div>

              <div className="my-8">
                <PinInput length={4} filled={pin.length} error={pinError} />
              </div>

              <NumberPad onPress={handleLoginPadPress} onDelete={() => setPin(p => p.slice(0, -1))} disabled={loading} />
            </motion.div>
          )}

          {/* ─── SIGNUP STEP 1: INFO ─── */}
          {screen === 'signup-info' && (
            <motion.div key="signup-info" {...slideIn} transition={spring}>
              <BackButton onBack={() => setScreen('landing')} />

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-8">
                <h2 className="text-[28px] font-bold text-white tracking-tight">Create account</h2>
                <p className="text-white/30 text-[14px] mt-1">Set up your profile to get started</p>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[11px] text-white/30 font-semibold uppercase tracking-[0.1em] block">Full Name</label>
                  <input type="text" placeholder="Your name" value={name} onChange={e => setName(e.target.value)}
                    className="w-full h-[52px] rounded-xl bg-white/[0.04] border border-white/[0.08] text-[17px] text-white placeholder:text-white/20 px-4 outline-none focus:border-white/20 transition-colors"
                    maxLength={50} autoFocus
                  />
                </div>

                <PhoneInput />

                <motion.button whileTap={{ scale: 0.97 }}
                  onClick={handleSignupInfoContinue}
                  className="w-full h-[52px] text-[15px] font-semibold rounded-[14px] gap-2 bg-white text-black flex items-center justify-center active:bg-white/90 transition-colors"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </motion.button>

                <p className="text-white/15 text-[11px] text-center pt-1">
                  You'll create a 4-digit PIN next
                </p>
              </motion.div>
            </motion.div>
          )}

          {/* ─── SIGNUP STEP 2: CREATE PIN ─── */}
          {screen === 'signup-pin' && (
            <motion.div key="signup-pin" {...slideIn} transition={spring} className="flex flex-col items-center">
              <BackButton onBack={() => { setPin(''); setScreen('signup-info'); }} />

              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-3">
                <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mx-auto mb-5">
                  <Lock className="w-7 h-7 text-white/80" />
                </div>
                <h2 className="text-[22px] font-bold text-white tracking-tight">Create PIN</h2>
                <p className="text-white/30 text-[13px] mt-1">Choose a 4-digit PIN to secure your account</p>
              </motion.div>

              <div className="my-8">
                <PinInput length={4} filled={pin.length} error={false} />
              </div>

              <NumberPad onPress={handleSignupPinPress} onDelete={() => setPin(p => p.slice(0, -1))} disabled={false} />
            </motion.div>
          )}

          {/* ─── SIGNUP STEP 3: CONFIRM PIN ─── */}
          {screen === 'signup-confirm' && (
            <motion.div key="signup-confirm" {...slideIn} transition={spring} className="flex flex-col items-center">
              <BackButton onBack={() => { setConfirmPin(''); setScreen('signup-pin'); }} />

              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-3">
                <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mx-auto mb-5">
                  <Shield className="w-7 h-7 text-white/80" />
                </div>
                <h2 className="text-[22px] font-bold text-white tracking-tight">Confirm PIN</h2>
                <p className="text-white/30 text-[13px] mt-1">Re-enter your PIN to confirm</p>
              </motion.div>

              <div className="my-8">
                <PinInput length={4} filled={confirmPin.length} error={pinError} />
              </div>

              <NumberPad onPress={(d) => handleConfirmPinPress(d)} onDelete={() => setConfirmPin(p => p.slice(0, -1))} disabled={loading} />

              {loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6">
                  <motion.div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full"
                    animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
                </motion.div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
