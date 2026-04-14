import { motion } from "motion/react";
import { NeuroState } from "../services/geminiService";

export default function AuraCore({ isProcessing, neuroState }: { isProcessing: boolean, neuroState?: NeuroState }) {
  const adrenaline = neuroState?.adrenaline || 0.2;
  const serotonin = neuroState?.serotonin || 0.5;
  const fatigue = neuroState?.fatigue || 0.1;

  // Base duration affected by adrenaline (faster) and fatigue (slower)
  const baseDuration = (4 / (1 + adrenaline)) * (1 + fatigue);

  return (
    <div className="relative flex items-center justify-center w-64 h-64">
      {/* Deep Background Glow */}
      <motion.div
        animate={{
          scale: [1, 1.4, 1],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{ duration: 10, repeat: Infinity }}
        className="absolute inset-0 rounded-full bg-indigo-500/20 blur-[100px]"
      />

      {/* Outer Glow - Affected by Serotonin (color) and Adrenaline (pulse) */}
      <motion.div
        animate={{
          scale: isProcessing ? [1, 1.2, 1] : [1, 1.05, 1],
          opacity: isProcessing ? [0.3, 0.6, 0.3] : [0.2, 0.3, 0.2],
          backgroundColor: serotonin > 0.7 ? "#f472b6" : adrenaline > 0.7 ? "#fbbf24" : "#6366f1",
        }}
        transition={{
          duration: isProcessing ? baseDuration / 2 : baseDuration,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute inset-0 rounded-full blur-3xl opacity-20"
      />
      
      {/* Secondary Glow - Affected by fatigue (rotation speed) */}
      <motion.div
        animate={{
          scale: isProcessing ? [1, 1.3, 1] : [1, 1.1, 1],
          rotate: [0, 180, 360],
          borderColor: fatigue > 0.6 ? "#60a5fa" : "#a855f7",
        }}
        transition={{
          duration: (isProcessing ? 3 : 8) * (1 + fatigue),
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute inset-4 rounded-full border blur-sm opacity-30"
      />

      {/* Rotating Ring */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 border border-white/5 rounded-full"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-white/40 rounded-full blur-[1px]" />
      </motion.div>

      {/* Core Orb */}
      <motion.div
        animate={{
          scale: isProcessing ? [1, 1.1, 1] : [1, 1.02, 1],
          backgroundColor: isProcessing 
            ? ["#818cf8", "#c084fc", "#fbbf24", "#818cf8"] 
            : fatigue > 0.6 ? "#475569" : "#818cf8",
        }}
        transition={{
          duration: (isProcessing ? 3 : 1.5) / (1 + adrenaline),
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="relative w-24 h-24 rounded-full aura-glow flex items-center justify-center overflow-hidden glass"
      >
        {/* Internal Shimmer */}
        <motion.div
          animate={{
            rotate: [0, 360],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 10 * (1 + fatigue),
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 via-transparent to-purple-500/20"
        />
        
        {/* Pulsing Center */}
        <motion.div 
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.7, 0.3],
            backgroundColor: adrenaline > 0.7 ? "#fbbf24" : "#ffffff"
          }}
          transition={{
            duration: 2 / (1 + adrenaline),
            repeat: Infinity
          }}
          className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-xl border border-white/30 shadow-[0_0_20px_rgba(255,255,255,0.2)]" 
        />
      </motion.div>
    </div>
  );
}
