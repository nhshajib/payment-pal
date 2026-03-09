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

function AppRoutes() {
  const { isOnboarded, loading } = useUser();
  const [showSplash, setShowSplash] = useState(true);

  if (loading) {
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
