"use client";

import { motion } from "framer-motion";

export default function Loading() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/90 backdrop-blur-md"
    >
      {/* Container Logo dengan Efek Cahaya (Glow) */}
      <div className="relative">
        {/* Glow Effect di belakang logo */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute inset-0 bg-white/20 blur-[50px] rounded-full"
        />

        {/* Logo Utama dengan Animasi Floating */}
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="relative h-24 w-24 flex items-center justify-center"
        >
          <img 
            src="/assets/logo putih.png" 
            className="w-full h-full object-contain brightness-110 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" 
            alt="Logo" 
          />
        </motion.div>
      </div>

      {/* Progress & Text Section */}
      <div className="mt-12 flex flex-col items-center gap-4">
        {/* Label Text */}
        <motion.p 
          initial={{ opacity: 0, letterSpacing: "0.2em" }}
          animate={{ opacity: 1, letterSpacing: "0.5em" }}
          transition={{ duration: 1 }}
          className="text-[10px] uppercase font-light text-white/50 tracking-[0.5em]"
        >
          Mohon tunggu
        </motion.p>
        
        {/* Modern Progress Bar */}
        <div className="h-[1px] w-32 bg-white/10 overflow-hidden relative">
          <motion.div 
            animate={{ 
              x: ["-100%", "100%"] 
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute inset-0 bg-gradient-to-right from-transparent via-white to-transparent"
            style={{
              backgroundImage: 'linear-gradient(90deg, transparent 0%, #ffffff 50%, transparent 100%)'
            }}
          />
        </div>
      </div>

      {/* Footer Branding (Opsional) */}
      <div className="absolute bottom-10">
        <p className="text-[8px] text-white/20 uppercase tracking-[0.8em]">
          ESBEG STORE © 2026
        </p>
      </div>
    </motion.div>
  );
}