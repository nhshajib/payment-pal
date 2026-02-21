import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
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
    const timer = setTimeout(onComplete, 1800);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-background"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
    >
      {/* Radial glow */}
      <motion.div
        className="absolute w-72 h-72 rounded-full"
        style={{
          background: "radial-gradient(circle, hsl(358, 94%, 47%, 0.15) 0%, transparent 70%)",
        }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1.5, opacity: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      />

      <div className="relative flex flex-col items-center">
        <motion.h1
          className="text-5xl font-extrabold tracking-tight"
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6, type: "spring", stiffness: 200, damping: 20 }}
        >
          <span className="text-foreground">Pay</span>
          <span className="text-primary">Track</span>
        </motion.h1>

        <motion.p
          className="text-muted-foreground text-sm mt-2 tracking-wide"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.4 }}
        >
          Never miss a payment
        </motion.p>

        {/* Loading bar */}
        <motion.div
          className="mt-8 h-0.5 rounded-full bg-primary/30 overflow-hidden"
          initial={{ width: 0 }}
          animate={{ width: 120 }}
          transition={{ delay: 0.4, duration: 0.3 }}
        >
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ delay: 0.5, duration: 1.2, ease: "easeInOut" }}
          />
        </motion.div>
      </div>
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
            path="/overview"
            element={isOnboarded ? <Overview /> : <Navigate to="/" replace />}
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
