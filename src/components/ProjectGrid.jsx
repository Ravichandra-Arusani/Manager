// src/components/ProjectGrid.jsx
import React from 'react';

function ProgressBar({ milestones }) {
  if (!milestones || milestones.length === 0) return null;
  const done = milestones.filter(m => m.done).length;
  const pct = Math.round((done / milestones.length) * 100);
  return (
    <div className="mt-4">
      <div className="flex justify-between mb-1" style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>
        <span>Progress</span>
        <span style={{ color: 'var(--accent-2, #06b6d4)' }}>{done}/{milestones.length}</span>
      </div>
      <div className="progress-bar">
        <div className="progress-bar__fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function ProjectGrid({ projects, onSelect, onAdd }) {
  return (
    <div className="p-6 overflow-y-auto w-full h-full" style={{ maxHeight: 'calc(100vh - 73px)' }}>
      <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
        {projects.length === 0 && (
          <div className="col-span-full text-center py-10" style={{ gridColumn: '1 / -1' }}>
            <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-1)' }}>No projects yet</h2>
            <p style={{ color: 'var(--text-3)' }}>Create your first project to get started!</p>
          </div>
        )}
        
        {projects.map(p => (
          <div
            key={p.id}
            className="glass p-5 rounded-2xl cursor-pointer hover:scale-[1.02] transition-transform"
            style={{
              borderTop: `4px solid ${p.color || 'var(--accent)'}`,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '180px'
            }}
            onClick={() => onSelect(p)}
          >
            <div>
              <h3 className="font-bold text-lg mb-2 truncate" style={{ color: 'var(--text-1)' }}>
                {p.name}
              </h3>
              <p className="line-clamp-2" style={{ color: 'var(--text-2)', fontSize: '0.875rem', minHeight: '2.5rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {p.concept || 'No concept provided.'}
              </p>
              {p.techStack && p.techStack.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {p.techStack.slice(0, 3).map(t => (
                    <span key={t} className="tag" style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem' }}>{t}</span>
                  ))}
                  {p.techStack.length > 3 && (
                    <span className="tag" style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem' }}>+{p.techStack.length - 3}</span>
                  )}
                </div>
              )}
            </div>
            
            <ProgressBar milestones={p.milestones} />
          </div>
        ))}
        
        {/* Add Project Card */}
        <div
          className="glass p-5 rounded-2xl flex items-center justify-center cursor-pointer transition-colors"
          style={{ minHeight: '180px', border: '2px dashed var(--border)' }}
          onClick={onAdd}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <div className="text-center">
            <div style={{ fontSize: '2.5rem', color: 'var(--text-3)', lineHeight: 1 }}>+</div>
            <div style={{ color: 'var(--text-2)', fontWeight: 'bold', marginTop: '0.5rem' }}>New Project</div>
          </div>
        </div>
      </div>
    </div>
  );
}
