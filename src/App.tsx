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
import Overview from "./pages/Overview";
import Settings from "./pages/Settings";
import Premium from "./pages/Premium";
import BottomNav from "./components/BottomNav";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

/* ─── Cinematic Splash Screen ─── */
function SplashScreen({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 3200);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[200] bg-black h-screen w-screen flex flex-col items-center justify-center overflow-hidden"
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
    >
      {/* Lottie Animation — centered, constrained */}
      <motion.div
        className="relative z-10 w-56 h-56 max-w-xs"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.7, type: "spring", stiffness: 180, damping: 20 }}
      >
        <Lottie
          animationData={countingMoneyAnim}
          loop
          className="w-full h-full"
        />
      </motion.div>

      {/* Logo */}
      <motion.h1
        className="relative z-10 text-4xl font-extrabold tracking-tight mt-4"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5, type: "spring", stiffness: 200, damping: 24 }}
      >
        <span className="text-white">Pay</span>
        <span className="text-white/50">Track</span>
      </motion.h1>

      {/* Tagline */}
      <motion.p
        className="relative z-10 text-white/30 text-[11px] mt-1.5 tracking-[0.18em] uppercase font-medium"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
      >
        Never miss a payment
      </motion.p>

      {/* Loading bar */}
      <motion.div
        className="relative z-10 mt-10 h-[2px] rounded-full overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.08)' }}
        initial={{ width: 0, opacity: 0 }}
        animate={{ width: 140, opacity: 1 }}
        transition={{ delay: 1.0, duration: 0.3 }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{ background: 'rgba(255,255,255,0.35)' }}
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ delay: 1.1, duration: 1.8, ease: [0.22, 0.68, 0.36, 1] }}
        />
      </motion.div>
    </motion.div>
  );
}

function AppRoutes() {
  const { isOnboarded, loading } = useUser();
  const [showSplash, setShowSplash] = useState(true);

  // Only show splash for returning users
  if (loading) return null;

  if (isOnboarded && showSplash) {
    return (
      <AnimatePresence mode="wait">
        <SplashScreen key="splash" onComplete={() => setShowSplash(false)} />
      </AnimatePresence>
    );
  }

  return (
    <>
      <AnimatePresence mode="wait">
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
            path="/insights"
            element={isOnboarded ? <Overview /> : <Navigate to="/" replace />}
          />
          <Route
            path="/overview"
            element={<Navigate to="/insights" replace />}
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
      </AnimatePresence>
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
