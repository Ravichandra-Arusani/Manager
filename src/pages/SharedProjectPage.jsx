// src/pages/SharedProjectPage.jsx
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc }   from 'firebase/firestore';
import { db }            from '../firebase';
import ShareCard         from '../components/ShareCard';

export default function SharedProjectPage() {
  const { id }                   = useParams();
  const [project, setProject]    = useState(null);
  const [loading, setLoading]    = useState(true);
  const [error,   setError]      = useState('');

  useEffect(() => {
    /* We don't know the owner uid from the URL.
       Strategy: scan all users is not feasible without a global collection.
       Better: store a top-level /shared/{id} doc when isPublic is toggled ON.
       For simplicity here we use a globally-accessible /publicProjects/{id} collection
       which is written by the client when isPublic=true (see Firestore rules).
       If the document doesn't exist or isn't public, show a not-found error. */
    (async () => {
      try {
        const ref  = doc(db, 'publicProjects', id);
        const snap = await getDoc(ref);
        if (snap.exists() && snap.data().isPublic) {
          setProject({ id: snap.id, ...snap.data() });
        } else {
          setError('This project is not publicly shared or does not exist.');
        }
      } catch (e) {
        setError('Failed to load project: ' + e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-void)' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-6 text-center p-8"
        style={{ background: 'var(--bg-void)' }}
      >
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'rgba(239,68,68,0.12)',
          border: '1px solid rgba(239,68,68,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2rem',
        }}>🔒</div>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-1)' }}>Project not found</h1>
          <p style={{ color: 'var(--text-2)', marginTop: '0.5rem', maxWidth: 360 }}>{error}</p>
        </div>
        <Link to="/" className="btn-primary">Go to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-void)' }}>
      {/* Subtle header */}
      <header
        className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#06b6d4)' }}
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none">
              <circle cx="12" cy="8"  r="3.5" fill="white" opacity="0.95"/>
              <circle cx="6"  cy="18" r="2.5" fill="white" opacity="0.8"/>
              <circle cx="12" cy="20" r="2.5" fill="white" opacity="0.8"/>
              <circle cx="18" cy="18" r="2.5" fill="white" opacity="0.8"/>
              <line x1="12" y1="11.5" x2="6"  y2="18" stroke="white" strokeWidth="1" opacity="0.5"/>
              <line x1="12" y1="11.5" x2="12" y2="20" stroke="white" strokeWidth="1" opacity="0.5"/>
              <line x1="12" y1="11.5" x2="18" y2="18" stroke="white" strokeWidth="1" opacity="0.5"/>
            </svg>
          </div>
          <span className="font-semibold text-sm gradient-text">Project Memory Manager</span>
        </div>
        <Link
          to="/"
          className="btn-ghost"
          style={{ fontSize: '0.78rem', padding: '0.4rem 0.9rem' }}
        >
          Create your own →
        </Link>
      </header>

      <ShareCard project={project} />
    </div>
  );
}
