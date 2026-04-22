// src/components/ProjectBubble.jsx
import React, { useRef, useState } from 'react';

/**
 * A single project bubble in the radial mind-map.
 * Props:
 *   project   — Firestore project doc
 *   onClick   — open the ProjectModal
 *   style     — position + size from MindMapDashboard
 *   isCenter  — renders as the central hub
 */
export default function ProjectBubble({ project, onClick, style, isCenter }) {
  const [hovered, setHovered] = useState(false);
  const ref = useRef(null);

  const size   = style?.size   ?? 80;
  const color  = project.color ?? '#7c3aed';
  const letter = (project.name || '?')[0].toUpperCase();

  /* Derive an "accent glow" from the bubble colour */
  const glowColor = color.startsWith('hsl')
    ? color.replace('hsl', 'hsla').replace(')', ', 0.45)')
    : 'rgba(124,58,237,0.45)';

  if (isCenter) {
    return (
      <div
        ref={ref}
        className="absolute flex flex-col items-center justify-center cursor-default select-none"
        style={{
          ...style,
          width:  size,
          height: size,
          borderRadius: '50%',
          background: 'linear-gradient(135deg,#7c3aed,#06b6d4)',
          boxShadow: '0 0 40px rgba(124,58,237,0.5), 0 0 80px rgba(6,182,212,0.2)',
          zIndex: 10,
        }}
      >
        <svg viewBox="0 0 36 36" width={size * 0.45} height={size * 0.45} fill="none">
          <circle cx="18" cy="12" r="5" fill="white" opacity="0.95"/>
          <circle cx="9"  cy="27" r="3.5" fill="white" opacity="0.75"/>
          <circle cx="18" cy="29" r="3.5" fill="white" opacity="0.75"/>
          <circle cx="27" cy="27" r="3.5" fill="white" opacity="0.75"/>
          <line x1="18" y1="17" x2="9"  y2="27" stroke="white" strokeWidth="1.5" opacity="0.5"/>
          <line x1="18" y1="17" x2="18" y2="29" stroke="white" strokeWidth="1.5" opacity="0.5"/>
          <line x1="18" y1="17" x2="27" y2="27" stroke="white" strokeWidth="1.5" opacity="0.5"/>
        </svg>
        <span style={{ color: 'white', fontSize: size * 0.1, fontWeight: 700, marginTop: 2 }}>
          My Projects
        </span>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      id={`bubble-${project.id}`}
      className="absolute flex flex-col items-center justify-center cursor-pointer select-none"
      style={{
        ...style,
        width:  size,
        height: size,
        borderRadius: '50%',
        background: color,
        boxShadow: hovered
          ? `0 0 32px ${glowColor}, 0 8px 32px rgba(0,0,0,0.5)`
          : `0 0 12px ${glowColor}55, 0 4px 16px rgba(0,0,0,0.4)`,
        transition: 'transform 0.25s cubic-bezier(0.22,1,0.36,1), box-shadow 0.25s',
        transform: hovered ? 'scale(1.15)' : 'scale(1)',
        zIndex: hovered ? 20 : 5,
        border: '2px solid rgba(255,255,255,0.2)',
      }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={project.name}
    >
      <span style={{
        color: 'white',
        fontWeight: 800,
        fontSize: size * 0.3,
        textShadow: '0 2px 8px rgba(0,0,0,0.4)',
        lineHeight: 1,
      }}>
        {letter}
      </span>
      {hovered && (
        <span style={{
          position: 'absolute',
          bottom: -28,
          left: '50%',
          transform: 'translateX(-50%)',
          whiteSpace: 'nowrap',
          background: 'rgba(10,10,20,0.9)',
          color: 'white',
          fontSize: '0.72rem',
          fontWeight: 600,
          padding: '3px 10px',
          borderRadius: '99px',
          border: '1px solid rgba(255,255,255,0.12)',
          pointerEvents: 'none',
        }}>
          {project.name}
        </span>
      )}
    </div>
  );
}
