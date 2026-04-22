// src/hooks/useAuth.js
import { useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut as fbSignOut } from 'firebase/auth';
import { auth, provider } from '../firebase';

export function useAuth() {
  const [user, setUser]     = useState(undefined); // undefined = loading
  const [error, setError]   = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u ?? null));
    return unsub;
  }, []);

  const signIn = async () => {
    setError(null);
    try {
      await signInWithPopup(auth, provider);
    } catch (e) {
      setError(e.message);
    }
  };

  const signOut = () => fbSignOut(auth);

  return { user, loading: user === undefined, error, signIn, signOut };
}
