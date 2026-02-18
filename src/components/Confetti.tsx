import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const COLORS = [
  'hsl(152, 69%, 40%)',  // success green
  'hsl(38, 92%, 50%)',   // warning amber
  'hsl(358, 94%, 47%)',  // primary red
  'hsl(200, 80%, 55%)',  // blue
  'hsl(280, 70%, 55%)',  // purple
  'hsl(50, 95%, 55%)',   // yellow
];

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  rotation: number;
  scale: number;
  shape: 'circle' | 'square' | 'triangle';
}

function generateParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: -10 - Math.random() * 20,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    rotation: Math.random() * 360,
    scale: 0.4 + Math.random() * 0.8,
    shape: (['circle', 'square', 'triangle'] as const)[Math.floor(Math.random() * 3)],
  }));
}

export default function Confetti({ trigger }: { trigger: boolean }) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (trigger) {
      setParticles(generateParticles(24));
      setShow(true);
      const timer = setTimeout(() => setShow(false), 1800);
      return () => clearTimeout(timer);
    }
  }, [trigger]);

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
          {particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                rotate: 0,
                scale: 0,
                opacity: 1,
              }}
              animate={{
                top: `${90 + Math.random() * 20}%`,
                rotate: p.rotation + 360 * (Math.random() > 0.5 ? 1 : -1),
                scale: p.scale,
                opacity: 0,
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 1.2 + Math.random() * 0.6,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
              className="absolute"
              style={{ left: `${p.x}%` }}
            >
              <div
                className={`${p.shape === 'circle' ? 'rounded-full' : p.shape === 'square' ? 'rounded-sm' : ''}`}
                style={{
                  width: p.shape === 'triangle' ? 0 : 8,
                  height: p.shape === 'triangle' ? 0 : 8,
                  backgroundColor: p.shape !== 'triangle' ? p.color : 'transparent',
                  borderLeft: p.shape === 'triangle' ? '4px solid transparent' : undefined,
                  borderRight: p.shape === 'triangle' ? '4px solid transparent' : undefined,
                  borderBottom: p.shape === 'triangle' ? `8px solid ${p.color}` : undefined,
                }}
              />
            </motion.div>
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}
