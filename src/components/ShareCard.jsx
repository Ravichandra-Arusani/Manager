// src/components/ShareCard.jsx
import React, { useState } from 'react';

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

function ProgressBar({ milestones }) {
  const done = milestones.filter(m => m.done).length;
  const pct  = milestones.length ? Math.round((done / milestones.length) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between mb-1" style={{ fontSize: '0.78rem', color: 'var(--text-2)' }}>
        <span>Progress</span>
        <span style={{ color: 'var(--accent-2, #06b6d4)' }}>{done}/{milestones.length} · {pct}%</span>
      </div>
      <div className="progress-bar">
        <div className="progress-bar__fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function ShareCard({ project }) {
  const [copied, setCopied] = useState(false);

  const copyAI = () => {
    navigator.clipboard.writeText(buildAiSummary(project)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div className="share-card">
      {/* Header */}
      <div className="flex items-start gap-4 mb-8">
        <div
          style={{
            width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
            background: project.color || 'var(--accent)',
            boxShadow: `0 0 24px ${project.color || 'var(--accent)'}66`,
          }}
        />
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-1)', margin: 0 }}>
            {project.name}
          </h1>
          <p style={{ color: 'var(--text-2)', marginTop: '0.25rem', fontSize: '0.875rem' }}>
            Shared project overview
          </p>
        </div>
      </div>

      {/* Copy for AI — prominent */}
      <button
        id="copy-for-ai-btn"
        className="btn-primary w-full mb-8 py-3 text-base justify-center"
        onClick={copyAI}
        style={{ borderRadius: '1rem' }}
      >
        {copied ? '✅ Copied to clipboard!' : '📋 Copy for AI (full context)'}
      </button>

      {/* Tech stack */}
      {project.techStack?.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Tech Stack
          </h2>
          <div className="flex flex-wrap gap-2">
            {project.techStack.map(t => <span key={t} className="tag">{t}</span>)}
          </div>
        </section>
      )}

      {/* Concept */}
      {project.concept && (
        <section className="glass rounded-2xl p-5 mb-5">
          <h2 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            💡 Concept
          </h2>
          <p style={{ color: 'var(--text-1)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{project.concept}</p>
        </section>
      )}

      {/* Milestones */}
      {project.milestones?.length > 0 && (
        <section className="glass rounded-2xl p-5 mb-5">
          <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            🎯 Milestones
          </h2>
          <ProgressBar milestones={project.milestones} />
          <div className="mt-4 space-y-2">
            {project.milestones.map((m, i) => (
              <div key={i} className="flex items-center gap-3">
                <div style={{
                  width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                  background: m.done ? 'var(--accent)' : 'rgba(255,255,255,0.08)',
                  border: '2px solid',
                  borderColor: m.done ? 'var(--accent)' : 'rgba(255,255,255,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.65rem', color: 'white',
                }}>
                  {m.done && '✓'}
                </div>
                <span style={{
                  fontSize: '0.875rem',
                  color: m.done ? 'var(--text-3)' : 'var(--text-1)',
                  textDecoration: m.done ? 'line-through' : 'none',
                }}>{m.text}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Blockers */}
      {project.blockers && (
        <section className="glass rounded-2xl p-5 mb-5" style={{ borderColor: 'rgba(239,68,68,0.2)' }}>
          <h2 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            🚧 Blockers
          </h2>
          <p style={{ color: 'var(--text-1)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{project.blockers}</p>
        </section>
      )}

      {/* Next Steps */}
      {project.nextSteps && (
        <section className="glass rounded-2xl p-5 mb-5" style={{ borderColor: 'rgba(34,197,94,0.2)' }}>
          <h2 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            ⚡ Next Steps
          </h2>
          <p style={{ color: 'var(--text-1)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{project.nextSteps}</p>
        </section>
      )}

      {/* Code Snippet */}
      {project.codeSnippet && (
        <section className="mb-5">
          <h2 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            💻 Code Snippet
          </h2>
          <div className="code-block">
            <pre><code>{project.codeSnippet}</code></pre>
          </div>
        </section>
      )}

      {/* Links */}
      {project.links?.length > 0 && (
        <section className="glass rounded-2xl p-5 mb-5">
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            🔗 Links
          </h2>
          <div className="flex flex-col gap-2">
            {project.links.map((l, i) => (
              <a
                key={i}
                href={l}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--accent-2, #06b6d4)', fontSize: '0.875rem', wordBreak: 'break-all' }}
              >
                {l}
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <div className="text-center mt-10" style={{ color: 'var(--text-3)', fontSize: '0.78rem' }}>
        Shared via{' '}
        <span className="gradient-text font-semibold">Project Memory Manager</span>
      </div>
    </div>
  );
}
