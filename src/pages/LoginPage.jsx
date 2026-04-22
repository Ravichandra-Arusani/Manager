// src/pages/LoginPage.jsx
import React, { useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';

/* Floating decorative bubbles */
const BUBBLES = [
  { size: 220, top: '10%',  left: '8%',  color: 'rgba(124,58,237,0.18)',  dur: 8  },
  { size: 160, top: '60%',  left: '75%', color: 'rgba(6,182,212,0.14)',   dur: 11 },
  { size: 100, top: '30%',  left: '60%', color: 'rgba(124,58,237,0.10)',  dur: 6  },
  { size: 80,  top: '75%',  left: '20%', color: 'rgba(6,182,212,0.12)',   dur: 9  },
  { size: 50,  top: '15%',  left: '50%', color: 'rgba(162,89,255,0.15)',  dur: 7  },
];

function StarField() {
  const stars = Array.from({ length: 80 }, (_, i) => ({
    id: i,
    x:   Math.random() * 100,
    y:   Math.random() * 100,
    s:   Math.random() * 2 + 0.5,
    dur: (Math.random() * 3 + 2).toFixed(1),
    del: (Math.random() * 4).toFixed(1),
  }));
  return (
    <div className="stars-bg" aria-hidden>
      {stars.map(st => (
        <div
          key={st.id}
          className="star"
          style={{
            left:  `${st.x}%`,
            top:   `${st.y}%`,
            width:  `${st.s}px`,
            height: `${st.s}px`,
            '--dur': `${st.dur}s`,
            '--del': `${st.del}s`,
          }}
        />
      ))}
    </div>
  );
}

export default function LoginPage() {
  const { signIn, error } = useAuth();

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-void">
      <StarField />

      {/* Background orbs */}
      {BUBBLES.map((b, i) => (
        <div
          key={i}
          className="orb"
          style={{
            width:  b.size,
            height: b.size,
            top:    b.top,
            left:   b.left,
            background: b.color,
            animationDuration: `${b.dur}s`,
            animationDelay: `${i * 0.8}s`,
          }}
        />
      ))}

      {/* Card */}
      <div
        className="relative z-10 glass rounded-3xl p-10 flex flex-col items-center gap-6 text-center glow"
        style={{ maxWidth: 420, width: '90vw' }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg,#7c3aed,#06b6d4)',
                boxShadow: '0 0 40px rgba(124,58,237,0.5)',
              }}
            >
              <svg viewBox="0 0 40 40" width="40" height="40" fill="none">
                <circle cx="20" cy="14" r="6" fill="white" opacity="0.95"/>
                <circle cx="10" cy="30" r="4" fill="white" opacity="0.8"/>
                <circle cx="20" cy="33" r="4" fill="white" opacity="0.8"/>
                <circle cx="30" cy="30" r="4" fill="white" opacity="0.8"/>
                <line x1="20" y1="20" x2="10" y2="30" stroke="white" strokeWidth="1.5" opacity="0.5"/>
                <line x1="20" y1="20" x2="20" y2="33" stroke="white" strokeWidth="1.5" opacity="0.5"/>
                <line x1="20" y1="20" x2="30" y2="30" stroke="white" strokeWidth="1.5" opacity="0.5"/>
              </svg>
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold gradient-text">Project Memory</h1>
            <p style={{ color: 'var(--text-2)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              Manager
            </p>
          </div>
        </div>

        <p style={{ color: 'var(--text-2)', fontSize: '0.9rem', lineHeight: 1.6 }}>
          Store project context, track milestones, and generate AI-ready summaries — all in one place.
        </p>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2">
          {['🔵 Mind-map UI','🔐 Private projects','🔗 Shareable links','📋 AI summaries'].map(f => (
            <span key={f} className="tag">{f}</span>
          ))}
        </div>

        {/* Google sign-in */}
        <button
          id="google-signin-btn"
          onClick={signIn}
          className="w-full flex items-center justify-center gap-3 py-3 px-6 rounded-xl font-semibold text-sm transition-all duration-200"
          style={{
            background: 'white',
            color: '#1a1a2e',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <GoogleIcon />
          Continue with Google
        </button>

        {error && (
          <p style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>{error}</p>
        )}

        <p style={{ color: 'var(--text-3)', fontSize: '0.75rem' }}>
          Free forever · No credit card required
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}
