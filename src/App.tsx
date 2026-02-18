import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { UserProvider, useUser } from "@/hooks/useUser";
import Onboarding from "./pages/Onboarding";
import Schedule from "./pages/Schedule";
import Settings from "./pages/Settings";
import BottomNav from "./components/BottomNav";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppRoutes() {
  const { isOnboarded, loading } = useUser();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-primary text-2xl font-bold animate-pulse">PayTrack</div>
      </div>
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
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <UserProvider>
          <AppRoutes />
        </UserProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
