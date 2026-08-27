import React from 'react';
import { motion } from 'framer-motion';
import { Scan, Sparkles, CheckCircle2, AlertTriangle, Cpu, ShieldCheck, Lock } from 'lucide-react';

export default function AIFaceGrid({ detectedFace, isMirrored = true }) {
  // If no face is detected in the current camera frame, vanish INSTANTLY with zero lingering delay!
  if (!detectedFace) {
    return null;
  }

  const isError = detectedFace.error;
  const isCheckedIn = detectedFace.alreadyCheckedIn;
  const isTeacher = detectedFace.role === 'teacher';

  const theme = isError
    ? { border: 'border-red-500', shadow: 'shadow-red-500/50', stroke: '#ef4444', fill: 'rgba(239, 68, 68, 0.12)', text: 'text-red-400', bg: 'bg-red-950/90', glow: 'rgba(239, 68, 68, 0.7)' }
    : isCheckedIn
      ? { border: 'border-cyan-400', shadow: 'shadow-cyan-500/50', stroke: '#22d3ee', fill: 'rgba(34, 211, 238, 0.12)', text: 'text-cyan-300', bg: 'bg-cyan-950/90', glow: 'rgba(34, 211, 238, 0.7)' }
      : isTeacher
        ? { border: 'border-emerald-400', shadow: 'shadow-emerald-500/50', stroke: '#34d399', fill: 'rgba(52, 211, 153, 0.12)', text: 'text-emerald-300', bg: 'bg-emerald-950/90', glow: 'rgba(52, 211, 153, 0.7)' }
        : { border: 'border-teal-400', shadow: 'shadow-teal-500/50', stroke: '#2dd4bf', fill: 'rgba(45, 212, 191, 0.12)', text: 'text-teal-300', bg: 'bg-teal-950/90', glow: 'rgba(45, 212, 191, 0.7)' };

  // Calculate dynamic bounding box percentage mapping around the actual face
  let boxStyle = {};
  if (detectedFace.box_top_pct !== undefined && detectedFace.box_width_pct !== undefined) {
    const padX = 6;
    const padY = 8;
    const rawTop = Math.max(2, detectedFace.box_top_pct - padY);
    const rawHeight = Math.min(96 - rawTop, detectedFace.box_height_pct + (padY * 2));
    const rawWidth = Math.min(94, detectedFace.box_width_pct + (padX * 2));
    
    // In user-facing webcam, the video is horizontally mirrored
    const rawLeft = isMirrored 
      ? Math.max(2, 100 - detectedFace.box_right_pct - padX)
      : Math.max(2, detectedFace.box_left_pct - padX);

    boxStyle = {
      position: 'absolute',
      top: `${rawTop}%`,
      left: `${rawLeft}%`,
      width: `${rawWidth}%`,
      height: `${rawHeight}%`,
      minWidth: '160px',
      minHeight: '180px',
      maxWidth: '380px',
      maxHeight: '440px',
      transition: 'top 0.12s ease-out, left 0.12s ease-out, width 0.12s ease-out, height 0.12s ease-out'
    };
  }

  return (
    <motion.div
      initial={{ scale: 0.92, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      transition={{ duration: 0.15 }}
      style={boxStyle}
      className={`absolute z-20 flex flex-col items-center justify-between p-2.5 rounded-3xl border-2 ${theme.border} shadow-2xl ${theme.shadow} backdrop-blur-[1px]`}
    >
      {/* 4 High-Tech Security Safe Target Brackets with Accents */}
      <div className={`absolute -top-2.5 -left-2.5 w-6 h-6 border-t-3 border-l-3 ${theme.border} rounded-tl-lg`}>
        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.stroke }} />
      </div>
      <div className={`absolute -top-2.5 -right-2.5 w-6 h-6 border-t-3 border-r-3 ${theme.border} rounded-tr-lg flex justify-end`}>
        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.stroke }} />
      </div>
      <div className={`absolute -bottom-2.5 -left-2.5 w-6 h-6 border-b-3 border-l-3 ${theme.border} rounded-bl-lg flex items-end`}>
        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.stroke }} />
      </div>
      <div className={`absolute -bottom-2.5 -right-2.5 w-6 h-6 border-b-3 border-r-3 ${theme.border} rounded-br-lg flex items-end justify-end`}>
        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.stroke }} />
      </div>

      {/* SVG Neural Mesh / 3D Cyber Face Geometry */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" viewBox="0 0 200 240" preserveAspectRatio="none">
        <defs>
          <pattern id="safe-grid-mesh" width="14" height="14" patternUnits="userSpaceOnUse">
            <path d="M 14 0 L 0 0 0 14" fill="none" stroke={theme.stroke} strokeWidth="0.4" strokeOpacity="0.3" />
            <circle cx="0" cy="0" r="0.8" fill={theme.stroke} fillOpacity="0.5" />
          </pattern>
        </defs>

        {/* Matrix Grid Fill */}
        <rect width="200" height="240" rx="20" fill="url(#safe-grid-mesh)" />

        {/* High-Tech Biometric Facial Landmark Wireframe */}
        <g stroke={theme.stroke} strokeWidth="1" strokeOpacity="0.75" fill={theme.fill}>
          {/* Forehead Arc */}
          <polygon points="100,35 60,58 100,72 140,58" />
          
          {/* Eye Target Rings */}
          <circle cx="76" cy="90" r="9" strokeWidth="1.2" />
          <circle cx="76" cy="90" r="2.5" fill={theme.stroke} />
          <circle cx="124" cy="90" r="9" strokeWidth="1.2" />
          <circle cx="124" cy="90" r="2.5" fill={theme.stroke} />

          {/* Nose Diamond Bridge */}
          <polygon points="100,75 90,122 100,132 110,122" />
          <line x1="76" y1="90" x2="90" y2="122" strokeDasharray="2,2" strokeOpacity="0.5" />
          <line x1="124" y1="90" x2="110" y2="122" strokeDasharray="2,2" strokeOpacity="0.5" />

          {/* Cheek & Chin Boundary */}
          <polygon points="100,132 55,128 48,168 100,205 152,168 145,128" />

          {/* Mouth Contour */}
          <polygon points="100,150 82,164 100,174 118,164" />
          <line x1="100" y1="174" x2="100" y2="205" strokeWidth="1.2" />
        </g>

        {/* Pulsing Keypoint Nodes */}
        <circle cx="100" cy="35" r="2.5" fill={theme.stroke} />
        <circle cx="48" cy="168" r="2.5" fill={theme.stroke} />
        <circle cx="152" cy="168" r="2.5" fill={theme.stroke} />
        <circle cx="100" cy="205" r="3" fill={theme.stroke} className="animate-ping" />
      </svg>

      {/* High-Tech Biometric Sweeping Laser Beam */}
      <motion.div
        animate={{ y: [0, 180, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute left-1 right-1 h-1 pointer-events-none rounded-full z-10"
        style={{
          background: `linear-gradient(90deg, transparent, ${theme.stroke}, transparent)`,
          boxShadow: `0 0 16px ${theme.glow}`
        }}
      />

      {/* Top Security HUD Header */}
      <div className="w-full flex items-center justify-between text-[8px] sm:text-[9px] font-mono text-white/95 z-20">
        <span className={`${theme.bg} px-2 py-0.5 rounded-md border ${theme.border} flex items-center gap-1 shadow-lg`}>
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          <span>BIOMETRIC LOCK</span>
        </span>
        <span className={`${theme.bg} px-2 py-0.5 rounded-md border ${theme.border} font-bold shadow-lg`}>
          {isError ? 'NO MATCH' : `${detectedFace.confidence || 96}% MATCH`}
        </span>
      </div>

      {/* Bottom Floating Identity Card Locked onto Face */}
      <motion.div
        initial={{ y: 8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`w-full ${theme.bg} backdrop-blur-md px-2.5 py-1.5 rounded-2xl border-2 ${theme.border} text-center shadow-2xl z-20`}
      >
        <div className="flex items-center justify-center gap-1 mb-0.5">
          {isError ? (
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
          ) : isCheckedIn ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
          ) : (
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          )}
          <p className="font-black text-xs text-white uppercase tracking-wide truncate max-w-[150px] drop-shadow">
            {detectedFace.name}
          </p>
        </div>
        
        <p className={`text-[9px] font-mono font-bold ${theme.text}`}>
          {detectedFace.id ? `${detectedFace.id} • ${isCheckedIn ? 'ALREADY RECORDED' : detectedFace.roleLabel || 'Verified'}` : detectedFace.roleLabel || 'Face Unrecognized'}
        </p>
      </motion.div>
    </motion.div>
  );
}
