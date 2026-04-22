// src/components/ImportProjectModal.jsx
import React, { useState, useRef } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';

/* ─── Constants ─── */

const FOLDER_EXTENSIONS = new Set([
  'js','jsx','ts','tsx','py','html','css','json',
  'md','txt','yaml','yml','toml','sh','env',
]);

const SKIP_DIRS = new Set([
  'node_modules','.git','dist','build','__pycache__',
  '.next','.nuxt','coverage','.cache','vendor','venv',
  '.venv','env','.env','out','.output','target',
]);

const ACCEPTED_SINGLE = '.txt,.md,.js,.ts,.jsx,.tsx,.py,.html,.css,.json,.yaml,.yml,.env.example';

/* ═══════════════════════════════════════════════
   Folder reading utilities
═══════════════════════════════════════════════ */
function shouldSkipPath(relativePath) {
  return relativePath.split('/').some(seg => SKIP_DIRS.has(seg.toLowerCase()));
}
function getExtension(name) {
  const dot = name.lastIndexOf('.');
  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : '';
}
function getFileLimit(name) {
  const ln = name.toLowerCase();
  if (ln.startsWith('readme')) return 800;
  if (/^(package\.json|requirements\.txt|pyproject\.toml|cargo\.toml)$/.test(ln)) return 400;
  if (/^(main\.|index\.|app\.|server\.)/.test(ln)) return 400;
  return 0;
}
function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = e  => resolve(e.target.result);
    reader.onerror = () => reject(new Error(`Cannot read ${file.name}`));
    reader.readAsText(file);
  });
}

async function processFolderFiles(fileList, onProgress) {
  const allFiles = Array.from(fileList);
  const relevant = allFiles.filter(f => {
    const rel  = f.webkitRelativePath || f.name;
    return !shouldSkipPath(rel);
  });

  const fileCount = relevant.length;
  onProgress?.(fileCount, fileCount);

  const folderName = relevant[0] && relevant[0].webkitRelativePath ? relevant[0].webkitRelativePath.split('/')[0] : 'Project';
  
  const extensions = new Set();
  const fileNames = [];
  for (const f of relevant) {
    fileNames.push(f.name);
    const ext = getExtension(f.name);
    if (ext) extensions.add(ext);
  }
  const stack = Array.from(extensions).join(', ');
  const fileListStr = fileNames.slice(0, 100).join(', ') + (fileNames.length > 100 ? '...' : '');

  const prompt = `Return ONLY valid JSON, no other text:
{"name":"X","concept":"X","type":"X","techStack":["X"],"milestones":["X"],"blockers":"X","nextSteps":"X","progressReport":"X","aiPrompt":"X"}
Project: ${folderName}. Files: ${fileListStr}. Stack clues: ${stack}.`;

  return { prompt, fileCount, readCount: fileCount, tree: '' };
}

function buildFileTree(paths) {
  const sorted = [...paths].sort();
  const lines  = [];
  const seen   = new Set();
  for (const path of sorted) {
    const parts = path.split('/');
    for (let i = 0; i < parts.length; i++) {
      const key = parts.slice(0, i + 1).join('/');
      if (!seen.has(key)) {
        seen.add(key);
        const indent = '  '.repeat(i);
        const isFile = i === parts.length - 1;
        lines.push(`${indent}${isFile ? '📄 ' : '📁 '}${parts[i]}`);
      }
    }
  }
  return lines.join('\n');
}

/* ═══════════════════════════════════════════════
   Gemini prompts  (now include progressReport)
═══════════════════════════════════════════════ */
const JSON_SCHEMA = `{"name":"","concept":"","type":"","techStack":[],"milestones":[],"blockers":"","nextSteps":"","progressReport":"","aiPrompt":""}`;

const SINGLE_FILE_PROMPT = `Analyze the provided content and extract project information.

Return ONLY this JSON with short values:
${JSON_SCHEMA}
Keep every string under 100 characters. Arrays max 3 items.`;

const FOLDER_PROMPT = `Analyze this project folder and extract project details.

Return ONLY this JSON with short values:
${JSON_SCHEMA}
Keep every string under 100 characters. Arrays max 3 items.`;

