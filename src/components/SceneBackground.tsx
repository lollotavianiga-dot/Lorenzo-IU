import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { NeuroState } from '../services/geminiService';

interface SceneBackgroundProps {
  neuroState: NeuroState;
}

export default function SceneBackground({ neuroState }: SceneBackgroundProps) {
  // Determine scene based on neuroState
  // High fatigue = Deep Sea (calm, dark, blue)
  // High adrenaline = Space Nebula (vibrant, active, purple/gold)
  // High serotonin = Digital Twilight (stable, soft, indigo)
  
  const getScene = () => {
    if (neuroState.fatigue > 0.6) return 'sea';
    if (neuroState.adrenaline > 0.6) return 'space';
    return 'twilight';
  };

  const scene = getScene();

  return (
    <div className="fixed inset-0 z-[-2] overflow-hidden bg-[#030305]">
      <AnimatePresence mode="wait">
        {scene === 'sea' && (
          <motion.div
            key="sea-scene"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2 }}
            className="absolute inset-0"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 via-cyan-900/10 to-[#030305]" />
            {/* Light rays */}
            <div className="absolute inset-0 opacity-20 bg-[url('https://picsum.photos/seed/underwater/1920/1080')] bg-cover mix-blend-overlay blur-sm animate-wave" />
            <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-cyan-500/10 to-transparent blur-3xl" />
          </motion.div>
        )}

        {scene === 'space' && (
          <motion.div
            key="space-scene"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2 }}
            className="absolute inset-0"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-900/20 via-transparent to-orange-900/10" />
            {/* Stars/Nebula */}
            <div className="absolute inset-0 opacity-30 bg-[url('https://picsum.photos/seed/nebula/1920/1080')] bg-cover mix-blend-screen blur-[2px] animate-drift" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05)_0%,transparent_70%)]" />
          </motion.div>
        )}

        {scene === 'twilight' && (
          <motion.div
            key="twilight-scene"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2 }}
            className="absolute inset-0"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/30 via-transparent to-[#030305]" />
            <div className="absolute inset-0 opacity-10 bg-[url('https://picsum.photos/seed/nightsky/1920/1080')] bg-cover mix-blend-lighten grayscale" />
            {/* Soft digital grid or pulse */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_at_center,black,transparent)]" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Atmosphere Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>
    </div>
  );
}
