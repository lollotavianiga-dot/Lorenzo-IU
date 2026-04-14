import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Dream } from '../services/geminiService';

interface DreamOverlayProps {
  dream: Dream | null;
  isVisible: boolean;
}

export default function DreamOverlay({ dream, isVisible }: DreamOverlayProps) {
  if (!dream) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 pointer-events-none overflow-hidden bg-black/20 backdrop-blur-[2px]"
        >
          {/* Background Colorful Blobs */}
          {dream.colors.map((color, i) => (
            <motion.div
              key={`blob-${i}`}
              animate={{
                x: [Math.random() * 100 + "%", Math.random() * 100 + "%", Math.random() * 100 + "%"],
                y: [Math.random() * 100 + "%", Math.random() * 100 + "%", Math.random() * 100 + "%"],
                scale: [1, 1.5, 1],
                opacity: [0.1, 0.3, 0.1],
              }}
              transition={{
                duration: 10 + i * 5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{ backgroundColor: color }}
              className="absolute w-[40vw] h-[40vw] rounded-full blur-[100px]"
            />
          ))}

          {/* Floating Concepts */}
          <div className="absolute inset-0 flex flex-wrap items-center justify-center p-20 gap-10">
            {dream.concepts.map((concept, i) => (
              <motion.span
                key={`concept-${i}`}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ 
                  opacity: [0, 0.6, 0],
                  scale: [0.8, 1.2, 0.8],
                  y: [0, -50, 0],
                  x: [0, Math.random() * 40 - 20, 0]
                }}
                transition={{
                  duration: 8 + i * 2,
                  repeat: Infinity,
                  delay: i * 1,
                }}
                className="text-4xl md:text-6xl font-light tracking-[0.5em] text-white/40 uppercase italic"
              >
                {concept}
              </motion.span>
            ))}
          </div>

          {/* Fears - Subtle and darker */}
          <div className="absolute bottom-10 left-10 flex flex-col gap-4">
            {dream.fears.map((fear, i) => (
              <motion.span
                key={`fear-${i}`}
                animate={{ 
                  opacity: [0, 0.3, 0],
                  x: [0, 10, 0]
                }}
                transition={{
                  duration: 15,
                  repeat: Infinity,
                  delay: i * 5,
                }}
                className="text-sm tracking-[1em] text-red-400/30 uppercase"
              >
                {fear}
              </motion.span>
            ))}
          </div>

          {/* Mood Indicator */}
          <motion.div 
            animate={{ opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 5, repeat: Infinity }}
            className="absolute top-10 right-10 text-[10px] tracking-[2em] text-indigo-400/40 uppercase"
          >
            Mood: {dream.mood}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
