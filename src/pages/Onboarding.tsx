import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@/hooks/useUser';
import { useCountryCode } from '@/hooks/useCountryCode';
import type { CountryInfo } from '@/hooks/useCountryCode';
import { useBiometric } from '@/hooks/useBiometric';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { haptic, hapticError, hapticSuccess } from '@/lib/haptics';
import {
  ArrowRight, ChevronLeft, Hand, Phone, Lock, User, ChevronDown, Shield, Fingerprint, KeyRound, Search,
} from 'lucide-react';
import PinInput from '@/components/PinInput';
import NumberPad from '@/components/NumberPad';

type Screen =
  | 'landing' | 'login-phone' | 'login-pin'
  | 'signup-info' | 'signup-pin' | 'signup-confirm'
  | 'forgot-pin' | 'forgot-new-pin' | 'forgot-confirm-pin';

const slideIn = { initial: { opacity: 0, x: 40 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -40 } };
const fadeIn = { initial: { opacity: 0, scale: 0.97 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.97 } };
const spring = { type: 'spring' as const, stiffness: 320, damping: 32 };
const fadeTrans = { duration: 0.25, ease: [0.25, 0.1, 0.25, 1] as const };

// Signup step indicator
const SIGNUP_STEPS = ['Info', 'PIN', 'Confirm'];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {SIGNUP_STEPS.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <div className="flex flex-col items-center gap-1">
            <motion.div
              animate={{
                width: i === current ? 24 : 8,
                backgroundColor: i <= current ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.15)',
              }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="h-[6px] rounded-full"
            />
          </div>
          {i < SIGNUP_STEPS.length - 1 && <div className="w-0" />}
        </div>
      ))}
    </div>
  );
}

