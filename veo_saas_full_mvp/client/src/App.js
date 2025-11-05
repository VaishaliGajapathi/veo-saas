import React, { useState } from 'react';
import Auth from './components/Auth';
import GenerateForm from './components/GenerateForm';
import Dashboard from './components/Dashboard';

export default function App() {
  const [user, setUser] = useState(null);
  return (
    <div style={{ padding: 20 }}>
      <h1>Veo SaaS — Full MVP</h1>
      <Auth onUser={setUser} />
      {user && (
        <div>
          <GenerateForm onCreated={() => { /* refresh */ }} />
          <Dashboard />
        </div>
      )}
    </div>
  );
}
