// src/components/ProjectModal.jsx
import React, { useState, useEffect } from 'react';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';

/* ── helpers ── */
function buildAiSummary(p) {
  const ms = (p.milestones || []).map(m => `  [${m.done ? 'x' : ' '}] ${m.text}`).join('\n');
  return `
# 🧠 Project Context — ${p.name}

## Concept
${p.concept || '—'}

## Tech Stack
${(p.techStack || []).join(', ') || '—'}

## Milestones
${ms || '  (none)'}

## Blockers
${p.blockers || '—'}

## Next Steps
${p.nextSteps || '—'}

${p.codeSnippet ? `## Code Snippet\n\`\`\`\n${p.codeSnippet}\n\`\`\`` : ''}

${p.links?.length ? `## Links\n${p.links.join('\n')}` : ''}
`.trim();
}

function parseTagInput(raw) {
  return raw.split(/[,\n]+/).map(t => t.trim()).filter(Boolean);
}

/* ── sub-components ── */
function Section({ label, children }) {
  return (
    <div className="mb-5">
      <label className="field-label">{label}</label>
      {children}
    </div>
  );
}

function MilestoneEditor({ milestones, onChange }) {
  const [draft, setDraft] = useState('');

  const add = () => {
    if (!draft.trim()) return;
    onChange([...milestones, { text: draft.trim(), done: false }]);
    setDraft('');
  };

  const toggle = (i) => {
    const next = milestones.map((m, idx) =>
      idx === i ? { ...m, done: !m.done } : m
    );
    onChange(next);
  };

  const remove = (i) => onChange(milestones.filter((_, idx) => idx !== i));

  const done  = milestones.filter(m => m.done).length;
  const pct   = milestones.length ? Math.round((done / milestones.length) * 100) : 0;

  return (
    <div>
      {milestones.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>{done}/{milestones.length} done</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--accent-2, #06b6d4)' }}>{pct}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-bar__fill" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}
      <div className="space-y-1 mb-3">
        {milestones.map((m, i) => (
          <div key={i} className="milestone-row">
            <input type="checkbox" checked={m.done} onChange={() => toggle(i)} id={`ms-${i}`} />
            <span style={{
              flex: 1,
              fontSize: '0.875rem',
              color: m.done ? 'var(--text-3)' : 'var(--text-1)',
              textDecoration: m.done ? 'line-through' : 'none',
            }}>
              {m.text}
            </span>
            <button
              type="button"
              onClick={() => remove(i)}
              style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', lineHeight: 1 }}
              title="Remove"
            >×</button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className="field flex-1"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder="Add milestone… (Enter)"
          style={{ resize: 'none' }}
        />
        <button type="button" className="btn-ghost" onClick={add} style={{ whiteSpace: 'nowrap' }}>Add</button>
      </div>
    </div>
  );
}

/* ── Main modal ── */
export default function ProjectModal({ project, onSave, onDelete, onClose }) {
  const [form, setForm] = useState({
    name:        '',
    concept:     '',
    techStack:   [],
    milestones:  [],
    blockers:    '',
    nextSteps:   '',
    codeSnippet: '',
    links:       [],
    isPublic:    false,
    color:       '#7c3aed',
    ...project,
  });
  const [techInput,  setTechInput]  = useState((project?.techStack  || []).join(', '));
  const [linksInput, setLinksInput] = useState((project?.links      || []).join('\n'));
  const [toast,      setToast]      = useState('');
  const [saving,     setSaving]     = useState(false);

  /* Sync code highlight */
  useEffect(() => {
    document.querySelectorAll('.code-block pre code').forEach(el => hljs.highlightElement(el));
  }, [form.codeSnippet]);

  const update = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const copyForAI = () => {
    navigator.clipboard.writeText(buildAiSummary(form)).then(() => showToast('📋 Copied for AI!'));
  };

  const copyShareLink = () => {
    const url = `${window.location.origin}/project/${project.id}`;
    navigator.clipboard.writeText(url).then(() => showToast('🔗 Share link copied!'));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(project.id, {
        ...form,
        techStack: parseTagInput(techInput),
        links:     linksInput.split('\n').map(l => l.trim()).filter(Boolean),
      });
      showToast('✅ Saved!');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-panel" onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div
                style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: form.color,
                  boxShadow: `0 0 16px ${form.color}88`,
                  flexShrink: 0,
                }}
              />
              <input
                className="field"
                style={{ fontWeight: 700, fontSize: '1.1rem', padding: '0.4rem 0.7rem' }}
                value={form.name}
                onChange={e => update('name', e.target.value)}
                placeholder="Project name"
                id="project-name-input"
              />
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-3)', fontSize: '1.5rem', lineHeight: 1,
                flexShrink: 0,
              }}
              title="Close"
            >✕</button>
          </div>

          {/* Public toggle */}
          <div
            className="flex items-center justify-between p-3 rounded-xl mb-5"
            style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.18)' }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>Public shareable link</div>
              <div style={{ color: 'var(--text-3)', fontSize: '0.75rem' }}>
                Anyone with the link can view this project
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer" style={{ flexShrink: 0 }}>
              <div
                style={{
                  width: 42, height: 24,
                  borderRadius: 99,
                  background: form.isPublic ? 'var(--accent)' : 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  position: 'relative',
                  transition: 'background 0.2s',
                  cursor: 'pointer',
                }}
                onClick={() => update('isPublic', !form.isPublic)}
              >
                <div style={{
                  position: 'absolute',
                  top: 2, left: form.isPublic ? 20 : 2,
                  width: 18, height: 18,
                  borderRadius: '50%',
                  background: 'white',
                  transition: 'left 0.2s',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                }} />
              </div>
            </label>
          </div>

          {/* Form fields */}
          <Section label="💡 Concept / Goal">
            <textarea
              className="field"
              rows={3}
              value={form.concept}
              onChange={e => update('concept', e.target.value)}
              placeholder="What is this project trying to solve or build?"
            />
          </Section>

          <Section label="🛠 Tech Stack (comma separated)">
            <input
              className="field"
              value={techInput}
              onChange={e => setTechInput(e.target.value)}
              placeholder="React, Node.js, Firebase, Tailwind…"
            />
            {techInput && (
              <div className="flex flex-wrap gap-1 mt-2">
                {parseTagInput(techInput).map(t => <span key={t} className="tag">{t}</span>)}
              </div>
            )}
          </Section>

          <Section label="🎯 Milestones">
            <MilestoneEditor
              milestones={form.milestones}
              onChange={ms => update('milestones', ms)}
            />
          </Section>

          <Section label="🚧 Blockers">
            <textarea
              className="field"
              rows={2}
              value={form.blockers}
              onChange={e => update('blockers', e.target.value)}
              placeholder="What's blocking progress?"
            />
          </Section>

          <Section label="⚡ Next Steps">
            <textarea
              className="field"
              rows={2}
              value={form.nextSteps}
              onChange={e => update('nextSteps', e.target.value)}
              placeholder="What should be done next?"
            />
          </Section>

          <Section label="💻 Code Snippet">
            <textarea
              className="field"
              style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem' }}
              rows={6}
              value={form.codeSnippet}
              onChange={e => update('codeSnippet', e.target.value)}
              placeholder="Paste a relevant code snippet…"
            />
          </Section>

          <Section label="🔗 Links (one per line)">
            <textarea
              className="field"
              rows={3}
              value={linksInput}
              onChange={e => setLinksInput(e.target.value)}
              placeholder="https://github.com/…&#10;https://docs.example.com/…"
            />
          </Section>

          {/* Color picker */}
          <Section label="🎨 Bubble color">
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.color.startsWith('hsl') ? '#7c3aed' : form.color}
                onChange={e => update('color', e.target.value)}
                style={{ width: 44, height: 36, borderRadius: 8, border: '1px solid var(--border)', cursor: 'pointer', background: 'none', padding: 2 }}
              />
              <div className="flex gap-2">
                {['#7c3aed','#06b6d4','#ec4899','#f59e0b','#22c55e','#ef4444','#8b5cf6','#0ea5e9'].map(c => (
                  <div
                    key={c}
                    onClick={() => update('color', c)}
                    style={{
                      width: 22, height: 22, borderRadius: '50%',
                      background: c, cursor: 'pointer',
                      border: form.color === c ? '2px solid white' : '2px solid transparent',
                      transform: form.color === c ? 'scale(1.2)' : 'scale(1)',
                      transition: 'transform 0.15s',
                    }}
                  />
                ))}
              </div>
            </div>
          </Section>

          {/* Action bar */}
          <div
            className="fixed bottom-0 flex gap-2 p-4"
            style={{
              width: 'min(520px, 100vw)',
              background: 'linear-gradient(to top, #10101e 70%, transparent)',
              zIndex: 10,
            }}
          >
            <button id="save-project-btn" className="btn-primary flex-1" onClick={handleSave} disabled={saving}>
              {saving ? '…' : '💾 Save'}
            </button>
            <button className="btn-ghost" onClick={copyForAI} title="Copy AI summary">📋</button>
            {form.isPublic && (
              <button className="btn-ghost" onClick={copyShareLink} title="Copy share link">🔗</button>
            )}
            <button className="btn-danger" onClick={() => onDelete(project.id)} title="Delete project">🗑</button>
          </div>
        </div>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
