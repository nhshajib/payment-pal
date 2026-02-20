import { CalendarDays, Settings, BarChart3 } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
        <div
          className="rounded-2xl border-t border-border/20 shadow-lg shadow-black/20"
          style={{
            background: 'hsl(240 3% 11% / 0.92)',
            backdropFilter: 'blur(20px) saturate(1.4)',
            WebkitBackdropFilter: 'blur(20px) saturate(1.4)',
          }}
        >
          <div className="flex justify-around items-center h-[56px] max-w-md mx-auto px-2">
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
                  className="relative flex flex-col items-center gap-0.5 px-5 py-1"
                >
                  <motion.div
                    animate={{ scale: isActive ? 1.08 : 1, y: isActive ? -1 : 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    className="relative flex flex-col items-center"
                  >
                    <tab.icon
                      className={`w-[21px] h-[21px] transition-colors duration-200 ${
                        isActive ? 'text-primary' : 'text-muted-foreground/50'
                      }`}
                      strokeWidth={isActive ? 2.5 : 1.6}
                    />
                    {/* Active dot indicator */}
                    {isActive && (
                      <motion.div
                        layoutId="navDot"
                        className="w-[4px] h-[4px] rounded-full bg-primary mt-0.5"
                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                      />
                    )}
                  </motion.div>
                  {/* Always-visible label */}
                  <span
                    className={`text-[9px] transition-colors duration-200 ${
                      isActive ? 'text-primary font-bold' : 'text-muted-foreground/40 font-medium'
                    }`}
                  >
                    {tab.label}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