export default function Onboarding() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [pinError, setPinError] = useState(false);
  const { register, login, restore, resetPin } = useUser();
  const { country, allCountries, setCountry } = useCountryCode();
  const { isAvailable: biometricAvailable, isEnabled: biometricEnabled, authenticateWithBiometric, hasSavedCredential, enableBiometric } = useBiometric();
  const navigate = useNavigate();
  const [screen, setScreen] = useState<Screen>('landing');
  const [showWelcomeBack, setShowWelcomeBack] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [showBiometricPrompt, setShowBiometricPrompt] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  // Forgot PIN flow
  const [forgotPhone, setForgotPhone] = useState('');
  const [forgotPin, setForgotPin] = useState('');
  const [forgotConfirmPin, setForgotConfirmPin] = useState('');

  useEffect(() => {
    if (sessionStorage.getItem('paytrack_signed_out')) {
      sessionStorage.removeItem('paytrack_signed_out');
      setShowWelcomeBack(true);
      const timer = setTimeout(() => setShowWelcomeBack(false), 3500);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (biometricAvailable && biometricEnabled && hasSavedCredential()) {
      setShowBiometricPrompt(true);
    }
  }, [biometricAvailable, biometricEnabled, hasSavedCredential]);

  const formatPhone = (val: string) => val.replace(/\D/g, '').slice(0, country.phoneLength);
  const fullPhone = country.dial + phone.replace(/\D/g, '');
  const isPhoneValid = phone.replace(/\D/g, '').length >= Math.max(country.phoneLength - 1, 7);

  const resetForm = () => {
    setPhone(''); setName(''); setPin(''); setConfirmPin('');
    setForgotPhone(''); setForgotPin(''); setForgotConfirmPin('');
    setLoading(false); setPinError(false);
  };

  // Filtered countries for search
  const filteredCountries = countrySearch
    ? allCountries.filter(c =>
        c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
        c.dial.includes(countrySearch) ||
        c.code.toLowerCase().includes(countrySearch.toLowerCase())
      )
    : allCountries;

  // ── Biometric login ──
  const handleBiometricLogin = useCallback(async () => {
    setLoading(true);
    try {
      const user = await authenticateWithBiometric();
      if (user) {
        await restore(user.phone);
        hapticSuccess();
        toast.success('Welcome back!');
        navigate('/schedule');
      } else {
        hapticError();
        toast.error('Biometric authentication failed');
      }
    } catch {
      hapticError();
      toast.error('Biometric authentication failed');
    } finally {
      setLoading(false);
    }
  }, [authenticateWithBiometric, restore, navigate]);

  // ── Login handlers ──
  const handleContinueToPin = () => {
    if (!isPhoneValid) { toast.error(`Enter a valid ${country.phoneLength}-digit phone number`); return; }
    setPin(''); setPinError(false); setScreen('login-pin');
  };

  const handleLoginPinEntry = useCallback(async (fullPin: string) => {
    setLoading(true); setPinError(false);
    try {
      await login(fullPhone, fullPin);
      if (biometricAvailable && !biometricEnabled) {
        const userId = localStorage.getItem('paytrack_user_id');
        const userName = localStorage.getItem('paytrack_user_name');
        if (userId) {
          await enableBiometric(fullPhone, userId, userName || '');
        }
      }
      hapticSuccess();
      toast.success('Welcome back!');
      navigate('/schedule');
    } catch (err: any) {
      hapticError();
      setPinError(true);
      setTimeout(() => { setPinError(false); setPin(''); }, 600);
      toast.error(err?.message?.includes('No account') ? 'No account found' : 'Incorrect PIN');
    } finally { setLoading(false); }
  }, [login, navigate, fullPhone, biometricAvailable, biometricEnabled, enableBiometric]);

  const handleLoginPadPress = (digit: string) => {
    if (pin.length >= 4) return;
    const newPin = pin + digit;
    setPin(newPin);
    if (newPin.length === 4) handleLoginPinEntry(newPin);
  };

  // ── Signup handlers ──
  const handleSignupInfoContinue = () => {
    if (!isPhoneValid) { toast.error(`Enter a valid ${country.phoneLength}-digit phone number`); return; }
    if (!name.trim()) { toast.error('Please enter your name'); return; }
    setPin(''); setScreen('signup-pin');
  };

  const handleSignupPinPress = (digit: string) => {
    if (pin.length >= 4) return;
    const newPin = pin + digit;
    setPin(newPin);
    if (newPin.length === 4) {
      setTimeout(() => { setConfirmPin(''); setScreen('signup-confirm'); }, 300);
    }
  };

  const handleConfirmPinPress = useCallback(async (digit: string) => {
    if (confirmPin.length >= 4) return;
    const newConfirm = confirmPin + digit;
    setConfirmPin(newConfirm);
    if (newConfirm.length === 4) {
      if (newConfirm !== pin) {
        hapticError();
        setPinError(true);
        setTimeout(() => { setPinError(false); setConfirmPin(''); }, 600);
        toast.error('PINs do not match');
        return;
      }
      setLoading(true);
      try {
        const userId = await register(fullPhone, name.trim(), pin);
        if (biometricAvailable) {
          await enableBiometric(fullPhone, userId, name.trim());
        }
        hapticSuccess();
        toast.success('Welcome to PayTrack!');
        navigate('/schedule');
      } catch (err: any) {
        hapticError();
        toast.error(err?.message || 'Something went wrong');
        setPinError(true);
        setTimeout(() => { setPinError(false); setConfirmPin(''); }, 600);
      } finally { setLoading(false); }
    }
  }, [confirmPin, pin, register, fullPhone, name, navigate, biometricAvailable, enableBiometric]);

  // ── Forgot PIN handlers ──
  const handleForgotPhoneContinue = () => {
    const forgotDigits = forgotPhone.replace(/\D/g, '');
    if (forgotDigits.length < Math.max(country.phoneLength - 1, 7)) {
      toast.error(`Enter a valid ${country.phoneLength}-digit phone number`);
      return;
    }
    setForgotPin(''); setScreen('forgot-new-pin');
  };

  const handleForgotPinPress = (digit: string) => {
    if (forgotPin.length >= 4) return;
    const newPin = forgotPin + digit;
    setForgotPin(newPin);
    if (newPin.length === 4) {
      setTimeout(() => { setForgotConfirmPin(''); setScreen('forgot-confirm-pin'); }, 300);
    }
  };

  const handleForgotConfirmPress = useCallback(async (digit: string) => {
    if (forgotConfirmPin.length >= 4) return;
    const newConfirm = forgotConfirmPin + digit;
    setForgotConfirmPin(newConfirm);
    if (newConfirm.length === 4) {
      if (newConfirm !== forgotPin) {
        hapticError();
        setPinError(true);
        setTimeout(() => { setPinError(false); setForgotConfirmPin(''); }, 600);
        toast.error('PINs do not match');
        return;
      }
      setLoading(true);
      try {
        const phoneNum = country.dial + forgotPhone.replace(/\D/g, '');
        await resetPin(phoneNum, forgotPin);
        hapticSuccess();
        toast.success('PIN reset successfully! Please sign in.');
        resetForm();
        setScreen('login-phone');
      } catch (err: any) {
        hapticError();
        toast.error(err?.message || 'Something went wrong');
        setPinError(true);
        setTimeout(() => { setPinError(false); setForgotConfirmPin(''); }, 600);
      } finally { setLoading(false); }
    }
  }, [forgotConfirmPin, forgotPin, country.dial, forgotPhone, resetPin]);

  // ── Shared UI pieces ──

  const backButton = (onBack: () => void) => (
    <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}
      onClick={onBack} className="absolute top-0 left-0 flex items-center gap-0.5 text-white/40 active:text-white/60 transition-colors z-10"
    >
      <ChevronLeft className="w-5 h-5" />
      <span className="text-[15px] font-normal">Back</span>
    </motion.button>
  );

  // ── Country picker with search ──
  const handleCountrySelect = (c: CountryInfo) => {
    setCountry(c);
    setShowCountryPicker(false);
    setCountrySearch('');
    // Reset phone when switching country
    setPhone('');
  };

  const countryPickerJSX = () => (
    <>
      <motion.button whileTap={{ scale: 0.96 }} type="button"
        onClick={(e) => { e.stopPropagation(); setShowCountryPicker(!showCountryPicker); setCountrySearch(''); }}
        className="h-[50px] px-3 rounded-xl bg-white/[0.06] flex items-center gap-1.5 flex-shrink-0 text-white active:bg-white/[0.1] transition-colors"
      >
        <span className="text-lg">{country.flag}</span>
        <span className="text-[15px] font-medium text-white/70">{country.dial}</span>
        <ChevronDown className={`w-3 h-3 text-white/25 transition-transform ${showCountryPicker ? 'rotate-180' : ''}`} />
      </motion.button>
      <AnimatePresence>
        {showCountryPicker && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
            className="absolute left-0 right-0 top-full mt-2 z-30"
          >
            <div className="rounded-2xl bg-[#1c1c1e] border border-white/[0.1] overflow-hidden shadow-2xl shadow-black/50">
              {/* Search */}
              <div className="px-3 py-2 border-b border-white/[0.06]">
                <div className="flex items-center gap-2 bg-white/[0.06] rounded-lg px-3 py-2">
                  <Search className="w-4 h-4 text-white/30 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Search country..."
                    value={countrySearch}
                    onChange={e => setCountrySearch(e.target.value)}
                    className="flex-1 bg-transparent text-[14px] text-white placeholder:text-white/25 outline-none"
                    autoFocus
                  />
                </div>
              </div>
              {/* List */}
              <div className="max-h-[200px] overflow-y-auto divide-y divide-white/[0.04]">
                {filteredCountries.length === 0 ? (
                  <div className="px-4 py-4 text-center text-white/25 text-[13px]">No results</div>
                ) : (
                  filteredCountries.map(c => (
                    <button key={c.code} onClick={() => handleCountrySelect(c)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors active:bg-white/[0.08] ${c.code === country.code ? 'bg-white/[0.06]' : ''}`}
                    >
                      <span className="text-lg">{c.flag}</span>
                      <span className="text-[14px] text-white/80 font-medium flex-1">{c.name}</span>
                      <span className="text-[13px] text-white/35">{c.dial}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );

  // Close country picker on outside click
  useEffect(() => {
    if (!showCountryPicker) return;
    const handler = () => setShowCountryPicker(false);
    const timer = setTimeout(() => document.addEventListener('click', handler), 10);
    return () => { clearTimeout(timer); document.removeEventListener('click', handler); };
  }, [showCountryPicker]);

  // ── Grouped iOS-style input card ──
  const iosCard = (children: React.ReactNode) => (
    <div className="rounded-2xl bg-white/[0.06] overflow-hidden">
      {children}
    </div>
  );

  const iosRow = (label: string, input: React.ReactNode, isLast = false) => (
    <div className={`px-4 ${!isLast ? 'border-b border-white/[0.06]' : ''}`}>
      <div className="flex items-center h-[52px] gap-3">
        <span className="text-[15px] text-white/40 w-[70px] flex-shrink-0">{label}</span>
        {input}
      </div>
    </div>
  );

  // Phone input helper text
  const phoneHint = `${country.phoneLength} digits`;

  // ── Passcode screen layout ──
  const passcodeLayout = (
    icon: React.ReactNode,
    title: string,
    subtitle: string,
    pinLength: number,
    pinFilled: number,
    error: boolean,
    onPadPress: (d: string) => void,
    onPadDelete: () => void,
    onBack: () => void,
    extra?: React.ReactNode,
    isLoading = false,
    stepIndicator?: React.ReactNode,
  ) => (
    <motion.div key={title} {...fadeIn} transition={fadeTrans}
      className="flex flex-col items-center min-h-[calc(100dvh-48px)] relative pt-2"
    >
      {backButton(onBack)}

      {/* Step indicator */}
      {stepIndicator && <div className="pt-10 w-full">{stepIndicator}</div>}

      {/* Top section */}
      <div className={`flex flex-col items-center ${stepIndicator ? 'pb-4' : 'pt-12 pb-4'}`}>
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="w-14 h-14 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center mb-4"
        >
          {icon}
        </motion.div>
        <h2 className="text-[20px] font-semibold text-white tracking-tight">{title}</h2>
        <p className="text-white/30 text-[13px] mt-1 text-center">{subtitle}</p>
      </div>

      {/* PIN dots */}
      <div className="flex-1 flex items-center justify-center">
        <PinInput length={pinLength} filled={pinFilled} error={error} />
      </div>

      {extra}

      <div className="pb-8">
        <NumberPad onPress={onPadPress} onDelete={onPadDelete} disabled={isLoading} />
      </div>

      {isLoading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute bottom-4">
          <motion.div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full"
            animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
        </motion.div>
      )}
    </motion.div>
  );

  return (
    <div className="fixed inset-0 bg-black flex flex-col overflow-y-auto">
      <div className="w-full max-w-[380px] mx-auto px-6 flex-1">
        <AnimatePresence mode="wait">

          {/* ─── LANDING ─── */}
          {screen === 'landing' && (
            <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.35 }} className="flex flex-col min-h-[100dvh]"
            >
              {/* Logo area */}
              <div className="flex-1 flex flex-col items-center justify-center pt-8 pb-4 min-h-[35dvh]">
                <div className="relative">
                  <div className="absolute inset-0 blur-[80px] bg-white/[0.04] rounded-full scale-150" />
                  <motion.div initial={{ opacity: 0, scale: 0.7, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.6, type: 'spring', stiffness: 200, damping: 20 }}
                    className="relative text-center"
                  >
                    <h1 className="text-[56px] font-extrabold tracking-tight leading-none">
                      <span className="text-white">Pay</span>
                      <span className="text-white/35">Track</span>
                    </h1>
                  </motion.div>
                </div>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
                  className="text-white/25 text-[13px] tracking-widest uppercase mt-3">
                  Never miss a payment
                </motion.p>
              </div>

              {/* Welcome back */}
              <AnimatePresence>
                {showWelcomeBack && (
                  <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }} transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                    className="mx-auto w-full mb-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 flex items-center gap-3"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center flex-shrink-0">
                      <Hand className="w-5 h-5 text-white/60" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Welcome back!</p>
                      <p className="text-xs text-white/30">Sign in to continue</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Actions */}
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.45 }}
                className="pb-12 space-y-3"
              >
                {showBiometricPrompt && (
                  <motion.button whileTap={{ scale: 0.97 }}
                    onClick={handleBiometricLogin} disabled={loading}
                    className="w-full h-[56px] text-[16px] font-semibold rounded-2xl gap-2.5 bg-white text-black flex items-center justify-center active:bg-white/90 transition-colors disabled:opacity-50"
                  >
                    <Fingerprint className="w-5 h-5" />
                    Sign in with Face ID
                  </motion.button>
                )}

                <motion.button whileTap={{ scale: 0.97 }}
                  onClick={() => { resetForm(); setScreen('login-phone'); }}
                  className={`w-full h-[56px] text-[16px] font-semibold rounded-2xl gap-2 flex items-center justify-center transition-colors ${
                    showBiometricPrompt
                      ? 'border border-white/[0.12] bg-transparent text-white active:bg-white/[0.06]'
                      : 'bg-white text-black active:bg-white/90'
                  }`}
                >
                  <Phone className="w-[18px] h-[18px]" />
                  Sign In
                </motion.button>

                <motion.button whileTap={{ scale: 0.97 }}
                  onClick={() => { resetForm(); setScreen('signup-info'); }}
                  className="w-full h-[56px] text-[16px] font-semibold rounded-2xl border border-white/[0.12] bg-transparent gap-2 text-white flex items-center justify-center active:bg-white/[0.06] transition-colors"
                >
                  <User className="w-[18px] h-[18px]" />
                  Create Account
                </motion.button>

                <p className="text-white/15 text-[11px] text-center pt-2 flex items-center justify-center gap-1.5">
                  <Shield className="w-3 h-3" />
                  Secured with {showBiometricPrompt ? 'Face ID & ' : ''}4-digit PIN
                </p>
              </motion.div>
            </motion.div>
          )}

          {/* ─── LOGIN: PHONE ─── */}
          {screen === 'login-phone' && (
            <motion.div key="login-phone" {...slideIn} transition={spring}
              className="flex flex-col min-h-[100dvh] relative pt-14"
            >
              {backButton(() => setScreen('landing'))}

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
                className="mb-8"
              >
                <h2 className="text-[30px] font-bold text-white tracking-tight leading-tight">Welcome back</h2>
                <p className="text-white/35 text-[15px] mt-1.5">Enter your phone number to continue</p>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                {iosCard(
                  <div className="px-4">
                    <div className="flex items-center h-[52px] gap-2 relative">
                      {countryPickerJSX()}
                      <div className="w-px h-6 bg-white/[0.08]" />
                      <input type="tel" placeholder={`${country.phoneLength}-digit number`} value={phone}
                        onChange={e => setPhone(formatPhone(e.target.value))}
                        className="flex-1 bg-transparent text-[17px] tracking-wide text-white placeholder:text-white/20 outline-none"
                        maxLength={country.phoneLength} autoFocus
                      />
                    </div>
                  </div>
                )}
                <p className="text-white/20 text-[11px] mt-2 px-1">{country.flag} {country.name} · {phoneHint}</p>
              </motion.div>

              <div className="flex-1" />

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
                className="pb-12"
              >
                <motion.button whileTap={{ scale: 0.97 }}
                  onClick={handleContinueToPin}
                  disabled={!isPhoneValid}
                  className="w-full h-[56px] text-[16px] font-semibold rounded-2xl gap-2 bg-white text-black flex items-center justify-center active:bg-white/90 transition-all disabled:opacity-30"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </motion.div>
            </motion.div>
          )}

          {/* ─── LOGIN: PIN ─── */}
          {screen === 'login-pin' && passcodeLayout(
            <Lock className="w-6 h-6 text-white/70" />,
            'Enter PIN',
            `${country.flag} ${country.dial} ${phone}`,
            4, pin.length, pinError,
            handleLoginPadPress,
            () => setPin(p => p.slice(0, -1)),
            () => { setPin(''); setScreen('login-phone'); },
            <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
              onClick={() => { setForgotPhone(''); setForgotPin(''); setForgotConfirmPin(''); setScreen('forgot-pin'); }}
              className="text-white/30 text-[14px] mb-4 active:text-white/50 transition-colors"
            >
              Forgot PIN?
            </motion.button>,
            loading,
          )}

          {/* ─── SIGNUP STEP 1: INFO ─── */}
          {screen === 'signup-info' && (
            <motion.div key="signup-info" {...slideIn} transition={spring}
              className="flex flex-col min-h-[100dvh] relative pt-14"
            >
              {backButton(() => setScreen('landing'))}

              <StepIndicator current={0} />

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
                className="mb-8"
              >
                <h2 className="text-[30px] font-bold text-white tracking-tight leading-tight">Create account</h2>
                <p className="text-white/35 text-[15px] mt-1.5">Set up your profile to get started</p>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                {iosCard(
                  <>
                    {iosRow('Name', (
                      <input type="text" placeholder="Full name" value={name} onChange={e => setName(e.target.value)}
                        className="flex-1 bg-transparent text-[17px] text-white placeholder:text-white/20 outline-none"
                        maxLength={50} autoFocus
                      />
                    ))}
                    <div className="px-4">
                      <div className="flex items-center h-[52px] gap-2 relative">
                        <span className="text-[15px] text-white/40 w-[70px] flex-shrink-0">Phone</span>
                        {countryPickerJSX()}
                        <div className="w-px h-6 bg-white/[0.08]" />
                        <input type="tel" placeholder={`${country.phoneLength} digits`} value={phone}
                          onChange={e => setPhone(formatPhone(e.target.value))}
                          className="flex-1 bg-transparent text-[17px] tracking-wide text-white placeholder:text-white/20 outline-none"
                          maxLength={country.phoneLength}
                        />
                      </div>
                    </div>
                  </>
                )}
                <p className="text-white/20 text-[11px] mt-2 px-1">{country.flag} {country.name} · {phoneHint}</p>
              </motion.div>

              <div className="flex-1" />

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
                className="pb-12 space-y-2"
              >
                <motion.button whileTap={{ scale: 0.97 }}
                  onClick={handleSignupInfoContinue}
                  disabled={!isPhoneValid || !name.trim()}
                  className="w-full h-[56px] text-[16px] font-semibold rounded-2xl gap-2 bg-white text-black flex items-center justify-center active:bg-white/90 transition-all disabled:opacity-30"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
                <p className="text-white/15 text-[11px] text-center">
                  You'll create a 4-digit PIN next
                </p>
              </motion.div>
            </motion.div>
          )}

          {/* ─── SIGNUP STEP 2: CREATE PIN ─── */}
          {screen === 'signup-pin' && passcodeLayout(
            <Lock className="w-6 h-6 text-white/70" />,
            'Create PIN',
            'Choose a 4-digit PIN to secure your account',
            4, pin.length, false,
            handleSignupPinPress,
            () => setPin(p => p.slice(0, -1)),
            () => { setPin(''); setScreen('signup-info'); },
            undefined,
            false,
            <StepIndicator current={1} />,
          )}

          {/* ─── SIGNUP STEP 3: CONFIRM PIN ─── */}
          {screen === 'signup-confirm' && passcodeLayout(
            <Shield className="w-6 h-6 text-white/70" />,
            'Confirm PIN',
            'Re-enter your PIN to confirm',
            4, confirmPin.length, pinError,
            (d) => handleConfirmPinPress(d),
            () => setConfirmPin(p => p.slice(0, -1)),
            () => { setConfirmPin(''); setScreen('signup-pin'); },
            undefined,
            loading,
            <StepIndicator current={2} />,
          )}

          {/* ─── FORGOT PIN: PHONE ─── */}
          {screen === 'forgot-pin' && (
            <motion.div key="forgot-pin" {...slideIn} transition={spring}
              className="flex flex-col min-h-[100dvh] relative pt-14"
            >
              {backButton(() => { setScreen('login-pin'); })}

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
                className="mb-8"
              >
                <div className="w-14 h-14 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center mb-5">
                  <KeyRound className="w-6 h-6 text-white/70" />
                </div>
                <h2 className="text-[30px] font-bold text-white tracking-tight leading-tight">Reset PIN</h2>
                <p className="text-white/35 text-[15px] mt-1.5">Enter your registered phone number</p>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                {iosCard(
                  <div className="px-4">
                    <div className="flex items-center h-[52px] gap-2 relative">
                      {countryPickerJSX()}
                      <div className="w-px h-6 bg-white/[0.08]" />
                      <input type="tel" placeholder={`${country.phoneLength}-digit number`} value={forgotPhone}
                        onChange={e => setForgotPhone(e.target.value.replace(/\D/g, '').slice(0, country.phoneLength))}
                        className="flex-1 bg-transparent text-[17px] tracking-wide text-white placeholder:text-white/20 outline-none"
                        maxLength={country.phoneLength} autoFocus
                      />
                    </div>
                  </div>
                )}
                <p className="text-white/20 text-[11px] mt-2 px-1">{country.flag} {country.name} · {phoneHint}</p>
              </motion.div>

              <div className="flex-1" />

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
                className="pb-12"
              >
                <motion.button whileTap={{ scale: 0.97 }}
                  onClick={handleForgotPhoneContinue}
                  className="w-full h-[56px] text-[16px] font-semibold rounded-2xl gap-2 bg-white text-black flex items-center justify-center active:bg-white/90 transition-colors"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </motion.div>
            </motion.div>
          )}

          {/* ─── FORGOT PIN: NEW PIN ─── */}
          {screen === 'forgot-new-pin' && passcodeLayout(
            <KeyRound className="w-6 h-6 text-white/70" />,
            'New PIN',
            'Choose your new 4-digit PIN',
            4, forgotPin.length, false,
            handleForgotPinPress,
            () => setForgotPin(p => p.slice(0, -1)),
            () => { setForgotPin(''); setScreen('forgot-pin'); },
          )}

          {/* ─── FORGOT PIN: CONFIRM ─── */}
          {screen === 'forgot-confirm-pin' && passcodeLayout(
            <Shield className="w-6 h-6 text-white/70" />,
            'Confirm New PIN',
            'Re-enter your new PIN to confirm',
            4, forgotConfirmPin.length, pinError,
            (d) => handleForgotConfirmPress(d),
            () => setForgotConfirmPin(p => p.slice(0, -1)),
            () => { setForgotConfirmPin(''); setScreen('forgot-new-pin'); },
            undefined,
            loading,
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
