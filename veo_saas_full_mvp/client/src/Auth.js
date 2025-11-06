import React, { useEffect, useState } from 'react';
import { auth } from '../firebaseClient';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from 'firebase/auth';

const provider = new GoogleAuthProvider();

export default function Auth({ onUser }) {
  const [user, setUser] = useState(null);

  useEffect(() => onAuthStateChanged(auth, u => { setUser(u); onUser && onUser(u); }), []);

  async function login() {
    await signInWithPopup(auth, provider);
  }
  async function logout() { await signOut(auth); }

  if (!user) return <button onClick={login}>Sign in with Google</button>;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <img src={user.photoURL} width={36} style={{ borderRadius: 18 }} />
      <span>{user.displayName}</span>
      <button onClick={logout}>Sign out</button>
    </div>
  );
}
