// src/hooks/useProjects.js
import { useState, useEffect } from 'react';
import {
  collection, onSnapshot, addDoc, updateDoc,
  deleteDoc, doc, serverTimestamp, query, orderBy,
  setDoc,
} from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Real-time Firestore listener for /users/{uid}/projects.
 * Returns CRUD helpers backed by Firestore so data persists across devices.
 */
export function useProjects(uid) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!uid) { setProjects([]); setLoading(false); return; }

    const col = collection(db, 'users', uid, 'projects');
    const q   = query(col, orderBy('createdAt', 'asc'));

    const unsub = onSnapshot(q, (snap) => {
      setProjects(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    return unsub;
  }, [uid]);

  const projectsRef = (id) =>
    id ? doc(db, 'users', uid, 'projects', id)
       : collection(db, 'users', uid, 'projects');

  const addProject = (data) =>
    addDoc(projectsRef(), {
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
      createdAt:   serverTimestamp(),
      updatedAt:   serverTimestamp(),
      ...data,
    });

  const updateProject = async (id, data) => {
    await updateDoc(projectsRef(id), { ...data, updatedAt: serverTimestamp() });

    // Mirror to publicProjects so share links work without exposing uid
    const pubRef = doc(db, 'publicProjects', id);
    if (data.isPublic) {
      await setDoc(pubRef, { ...data, uid, updatedAt: serverTimestamp() }, { merge: true });
    } else {
      // Remove from public if toggled off (best-effort)
      try { await deleteDoc(pubRef); } catch (_) {}
    }
  };

  const deleteProject = (id) => deleteDoc(projectsRef(id));

  return { projects, loading, addProject, updateProject, deleteProject };
}

function randomHsl() {
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue}, 70%, 55%)`;
}
