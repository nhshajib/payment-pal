import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Lottie from "lottie-react";
import countingMoneyAnim from "@/assets/counting_money_4.json";
import { UserProvider, useUser } from "@/hooks/useUser";
import { CurrencyProvider } from "@/hooks/useCurrency";
import { ThemeProvider } from "@/hooks/useTheme";
import { PremiumProvider } from "@/hooks/usePremium";
import Onboarding from "./pages/Onboarding";
import Schedule from "./pages/Schedule";
import Split from "./pages/Split";
import Settings from "./pages/Settings";
import Premium from "./pages/Premium";
import BottomNav from "./components/BottomNav";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

/* ─── Splash Screen — fast & minimal ─── */
function SplashScreen({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 1800);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[200] bg-black h-screen w-screen flex flex-col items-center justify-center overflow-hidden"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="relative z-10 w-56 h-56 max-w-xs"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <Lottie
          animationData={countingMoneyAnim}
          loop
          className="w-full h-full"
        />
      </motion.div>

      <motion.h1
        className="relative z-10 text-4xl font-extrabold tracking-tight mt-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        <span className="text-white">Pay</span>
        <span className="text-white/50">Track</span>
      </motion.h1>

      <motion.p
        className="relative z-10 text-white/30 text-[11px] mt-1.5 tracking-[0.18em] uppercase font-medium"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.3 }}
      >
        Never miss a payment
      </motion.p>
    </motion.div>
  );
}

function OfflineFallback() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      className="fixed inset-0 bg-black flex flex-col items-center justify-center px-8 text-center gap-5"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.15, duration: 0.4, type: 'spring', stiffness: 300, damping: 24 }}
        className="w-16 h-16 rounded-2xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/50">
          <line x1="2" x2="22" y1="2" y2="22" />
          <path d="M8.5 16.5a5 5 0 0 1 7 0" />
          <path d="M2 8.82a15 15 0 0 1 4.17-2.65" />
          <path d="M10.66 5c4.01-.36 8.14.9 11.34 3.76" />
          <path d="M16.85 11.25a10 10 0 0 1 2.22 1.68" />
          <path d="M5 12.86a10 10 0 0 1 5.17-2.89" />
          <line x1="12" x2="12.01" y1="20" y2="20" />
        </svg>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4 }}
      >
        <h2 className="text-[20px] font-semibold text-white tracking-tight">No Connection</h2>
        <p className="text-white/30 text-[14px] mt-1.5 leading-relaxed">
          Check your internet connection and try again
        </p>
      </motion.div>
      <motion.button
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.3 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => window.location.reload()}
        className="mt-2 px-6 h-[44px] text-[15px] font-medium rounded-xl bg-white/[0.08] border border-white/[0.1] text-white active:bg-white/[0.14] transition-colors"
      >
        Retry
      </motion.button>
    </motion.div>
  );
}

function AppRoutes() {
  const { isOnboarded, loading } = useUser();
  const [showSplash, setShowSplash] = useState(true);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!loading) { setTimedOut(false); return; }
    const timer = setTimeout(() => {
      if (!navigator.onLine) {
        setTimedOut(true);
      } else {
        // Use cors mode for a reliable connectivity check
        fetch(`${import.meta.env.VITE_SUPABASE_URL || 'https://ubekgmqoqheqaqihnowl.supabase.co'}/rest/v1/`, {
          method: 'HEAD',
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InViZWtnbXFvcWhlcWFxaWhub3dsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzNzM4MTUsImV4cCI6MjA4Njk0OTgxNX0.ZBr2Qqfsv-TBcTHGtzNYm4HhRkuPzfrHlI8Li51QhCQ',
          },
        }).then((res) => {
          if (res.ok || res.status === 200) {
            // Supabase reachable but auth is slow — keep waiting longer
            setTimeout(() => { if (loading) setTimedOut(true); }, 12000);
          } else {
            setTimeout(() => { if (loading) setTimedOut(true); }, 8000);
          }
        }).catch(() => {
          setTimedOut(true);
        });
      }
    }, 10000);
    return () => clearTimeout(timer);
  }, [loading]);

  if (loading) {
    if (timedOut) return <OfflineFallback />;
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (isOnboarded && showSplash) {
    return (
      <AnimatePresence mode="wait">
        <SplashScreen key="splash" onComplete={() => setShowSplash(false)} />
      </AnimatePresence>
    );
  }

  return (
    <>
      <Routes>
        <Route
          path="/"
          element={isOnboarded ? <Navigate to="/schedule" replace /> : <Onboarding />}
        />
        <Route
          path="/schedule"
          element={isOnboarded ? <Schedule /> : <Navigate to="/" replace />}
        />
        <Route
          path="/split"
          element={isOnboarded ? <Split /> : <Navigate to="/" replace />}
        />
        <Route
          path="/insights"
          element={<Navigate to="/split" replace />}
        />
        <Route
          path="/overview"
          element={<Navigate to="/split" replace />}
        />
        <Route
          path="/settings"
          element={isOnboarded ? <Settings /> : <Navigate to="/" replace />}
        />
        <Route
          path="/premium"
          element={isOnboarded ? <Premium /> : <Navigate to="/" replace />}
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {isOnboarded && <BottomNav />}
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <PremiumProvider>
        <TooltipProvider>
          <CurrencyProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <UserProvider>
                <AppRoutes />
              </UserProvider>
            </BrowserRouter>
          </CurrencyProvider>
        </TooltipProvider>
      </PremiumProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
