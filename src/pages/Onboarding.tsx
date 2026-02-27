import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@/hooks/useUser';
import { useCountryCode } from '@/hooks/useCountryCode';
import { useBiometric } from '@/hooks/useBiometric';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ArrowRight, ChevronLeft, Hand, Phone, Lock, User, ChevronDown, Shield, Fingerprint, KeyRound,
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

  const formatPhone = (val: string) => val.replace(/\D/g, '').slice(0, 15);
  const fullPhone = country.dial + phone.replace(/\D/g, '');

  const resetForm = () => {
    setPhone(''); setName(''); setPin(''); setConfirmPin('');
    setForgotPhone(''); setForgotPin(''); setForgotConfirmPin('');
    setLoading(false); setPinError(false);
  };

  // ── Biometric login ──
  const handleBiometricLogin = useCallback(async () => {
    setLoading(true);
    try {
      const user = await authenticateWithBiometric();
      if (user) {
        await restore(user.phone);
        toast.success('Welcome back!');
        navigate('/schedule');
      } else {
        toast.error('Biometric authentication failed');
      }
    } catch {
      toast.error('Biometric authentication failed');
    } finally {
      setLoading(false);
    }
  }, [authenticateWithBiometric, restore, navigate]);

  // ── Login handlers ──
  const handleContinueToPin = () => {
    if (phone.replace(/\D/g, '').length < 7) { toast.error('Enter a valid phone number'); return; }
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
      toast.success('Welcome back!');
      navigate('/schedule');
    } catch (err: any) {
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
    if (phone.replace(/\D/g, '').length < 7) { toast.error('Enter a valid phone number'); return; }
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
        toast.success('Welcome to PayTrack!');
        navigate('/schedule');
      } catch (err: any) {
        toast.error(err?.message || 'Something went wrong');
        setPinError(true);
        setTimeout(() => { setPinError(false); setConfirmPin(''); }, 600);
      } finally { setLoading(false); }
    }
  }, [confirmPin, pin, register, fullPhone, name, navigate, biometricAvailable, enableBiometric]);

  // ── Forgot PIN handlers ──
  const handleForgotPhoneContinue = () => {
    if (forgotPhone.replace(/\D/g, '').length < 7) { toast.error('Enter a valid phone number'); return; }
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
        setPinError(true);
        setTimeout(() => { setPinError(false); setForgotConfirmPin(''); }, 600);
        toast.error('PINs do not match');
        return;
      }
      setLoading(true);
      try {
        const phoneNum = country.dial + forgotPhone.replace(/\D/g, '');
        await resetPin(phoneNum, forgotPin);
        toast.success('PIN reset successfully! Please sign in.');
        resetForm();
        setScreen('login-phone');
      } catch (err: any) {
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

  // ── Country picker inline JSX ──
  const countryPickerJSX = (forForgot = false) => (
    <>
      <motion.button whileTap={{ scale: 0.96 }} type="button"
        onClick={() => setShowCountryPicker(!showCountryPicker)}
        className="h-[50px] px-3 rounded-xl bg-white/[0.06] flex items-center gap-1.5 flex-shrink-0 text-white active:bg-white/[0.1] transition-colors"
      >
        <span className="text-lg">{country.flag}</span>
        <span className="text-[15px] font-medium text-white/70">{country.dial}</span>
        <ChevronDown className="w-3 h-3 text-white/25" />
      </motion.button>
      <AnimatePresence>
        {showCountryPicker && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }} className="overflow-hidden absolute left-0 right-0 top-full mt-1 z-20"
          >
            <div className="max-h-40 overflow-y-auto rounded-2xl bg-[#1c1c1e] border border-white/[0.1] divide-y divide-white/[0.06]">
              {allCountries.map(c => (
                <button key={c.code} onClick={() => { setCountry(c); setShowCountryPicker(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors active:bg-white/[0.08] ${c.code === country.code ? 'bg-white/[0.06]' : ''}`}
                >
                  <span className="text-lg">{c.flag}</span>
                  <span className="text-[15px] text-white/80 font-medium">{c.dial}</span>
                  <span className="text-xs text-white/25 ml-auto">{c.code}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );

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

  // ── Passcode screen layout (iOS lock screen pattern) ──
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
  ) => (
    <motion.div key={title} {...fadeIn} transition={fadeTrans}
      className="flex flex-col items-center min-h-[calc(100dvh-48px)] relative pt-2"
    >
      {backButton(onBack)}

      {/* Top section */}
      <div className="flex flex-col items-center pt-12 pb-4">
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

      {/* Extra (forgot pin link etc) */}
      {extra}

      {/* Number pad */}
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
              {/* Logo area — top 35% */}
              <div className="flex-1 flex flex-col items-center justify-center pt-8 pb-4 min-h-[35dvh]">
                {/* Subtle glow */}
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

              {/* Welcome back banner */}
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

              {/* Actions — bottom */}
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.45 }}
                className="pb-12 space-y-3"
              >
                {/* Biometric */}
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
                      <input type="tel" placeholder="Phone number" value={phone}
                        onChange={e => setPhone(formatPhone(e.target.value))}
                        className="flex-1 bg-transparent text-[17px] tracking-wide text-white placeholder:text-white/20 outline-none"
                        maxLength={15} autoFocus
                      />
                    </div>
                  </div>
                )}
              </motion.div>

              <div className="flex-1" />

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
                className="pb-12"
              >
                <motion.button whileTap={{ scale: 0.97 }}
                  onClick={handleContinueToPin}
                  className="w-full h-[56px] text-[16px] font-semibold rounded-2xl gap-2 bg-white text-black flex items-center justify-center active:bg-white/90 transition-colors"
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
                        <input type="tel" placeholder="Number" value={phone}
                          onChange={e => setPhone(formatPhone(e.target.value))}
                          className="flex-1 bg-transparent text-[17px] tracking-wide text-white placeholder:text-white/20 outline-none"
                          maxLength={15}
                        />
                      </div>
                    </div>
                  </>
                )}
              </motion.div>

              <div className="flex-1" />

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
                className="pb-12 space-y-2"
              >
                <motion.button whileTap={{ scale: 0.97 }}
                  onClick={handleSignupInfoContinue}
                  className="w-full h-[56px] text-[16px] font-semibold rounded-2xl gap-2 bg-white text-black flex items-center justify-center active:bg-white/90 transition-colors"
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
                <p className="text-white/35 text-[15px] mt-1.5">Enter your registered phone number to reset your PIN</p>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                {iosCard(
                  <div className="px-4">
                    <div className="flex items-center h-[52px] gap-2 relative">
                      {countryPickerJSX(true)}
                      <div className="w-px h-6 bg-white/[0.08]" />
                      <input type="tel" placeholder="Phone number" value={forgotPhone}
                        onChange={e => setForgotPhone(formatPhone(e.target.value))}
                        className="flex-1 bg-transparent text-[17px] tracking-wide text-white placeholder:text-white/20 outline-none"
                        maxLength={15} autoFocus
                      />
                    </div>
                  </div>
                )}
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
