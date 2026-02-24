import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Lottie from "lottie-react";
import countingMoneyAnim from "@/assets/counting_money.json";
import { UserProvider, useUser } from "@/hooks/useUser";
import { CurrencyProvider } from "@/hooks/useCurrency";
import { ThemeProvider } from "@/hooks/useTheme";
import { PremiumProvider } from "@/hooks/usePremium";
import Onboarding from "./pages/Onboarding";
import Schedule from "./pages/Schedule";
import Overview from "./pages/Overview";
import Settings from "./pages/Settings";
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
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background overflow-hidden"
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
    >
      {/* Ambient glow rings */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 500,
          height: 500,
          background: "radial-gradient(circle, hsl(var(--primary) / 0.08) 0%, transparent 65%)",
        }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 2, opacity: 1 }}
        transition={{ duration: 2, ease: "easeOut" }}
      />

      {/* Lottie Animation */}
      <motion.div
        className="relative z-10 mb-6 w-64 h-64"
        initial={{ opacity: 0, scale: 0.6, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.8, type: "spring", stiffness: 160, damping: 20 }}
      >
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <Lottie
            animationData={countingMoneyAnim}
            loop
            className="w-full h-full"
          />
        </motion.div>
      </motion.div>

      {/* Logo */}
      <motion.h1
        className="relative z-10 text-5xl font-extrabold tracking-tight"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.5, type: "spring", stiffness: 200, damping: 24 }}
      >
        <span className="text-foreground">Pay</span>
        <span className="text-primary">Track</span>
      </motion.h1>

      {/* Tagline */}
      <motion.p
        className="relative z-10 text-muted-foreground text-xs mt-2 tracking-[0.15em] uppercase font-medium"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.85, duration: 0.5 }}
      >
        Never miss a payment
      </motion.p>

      {/* Loading bar */}
      <motion.div
        className="relative z-10 mt-12 h-[2.5px] rounded-full bg-border overflow-hidden"
        initial={{ width: 0, opacity: 0 }}
        animate={{ width: 160, opacity: 1 }}
        transition={{ delay: 1.1, duration: 0.3 }}
      >
        <motion.div
          className="h-full rounded-full bg-primary"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ delay: 1.2, duration: 1.8, ease: [0.22, 0.68, 0.36, 1] }}
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
