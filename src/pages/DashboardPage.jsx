// src/pages/DashboardPage.jsx
import React, { useState } from 'react';
import { useAuth }            from '../hooks/useAuth';
import { useProjects }        from '../hooks/useProjects';
import ProjectGrid            from '../components/ProjectGrid';
import ProjectModal           from '../components/ProjectModal';
import ImportProjectModal     from '../components/ImportProjectModal';

export default function DashboardPage() {
  const { user, signOut }                        = useAuth();
  const { projects, loading, addProject,
          updateProject, deleteProject }          = useProjects(user?.uid);
  const [selected, setSelected]                  = useState(null);
  const [showImport, setShowImport]              = useState(false);
  const [toast, setToast]                        = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const handleAdd = async () => {
    const ref = await addProject({});
    // Open the new project immediately
    const newProject = {
      id:          ref.id,
      name:        'New Project',
      concept:     '',
      techStack:   [],
      milestones:  [],
      blockers:    '',
      nextSteps:   '',
      codeSnippet: '',
      links:       [],
      isPublic:    false,
      color:       randomHsl(),
    };
    setSelected(newProject);
  };

  const handleSave = async (id, data) => {
    await updateProject(id, data);
    // Keep modal open but refresh from live data
    const updated = projects.find(p => p.id === id);
    if (updated) setSelected({ ...updated, ...data });
    showToast('✅ Saved!');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this project?')) return;
    await deleteProject(id);
    setSelected(null);
    showToast('🗑 Deleted');
  };

  const handleImport = async (data) => {
    const ref = await addProject({
      ...data,
      createdAt: undefined, // let Firestore set this
    });
    showToast('⬆ Project imported!');
    // Open the newly created project
    setSelected({ id: ref.id, ...data });
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--bg-void)' }}>
      {/* ── Header ── */}
      <header
        className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: '1px solid var(--border)', backdropFilter: 'blur(16px)', flexShrink: 0 }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#06b6d4)' }}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
              <circle cx="12" cy="8"  r="3.5" fill="white" opacity="0.95"/>
              <circle cx="6"  cy="18" r="2.5" fill="white" opacity="0.8"/>
              <circle cx="12" cy="20" r="2.5" fill="white" opacity="0.8"/>
              <circle cx="18" cy="18" r="2.5" fill="white" opacity="0.8"/>
              <line x1="12" y1="11.5" x2="6"  y2="18" stroke="white" strokeWidth="1" opacity="0.5"/>
              <line x1="12" y1="11.5" x2="12" y2="20" stroke="white" strokeWidth="1" opacity="0.5"/>
              <line x1="12" y1="11.5" x2="18" y2="18" stroke="white" strokeWidth="1" opacity="0.5"/>
            </svg>
          </div>
          <div>
            <h1 className="font-bold text-base leading-tight gradient-text">
              Project Memory
            </h1>
            <p style={{ color: 'var(--text-3)', fontSize: '0.72rem' }}>
              {projects.length} project{projects.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="import-project-btn"
            className="btn-ghost"
            onClick={() => setShowImport(true)}
            title="Import an existing project using AI"
          >
            <span style={{ fontSize: '1rem', lineHeight: 1 }}>⬆</span>
            Import
          </button>
          <button
            id="add-project-btn"
            className="btn-primary"
            onClick={handleAdd}
          >
            <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>✦</span>
            New Project
          </button>

          <div className="flex items-center gap-2">
            {user?.photoURL && (
              <img
                src={user.photoURL}
                alt={user.displayName}
                className="w-8 h-8 rounded-full"
                style={{ border: '2px solid var(--border-hov)' }}
              />
            )}
            <button className="btn-ghost" onClick={signOut} id="signout-btn">
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* ── Main area ── */}
      <main className="flex-1 flex flex-col items-center justify-center" style={{ position: 'relative' }}>
        {loading ? (
          <div className="spinner" />
        ) : (
          <ProjectGrid
            projects={projects}
            onSelect={setSelected}
            onAdd={handleAdd}
          />
        )}
      </main>

      {/* ── Project modal ── */}
      {selected && (
        <ProjectModal
          project={selected}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => setSelected(null)}
        />
      )}

      {/* ── Import modal ── */}
      {showImport && (
        <ImportProjectModal
          onImport={handleImport}
          onClose={() => setShowImport(false)}
        />
      )}

      {/* ── Toast ── */}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

function randomHsl() {
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue}, 70%, 55%)`;
}
