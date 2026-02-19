import { CalendarDays, Settings, BarChart3 } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { haptic } from '@/lib/haptics';

const tabs = [
  { path: '/schedule', icon: CalendarDays, label: 'Schedule' },
  { path: '/overview', icon: BarChart3, label: 'Overview' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-bottom">
      <div className="mx-3 mb-2">
        <div className="glass-strong rounded-2xl border border-border/30 shadow-lg shadow-black/20">
          <div className="flex justify-around items-center h-[60px] max-w-md mx-auto px-2">
            {tabs.map((tab) => {
              const isActive = location.pathname === tab.path;
              return (
                <motion.button
                  key={tab.path}
                  whileTap={{ scale: 0.85 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  onClick={() => {
                    haptic(15);
                    navigate(tab.path);
                  }}
                  className="relative flex flex-col items-center gap-0.5 px-5 py-1.5"
                >
                  {/* Top border glow on active */}
                  {isActive && (
                    <motion.div
                      layoutId="navTopGlow"
                      className="absolute top-0 left-[20%] right-[20%] h-[2px] rounded-b-full"
                      style={{
                        background: 'hsl(161 84% 39%)',
                        boxShadow: '0 0 8px hsl(161 84% 39% / 0.7), 0 0 16px hsl(161 84% 39% / 0.3)',
                      }}
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                  {/* Background pill on active */}
                  {isActive && (
                    <motion.div
                      layoutId="navPill"
                      className="absolute inset-0 bg-primary/10 rounded-xl"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                  <motion.div
                    animate={{ scale: isActive ? 1.12 : 1, y: isActive ? -1 : 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    className="relative"
                  >
                    <tab.icon
                      className={`w-[22px] h-[22px] transition-colors duration-200 ${
                        isActive ? 'text-primary' : 'text-muted-foreground/50'
                      }`}
                      strokeWidth={isActive ? 2.5 : 1.6}
                    />
                  </motion.div>
                  {/* Label only for active tab */}
                  <AnimatePresence mode="wait">
                    {isActive && (
                      <motion.span
                        key="label"
                        initial={{ opacity: 0, y: 3 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 3 }}
                        transition={{ duration: 0.15 }}
                        className="text-[10px] relative text-primary font-bold"
                      >
                        {tab.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