/* ═══════════════════════════════════════════════
   Generate the ready-to-paste AI prompt (client-side)
═══════════════════════════════════════════════ */
function generateAiPrompt(data) {
  const done    = (data.milestones || []).filter(m => m.done).map(m => `• ${m.text}`).join('\n') || '• (none listed)';
  const pending = (data.milestones || []).filter(m => !m.done).map(m => `• ${m.text}`).join('\n') || '• (none listed)';
  const stack   = Array.isArray(data.techStack) ? data.techStack.join(', ') : data.techStack;
  const firstNext = (data.nextSteps || '').split(/[.\n]/)[0].trim() || data.nextSteps;

  return `Here is my project context. Please help me continue building it.

PROJECT: ${data.name}
WHAT IT DOES: ${data.concept}
TECH STACK: ${stack}

WHAT'S DONE:
${done}

WHAT'S BROKEN/MISSING:
${data.blockers || '(nothing noted)'}

PENDING MILESTONES:
${pending}

NEXT STEP I WANT TO WORK ON: ${firstNext}

Please start by helping me with the next step above.`;
}

/* ═══════════════════════════════════════════════
   Gemini API call
═══════════════════════════════════════════════ */
const callGemini = async (prompt) => {
  const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.1,
    }
  });

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  console.log('FULL RESPONSE:', text);
  const parsed = JSON.parse(text); // SDK with responseMimeType guarantees valid JSON
  return parsed;
};


/* ═══════════════════════════════════════════════
   Shared sub-components
═══════════════════════════════════════════════ */
function TagChips({ items }) {
  if (!items?.length) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {items.map((t, i) => <span key={i} className="tag">{t}</span>)}
    </div>
  );
}

