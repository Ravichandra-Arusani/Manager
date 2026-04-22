// src/components/MindMapDashboard.jsx
import React, { useRef, useEffect, useState, useCallback } from 'react';
import ProjectBubble from './ProjectBubble';

const CENTER_SIZE  = 110;
const BUBBLE_SIZES = [80, 72, 88, 68, 76, 84, 70, 78];

/**
 * Radial SVG mind-map layout.
 * Projects orbit the central hub at equal angular intervals.
 * Animated SVG connector lines radiate from center.
 */
export default function MindMapDashboard({ projects, onSelect, onAdd }) {
  const containerRef = useRef(null);
  const [dims, setDims] = useState({ w: 800, h: 600 });

  /* Track container size for responsive positioning */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      setDims({ w: e.contentRect.width, h: e.contentRect.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const cx = dims.w / 2;
  const cy = dims.h / 2;

  /* Adaptive orbit radius based on container */
  const orbitR = Math.min(cx, cy) * 0.62;

  /* Compute bubble positions */
  const positions = projects.map((_, i) => {
    const angle = (2 * Math.PI * i) / Math.max(projects.length, 1) - Math.PI / 2;
    const size  = BUBBLE_SIZES[i % BUBBLE_SIZES.length];
    return {
      x:    cx + orbitR * Math.cos(angle) - size / 2,
      y:    cy + orbitR * Math.sin(angle) - size / 2,
      cx:   cx + orbitR * Math.cos(angle),
      cy:   cy + orbitR * Math.sin(angle),
      size,
    };
  });

  /* ── Empty state ── */
  if (projects.length === 0) {
    return (
      <div ref={containerRef} className="flex-1 flex flex-col items-center justify-center gap-6 p-8">
        <div
          className="w-28 h-28 rounded-full flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg,#7c3aed,#06b6d4)',
            boxShadow: '0 0 60px rgba(124,58,237,0.4)',
          }}
        >
          <svg viewBox="0 0 40 40" width="48" height="48" fill="none">
            <circle cx="20" cy="14" r="6" fill="white" opacity="0.95"/>
            <circle cx="10" cy="30" r="4" fill="white" opacity="0.8"/>
            <circle cx="20" cy="33" r="4" fill="white" opacity="0.8"/>
            <circle cx="30" cy="30" r="4" fill="white" opacity="0.8"/>
            <line x1="20" y1="20" x2="10" y2="30" stroke="white" strokeWidth="1.5" opacity="0.5"/>
            <line x1="20" y1="20" x2="20" y2="33" stroke="white" strokeWidth="1.5" opacity="0.5"/>
            <line x1="20" y1="20" x2="30" y2="30" stroke="white" strokeWidth="1.5" opacity="0.5"/>
          </svg>
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-1)' }}>
            No projects yet
          </h2>
          <p style={{ color: 'var(--text-2)', marginTop: '0.5rem' }}>
            Create your first project to start mapping your ideas
          </p>
        </div>
        <button id="add-first-project-btn" className="btn-primary text-base px-8 py-3" onClick={onAdd}>
          ✦ Add First Project
        </button>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 relative overflow-hidden"
      style={{ minHeight: 480 }}
    >
      {/* SVG connector lines */}
      <svg
        className="absolute inset-0 pointer-events-none"
        width={dims.w}
        height={dims.h}
        style={{ zIndex: 1 }}
      >
        <defs>
          <radialGradient id="lineGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#7c3aed" stopOpacity="0.6"/>
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.1"/>
          </radialGradient>
        </defs>

        {positions.map((pos, i) => (
          <g key={i}>
            {/* Glow line */}
            <line
              x1={cx} y1={cy}
              x2={pos.cx} y2={pos.cy}
              stroke="url(#lineGrad)"
              strokeWidth="3"
              strokeLinecap="round"
              opacity="0.5"
              style={{
                filter: 'blur(2px)',
                animation: `fadeIn 0.6s ease ${i * 0.08}s both`,
              }}
            />
            {/* Crisp line */}
            <line
              x1={cx} y1={cy}
              x2={pos.cx} y2={pos.cy}
              stroke="rgba(124,58,237,0.3)"
              strokeWidth="1"
              strokeLinecap="round"
              strokeDasharray="4 6"
              style={{
                animation: `fadeIn 0.6s ease ${i * 0.08}s both`,
              }}
            />
            {/* Endpoint dot */}
            <circle
              cx={pos.cx} cy={pos.cy} r="3"
              fill="#7c3aed"
              opacity="0.6"
            />
          </g>
        ))}

        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to   { opacity: 1; }
          }
        `}</style>
      </svg>

      {/* Central hub */}
      <ProjectBubble
        isCenter
        project={{ name: 'hub', color: '#7c3aed' }}
        style={{
          position: 'absolute',
          left: cx - CENTER_SIZE / 2,
          top:  cy - CENTER_SIZE / 2,
          size: CENTER_SIZE,
          zIndex: 10,
        }}
      />

      {/* Project bubbles */}
      {projects.map((p, i) => (
        <ProjectBubble
          key={p.id}
          project={p}
          onClick={() => onSelect(p)}
          style={{
            position: 'absolute',
            left: positions[i].x,
            top:  positions[i].y,
            size: positions[i].size,
            animationDelay: `${i * 0.06}s`,
          }}
        />
      ))}
    </div>
  );
}
