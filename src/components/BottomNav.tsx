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
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-bottom border-t border-border/40 bg-card/95 backdrop-blur-xl">
      <div className="flex justify-around items-center h-[52px] max-w-md mx-auto">
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
              className="relative flex flex-col items-center justify-center gap-0.5 w-20 py-1"
            >
              {/* Active pill background */}
              {isActive && (
                <motion.div
                  layoutId="navPill"
                  className="absolute -top-0.5 w-10 h-[3px] rounded-full bg-primary"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <tab.icon
                className={`w-[22px] h-[22px] transition-colors duration-200 ${
                  isActive ? 'text-primary' : 'text-muted-foreground/50'
                }`}
                strokeWidth={isActive ? 2.2 : 1.6}
              />
              <span
                className={`text-[10px] leading-tight transition-colors duration-200 ${
                  isActive ? 'text-primary font-semibold' : 'text-muted-foreground/40 font-medium'
                }`}
              >
                {tab.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}