function FolderFilesBadge({ files }) {
  const counts = {};
  for (const f of files) {
    const rel = f.webkitRelativePath || f.name;
    if (shouldSkipPath(rel)) continue;
    const ext = getExtension(f.name) || 'other';
    counts[ext] = (counts[ext] || 0) + 1;
  }
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  if (!top.length) return null;
  return (
    <div className="flex flex-wrap gap-1 justify-center mt-3">
      {top.map(([ext, n]) => (
        <span key={ext} className="tag" style={{ fontSize: '0.7rem' }}>.{ext} ×{n}</span>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Step 1 — Input
═══════════════════════════════════════════════ */
function InputStep({ onAnalyzeText, onAnalyzeFolder }) {
  const [tab, setTab]               = useState('paste');
  const [text, setText]             = useState('');
  const [fileName, setFileName]     = useState('');
  const [folderName, setFolderName] = useState('');
  const [folderFiles, setFolderFiles] = useState(null);
  const [error, setError]           = useState('');
  const fileRef   = useRef(null);
  const folderRef = useRef(null);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload  = ev => { setText(ev.target.result); setError(''); };
    reader.onerror = ()  => setError('Could not read file. Try a different file.');
    reader.readAsText(file);
  };

  const handleFolder = (e) => {
    const files = e.target.files;
    if (!files?.length) return;
    const firstPath = files[0].webkitRelativePath || '';
    setFolderName(firstPath.split('/')[0] || 'Project');
    setFolderFiles(files);
    setError('');
  };

  const handleAnalyze = () => {
    if (tab === 'folder') {
      if (!folderFiles?.length) { setError('Please select a project folder first.'); return; }
      setError('');
      onAnalyzeFolder(folderFiles);
    } else {
      if (!text.trim()) { setError('Please paste some text or upload a file first.'); return; }
      setError('');
      onAnalyzeText(text);
    }
  };

  const hasContent = tab === 'folder' ? !!folderFiles?.length : !!text.trim();

  return (
    <div>
      {/* 3 tabs */}
      <div className="import-tabs">
        <button className={`import-tab ${tab === 'paste'  ? 'active' : ''}`} onClick={() => setTab('paste')}  id="import-tab-paste">📋 Paste</button>
        <button className={`import-tab ${tab === 'file'   ? 'active' : ''}`} onClick={() => setTab('file')}   id="import-tab-file">📄 File</button>
        <button className={`import-tab ${tab === 'folder' ? 'active' : ''}`} onClick={() => setTab('folder')} id="import-tab-folder">📁 Folder</button>
      </div>

      {/* Paste */}
      {tab === 'paste' && (
        <textarea
          className="field"
          rows={12}
          value={text}
          onChange={e => { setText(e.target.value); setError(''); }}
          placeholder={`Paste anything — code, README, architecture notes…\n\n• Full contents of your README.md\n• A main.py or index.js file\n• Meeting notes or feature list`}
          style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', minHeight: 240 }}
          id="import-paste-textarea"
        />
      )}

      {/* Single file */}
      {tab === 'file' && (
        <div>
          <p style={{ color: 'var(--text-3)', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
            Upload one file — code, README, notes, or JSON.
          </p>
          <div
            className="import-dropzone"
            onClick={() => fileRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => {
              e.preventDefault();
              const file = e.dataTransfer.files[0];
              if (file) { setFileName(file.name); const r = new FileReader(); r.onload = ev => setText(ev.target.result); r.readAsText(file); }
            }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📄</div>
            {fileName ? (
              <><div style={{ color: 'var(--accent-2)', fontWeight: 600 }}>✓ {fileName}</div><div style={{ color: 'var(--text-3)', fontSize: '0.75rem', marginTop: 4 }}>{text.length.toLocaleString()} chars — click to change</div></>
            ) : (
              <><div style={{ color: 'var(--text-2)', fontWeight: 500 }}>Click to browse or drag & drop</div><div style={{ color: 'var(--text-3)', fontSize: '0.75rem', marginTop: 4 }}>.txt .md .js .ts .jsx .tsx .py .html .css .json .yaml</div></>
            )}
          </div>
          <input ref={fileRef} type="file" accept={ACCEPTED_SINGLE} onChange={handleFile} style={{ display: 'none' }} id="import-file-input" />
        </div>
      )}

      {/* Folder */}
      {tab === 'folder' && (
        <div>
          <p style={{ color: 'var(--text-3)', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
            Select your entire project folder. <code style={{ color: 'var(--accent-2)', fontSize: '0.75rem' }}>node_modules</code>, <code style={{ color: 'var(--accent-2)', fontSize: '0.75rem' }}>.git</code> and build dirs are skipped automatically.
          </p>
          <div className="import-dropzone import-dropzone--folder" onClick={() => folderRef.current?.click()}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📂</div>
            {folderName ? (
              <>
                <div style={{ color: 'var(--accent-2)', fontWeight: 700, fontSize: '1rem' }}>✓ {folderName}/</div>
                <div style={{ color: 'var(--text-3)', fontSize: '0.75rem', marginTop: 6 }}>{folderFiles.length} total files found — click to change</div>
                <FolderFilesBadge files={folderFiles} />
              </>
            ) : (
              <>
                <div style={{ color: 'var(--text-2)', fontWeight: 600, fontSize: '1rem' }}>Click to select project folder</div>
                <div style={{ color: 'var(--text-3)', fontSize: '0.75rem', marginTop: 6, lineHeight: 1.6 }}>
                  Reads .js .jsx .ts .tsx .py .html .css .json .md .txt .yaml<br />
                  Skips node_modules, .git, dist, build, __pycache__
                </div>
              </>
            )}
          </div>
          <input ref={folderRef} type="file" webkitdirectory="" mozdirectory="" multiple onChange={handleFolder} style={{ display: 'none' }} id="import-folder-input" />
        </div>
      )}

      {error && <div className="import-error">{error}</div>}

      <button
        id="import-analyze-btn"
        className="btn-primary"
        style={{ width: '100%', marginTop: '1.25rem', justifyContent: 'center', fontSize: '1rem', padding: '0.9rem' }}
        onClick={handleAnalyze}
        disabled={!hasContent}
      >
        <span style={{ fontSize: '1.2rem' }}>✦</span>
        {tab === 'folder' ? 'Analyze Entire Folder with Gemini' : 'Analyze with Gemini AI'}
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Step 2 — Loading
═══════════════════════════════════════════════ */
function LoadingStep({ fileStatus }) {
  return (
    <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
      <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto 1.5rem' }}>
        <div className="spinner" style={{ width: 80, height: 80, borderWidth: 4 }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem' }}>✦</div>
      </div>

      <h3 style={{ color: 'var(--text-1)', fontWeight: 700, marginBottom: '0.5rem' }}>
        {fileStatus ? 'Reading project files…' : 'Analyzing your project…'}
      </h3>

      {fileStatus ? (
        <div>
          <p style={{ color: 'var(--text-3)', fontSize: '0.875rem', marginBottom: '0.75rem' }}>{fileStatus.message}</p>
          {fileStatus.total > 0 && (
            <div style={{ maxWidth: 280, margin: '0 auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: 'var(--text-3)', fontSize: '0.75rem' }}>{fileStatus.read} / {fileStatus.total} files</span>
                <span style={{ color: 'var(--accent-2)', fontSize: '0.75rem' }}>{Math.round((fileStatus.read / fileStatus.total) * 100)}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-bar__fill" style={{ width: `${(fileStatus.read / fileStatus.total) * 100}%`, transition: 'width 0.3s ease' }} />
              </div>
            </div>
          )}
        </div>
      ) : (
        <p style={{ color: 'var(--text-3)', fontSize: '0.875rem' }}>Gemini is reading your content and extracting project details</p>
      )}

      <div className="import-loading-dots"><span /><span /><span /></div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Step 3 — Review & Edit
═══════════════════════════════════════════════ */
function ReviewStep({ extracted, onNext, onBack }) {
  const [form, setForm] = useState({
    name:        extracted.name        || '',
    concept:     extracted.concept     || '',
    type:        extracted.type        || 'Other',
    techStack:   (extracted.techStack  || []).join(', '),
    milestones:  extracted.milestones  || [],
    blockers:    extracted.blockers    || '',
    nextSteps:   extracted.nextSteps   || '',
    color:       '#7c3aed',
  });
  const [msDraft, setMsDraft] = useState('');

  const update          = (field, val) => setForm(f => ({ ...f, [field]: val }));
  const addMilestone    = (t) => { if (!t.trim()) return; update('milestones', [...form.milestones, { text: t.trim(), done: false }]); };
  const toggleMilestone = (i) => update('milestones', form.milestones.map((m, idx) => idx === i ? { ...m, done: !m.done } : m));
  const removeMilestone = (i) => update('milestones', form.milestones.filter((_, idx) => idx !== i));

  const handleNext = () => {
    const techArray = form.techStack.split(/[,\n]+/).map(t => t.trim()).filter(Boolean);
    onNext({ ...form, techStack: techArray });
  };

  const PROJECT_TYPES = ['Web App','Mobile App','API/Backend','CLI Tool','Library','Data Science','Machine Learning','Game','Other'];

  return (
    <div>
      <div style={{ padding: '0.75rem 1rem', borderRadius: '0.75rem', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.875rem', color: 'var(--success)' }}>
        <span style={{ fontSize: '1.1rem' }}>✓</span>
        AI extracted your project details — review and edit before continuing.
      </div>

      {/* Name + Type */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <label className="field-label">Project Name</label>
          <input className="field" value={form.name} onChange={e => update('name', e.target.value)} placeholder="Project name" id="review-name-input" />
        </div>
        <div>
          <label className="field-label">Project Type</label>
          <select className="field" value={form.type} onChange={e => update('type', e.target.value)} id="review-type-select" style={{ cursor: 'pointer' }}>
            {PROJECT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {/* Concept */}
      <div style={{ marginBottom: '1rem' }}>
        <label className="field-label">💡 Concept / Goal</label>
        <textarea className="field" rows={3} value={form.concept} onChange={e => update('concept', e.target.value)} placeholder="What does this project do?" />
      </div>

      {/* Tech Stack */}
      <div style={{ marginBottom: '1rem' }}>
        <label className="field-label">🛠 Tech Stack (comma separated)</label>
        <input className="field" value={form.techStack} onChange={e => update('techStack', e.target.value)} placeholder="React, Node.js, Firebase…" />
        <TagChips items={form.techStack.split(/[,\n]+/).map(t => t.trim()).filter(Boolean)} />
      </div>

      {/* Milestones */}
      <div style={{ marginBottom: '1rem' }}>
        <label className="field-label">🎯 Milestones</label>
        <div style={{ marginBottom: '0.5rem' }}>
          {form.milestones.map((m, i) => (
            <div key={i} className="milestone-row">
              <input type="checkbox" checked={m.done} onChange={() => toggleMilestone(i)} />
              <span style={{ flex: 1, fontSize: '0.875rem', color: m.done ? 'var(--text-3)' : 'var(--text-1)', textDecoration: m.done ? 'line-through' : 'none' }}>{m.text}</span>
              <button type="button" onClick={() => removeMilestone(i)} style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}>×</button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input className="field flex-1" value={msDraft} onChange={e => setMsDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addMilestone(msDraft); setMsDraft(''); } }}
            placeholder="Add milestone… (Enter)" />
          <button type="button" className="btn-ghost" onClick={() => { addMilestone(msDraft); setMsDraft(''); }}>Add</button>
        </div>
      </div>

      {/* Blockers */}
      <div style={{ marginBottom: '1rem' }}>
        <label className="field-label">🚧 Blockers</label>
        <textarea className="field" rows={2} value={form.blockers} onChange={e => update('blockers', e.target.value)} placeholder="What's blocking progress?" />
      </div>

      {/* Next Steps */}
      <div style={{ marginBottom: '1rem' }}>
        <label className="field-label">⚡ Next Steps</label>
        <textarea className="field" rows={2} value={form.nextSteps} onChange={e => update('nextSteps', e.target.value)} placeholder="What should be done next?" />
      </div>

      {/* Bubble color */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label className="field-label">🎨 Bubble Color</label>
        <div className="flex items-center gap-3 mt-1">
          <input type="color" value={form.color.startsWith('hsl') ? '#7c3aed' : form.color} onChange={e => update('color', e.target.value)} style={{ width: 44, height: 36, borderRadius: 8, border: '1px solid var(--border)', cursor: 'pointer', background: 'none', padding: 2 }} />
          <div className="flex gap-2">
            {['#7c3aed','#06b6d4','#ec4899','#f59e0b','#22c55e','#ef4444','#8b5cf6','#0ea5e9'].map(c => (
              <div key={c} onClick={() => update('color', c)} style={{ width: 22, height: 22, borderRadius: '50%', background: c, cursor: 'pointer', border: form.color === c ? '2px solid white' : '2px solid transparent', transform: form.color === c ? 'scale(1.2)' : 'scale(1)', transition: 'transform 0.15s' }} />
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button className="btn-ghost" onClick={onBack} style={{ flexShrink: 0 }}>← Back</button>
        <button
          id="review-next-btn"
          className="btn-primary flex-1"
          style={{ justifyContent: 'center' }}
          onClick={handleNext}
          disabled={!form.name.trim()}
        >
          View Project Report →
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Step 4 — Project Report
═══════════════════════════════════════════════ */
function ReportStep({ formData, progressReport, sourceSummary, onSave, onBack, saving }) {
  const aiPrompt          = generateAiPrompt(formData);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(aiPrompt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const done    = (formData.milestones || []).filter(m => m.done);
  const pending = (formData.milestones || []).filter(m => !m.done);
  const pct     = formData.milestones?.length
    ? Math.round((done.length / formData.milestones.length) * 100)
    : 0;

  return (
    <div>
      {/* Source info */}
      {sourceSummary && (
        <div style={{ padding: '0.5rem 1rem', borderRadius: '0.65rem', background: 'rgba(6,182,212,0.07)', border: '1px solid rgba(6,182,212,0.15)', marginBottom: '1.25rem', fontSize: '0.78rem', color: 'var(--text-3)' }}>
          📂 Analyzed <strong style={{ color: 'var(--accent-2)' }}>{sourceSummary.readCount}</strong> of{' '}
          <strong style={{ color: 'var(--accent-2)' }}>{sourceSummary.fileCount}</strong> files found
        </div>
      )}

      {/* ── Progress Report card ── */}
      <div className="report-card">
        <div className="report-card__header">
          <span>📊</span>
          <span>Progress Report</span>
          {/* Completion ring */}
          <div className="report-progress-ring">
            <svg viewBox="0 0 36 36" width="48" height="48">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15.9" fill="none"
                stroke="url(#ringGrad)" strokeWidth="3"
                strokeDasharray={`${pct} ${100 - pct}`}
                strokeDashoffset="25"
                strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 0.8s ease' }}
              />
              <defs>
                <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%"   stopColor="#7c3aed" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
              <text x="18" y="21" textAnchor="middle" fontSize="9" fontWeight="bold" fill="white">{pct}%</text>
            </svg>
          </div>
        </div>

        {/* Milestone summary pills */}
        <div className="flex gap-3 mb-4" style={{ flexWrap: 'wrap' }}>
          <div className="report-pill report-pill--done">✓ {done.length} done</div>
          <div className="report-pill report-pill--pending">⏳ {pending.length} pending</div>
          {formData.type && <div className="report-pill">{formData.type}</div>}
        </div>

        {/* AI progress text */}
        {progressReport ? (
          <p style={{ color: 'var(--text-2)', fontSize: '0.9rem', lineHeight: 1.7, margin: 0 }}>
            {progressReport}
          </p>
        ) : (
          <div>
            {done.length > 0 && (
              <div style={{ marginBottom: '0.75rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>✓ What's built</div>
                {done.map((m, i) => <div key={i} style={{ fontSize: '0.875rem', color: 'var(--text-2)', paddingLeft: '0.75rem' }}>• {m.text}</div>)}
              </div>
            )}
            {pending.length > 0 && (
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--warning)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>⏳ Still needed</div>
                {pending.map((m, i) => <div key={i} style={{ fontSize: '0.875rem', color: 'var(--text-2)', paddingLeft: '0.75rem' }}>• {m.text}</div>)}
              </div>
            )}
          </div>
        )}

        {/* Next steps callout */}
        {formData.nextSteps && (
          <div className="report-next-steps">
            <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent-2)', marginBottom: '0.4rem' }}>⚡ Next Steps</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-1)', lineHeight: 1.6 }}>{formData.nextSteps}</div>
          </div>
        )}
      </div>

      {/* ── AI Prompt card ── */}
      <div className="report-card" style={{ marginTop: '1rem' }}>
        <div className="report-card__header">
          <span>🤖</span>
          <span>Ready-to-use AI Prompt</span>
          <button
            id="copy-ai-prompt-btn"
            className={`report-copy-btn ${copied ? 'copied' : ''}`}
            onClick={handleCopy}
          >
            {copied ? '✓ Copied!' : '📋 Copy'}
          </button>
        </div>
        <p style={{ color: 'var(--text-3)', fontSize: '0.78rem', marginBottom: '0.75rem', marginTop: 0 }}>
          Paste this into ChatGPT, Gemini, or any AI to continue building your project.
        </p>
        <pre className="ai-prompt-box" id="ai-prompt-text">{aiPrompt}</pre>
      </div>

      {/* Actions */}
      <div className="flex gap-3" style={{ marginTop: '1.25rem' }}>
        <button className="btn-ghost" onClick={onBack} style={{ flexShrink: 0 }} disabled={saving}>← Edit</button>
        <button
          id="import-save-btn"
          className="btn-primary flex-1"
          style={{ justifyContent: 'center' }}
          onClick={onSave}
          disabled={saving}
        >
          {saving
            ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2, flexShrink: 0 }} /> Saving…</>
            : <><span style={{ fontSize: '1.1rem' }}>⬆</span> Save & Continue</>
          }
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Main Modal
═══════════════════════════════════════════════ */
export default function ImportProjectModal({ onImport, onClose }) {
  // step: 'input' | 'loading' | 'review' | 'report' | 'error'
  const [step, setStep]               = useState('input');
  const [extracted, setExtracted]     = useState(null);
  const [reviewedData, setReviewedData] = useState(null);
  const [progressReport, setProgressReport] = useState('');
  const [apiError, setApiError]       = useState('');
  const [saving, setSaving]           = useState(false);
  const [fileStatus, setFileStatus]   = useState(null);
  const [sourceSummary, setSourceSummary] = useState(null);

  /* Single file / paste */
  const analyzeText = async (text) => {
    setFileStatus(null);
    setStep('loading');
    try {
      const parsed = await callGemini(
        `${SINGLE_FILE_PROMPT}\n\n---\n\nANALYZE THIS PROJECT CONTENT:\n\n${text.slice(0, 15_000)}`
      );
      setExtracted(parsed);
      setProgressReport(parsed.progressReport || '');
      setSourceSummary(null);
      setStep('review');
    } catch (err) {
      console.error('Gemini error:', err);
      setApiError(err.message || 'Unknown error');
      setStep('error');
    }
  };

  /* Folder */
  const analyzeFolder = async (fileList) => {
    setStep('loading');
    setFileStatus({ message: 'Scanning folder…', read: 0, total: 0 });
    try {
      const { prompt, fileCount, readCount } = await processFolderFiles(
        fileList,
        (read, total) => setFileStatus({ message: `Reading ${total} files…`, read, total })
      );
      setFileStatus({ message: 'Sending to Gemini AI…', read: fileCount, total: fileCount });
      const parsed = await callGemini(prompt);
      setExtracted(parsed);
      setProgressReport(parsed.progressReport || '');
      setSourceSummary({ fileCount, readCount });
      setStep('review');
    } catch (err) {
      console.error('Folder import error:', err);
      setApiError(err.message || 'Unknown error');
      setStep('error');
    }
  };

  /* Review → Report */
  const handleReviewNext = (formData) => {
    setReviewedData(formData);
    setStep('report');
  };

  /* Report → Save */
  const handleSave = async () => {
    setSaving(true);
    try {
      await onImport(reviewedData);
      onClose();
    } catch (err) {
      console.error('Save error:', err);
      setSaving(false);
    }
  };

  /* Step labels */
  const STEPS = ['input', 'review', 'report'];
  const STEP_LABELS = ['Input', 'Review', 'Report'];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={e => e.stopPropagation()} style={{ width: 'min(600px, 100vw)' }}>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 style={{ fontWeight: 800, fontSize: '1.25rem', marginBottom: '0.2rem' }}>
              <span style={{ background: 'linear-gradient(135deg,#7c3aed,#06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                ⬆ Import Project
              </span>
            </h2>
            <p style={{ color: 'var(--text-3)', fontSize: '0.8rem', margin: 0 }}>
              {step === 'input'   && 'Paste, upload a file, or scan an entire project folder'}
              {step === 'loading' && 'Gemini AI is analyzing your content…'}
              {step === 'review'  && 'Review and edit the extracted fields'}
              {step === 'report'  && 'Your project report & ready-to-use AI prompt'}
              {step === 'error'   && 'Something went wrong — check the error below'}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: '1.5rem', lineHeight: 1, flexShrink: 0 }}>✕</button>
        </div>

        {/* Step indicator (3 dots) */}
        {step !== 'loading' && step !== 'error' && (
          <div className="import-steps">
            {STEPS.map((s, i) => {
              const stepIdx   = STEPS.indexOf(step);
              const isDone    = i < stepIdx;
              const isActive  = s === step;
              return (
                <React.Fragment key={s}>
                  <div className={`import-step-dot ${isDone ? 'done' : ''} ${isActive ? 'active' : ''}`}>
                    {isDone ? '✓' : i + 1}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className="import-step-line" style={{ background: isDone ? 'rgba(34,197,94,0.4)' : 'var(--border)' }} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}

        {/* Steps */}
        {step === 'input'  && <InputStep  onAnalyzeText={analyzeText} onAnalyzeFolder={analyzeFolder} />}
        {step === 'loading' && <LoadingStep fileStatus={fileStatus} />}
        {step === 'review'  && (
          <ReviewStep
            extracted={extracted}
            onNext={handleReviewNext}
            onBack={() => { setStep('input'); setFileStatus(null); }}
          />
        )}
        {step === 'report' && (
          <ReportStep
            formData={reviewedData}
            progressReport={progressReport}
            sourceSummary={sourceSummary}
            onSave={handleSave}
            onBack={() => setStep('review')}
            saving={saving}
          />
        )}
        {step === 'error' && (
          <div>
            <div className="import-error" style={{ padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
              <strong>❌ Analysis failed</strong><br />{apiError}
            </div>
            <p style={{ color: 'var(--text-3)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Make sure your <code style={{ color: 'var(--accent-2)' }}>VITE_GEMINI_API_KEY</code> is set in your <code style={{ color: 'var(--accent-2)' }}>.env</code> file and restart the dev server.
            </p>
            <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => { setApiError(''); setStep('input'); }}>
              ← Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
