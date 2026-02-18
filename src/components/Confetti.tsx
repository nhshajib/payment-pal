import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const COLORS = [
  'hsl(152, 69%, 40%)',
  'hsl(38, 92%, 50%)',
  'hsl(358, 94%, 47%)',
  'hsl(200, 80%, 55%)',
  'hsl(280, 70%, 55%)',
  'hsl(50, 95%, 55%)',
  'hsl(170, 60%, 50%)',
];

interface Particle {
  id: number;
  x: number;
  targetX: number;
  color: string;
  rotation: number;
  scale: number;
  shape: 'circle' | 'square' | 'star' | 'ribbon';
  delay: number;
}

function generateParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = (Math.random() * Math.PI * 2);
    const spread = 15 + Math.random() * 35;
    return {
      id: i,
      x: 50 + Math.cos(angle) * spread,
      targetX: 50 + Math.cos(angle) * (spread + Math.random() * 20),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotation: Math.random() * 720 - 360,
      scale: 0.3 + Math.random() * 0.7,
      shape: (['circle', 'square', 'star', 'ribbon'] as const)[Math.floor(Math.random() * 4)],
      delay: Math.random() * 0.15,
    };
  });
}

function renderShape(shape: string, color: string) {
  switch (shape) {
    case 'star':
      return (
        <svg width="10" height="10" viewBox="0 0 10 10">
          <polygon points="5,0 6.2,3.5 10,3.5 7,5.8 8,9.5 5,7.2 2,9.5 3,5.8 0,3.5 3.8,3.5" fill={color} />
        </svg>
      );
    case 'ribbon':
      return <div style={{ width: 3, height: 12, backgroundColor: color, borderRadius: 1 }} />;
    case 'square':
      return <div style={{ width: 7, height: 7, backgroundColor: color, borderRadius: 1 }} />;
    default:
      return <div style={{ width: 7, height: 7, backgroundColor: color, borderRadius: '50%' }} />;
  }
}

export default function Confetti({ trigger }: { trigger: boolean }) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (trigger) {
      setParticles(generateParticles(36));
      setShow(true);
      const timer = setTimeout(() => setShow(false), 2200);
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
                left: '50%',
                top: '40%',
                rotate: 0,
                scale: 0,
                opacity: 1,
              }}
              animate={{
                left: `${p.targetX}%`,
                top: `${85 + Math.random() * 20}%`,
                rotate: p.rotation,
                scale: p.scale,
                opacity: 0,
              }}
              exit={{ opacity: 0 }}
              transition={{
                delay: p.delay,
                duration: 1.0 + Math.random() * 0.8,
                ease: [0.2, 0.8, 0.4, 1],
              }}
              className="absolute"
            >
              {renderShape(p.shape, p.color)}
            </motion.div>
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}
