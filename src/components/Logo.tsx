import React from 'react';
import { motion } from 'motion/react';

export const MeteorixLogo: React.FC<{ size?: number; className?: string }> = ({ size = 48, className = "" }) => {
  return (
    <div 
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <motion.svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        initial={{ rotate: -45, scale: 0.8 }}
        animate={{ rotate: 0, scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      >
        {/* Outer Glow Circle */}
        <defs>
          <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#58a6ff" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
          <radialGradient id="ringGlow" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <stop offset="80%" stopColor="transparent" stopOpacity="0" />
            <stop offset="100%" stopColor="#58a6ff" stopOpacity="0.5" />
          </radialGradient>
        </defs>

        <circle cx="50%" cy="50%" r="48" fill="none" stroke="url(#ringGlow)" strokeWidth="1" strokeDasharray="4 2" />
        
        {/* The Meteor Prism */}
        <motion.path
          d="M50 15 L85 50 L50 85 L15 50 Z"
          fill="none"
          stroke="url(#logoGrad)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          animate={{
            strokeDasharray: ["1 200", "200 1", "200 1"],
            strokeDashoffset: [0, -200, -400],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        {/* Inner Core */}
        <motion.circle
          cx="50"
          cy="50"
          r="12"
          fill="url(#logoGrad)"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Kinetic Trails */}
        <motion.line
          x1="50" y1="50" x2="80" y2="20"
          stroke="#58a6ff"
          strokeWidth="2"
          strokeLinecap="round"
          initial={{ opacity: 0, pathLength: 0 }}
          animate={{ opacity: [0, 1, 0], pathLength: [0, 1, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
        />
        <motion.line
          x1="50" y1="50" x2="20" y2="80"
          stroke="#a855f7"
          strokeWidth="2"
          strokeLinecap="round"
          initial={{ opacity: 0, pathLength: 0 }}
          animate={{ opacity: [0, 1, 0], pathLength: [0, 1, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
        />
      </motion.svg>
      
      {/* Absolute glow background */}
      <div className="absolute inset-0 bg-glacier-primary/20 blur-xl rounded-full -z-10 animate-pulse" />
    </div>
  );
};
