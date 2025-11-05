import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { getAuth } from 'firebase/auth';

export default function Dashboard() {
  const [videos, setVideos] = useState([]);

  async function load() {
    const idToken = await getAuth().currentUser.getIdToken();
    const r = await axios.post(process.env.REACT_APP_API_BASE + '/api/list', { idToken });
    setVideos(r.data.items || []);
  }

  useEffect(() => { load(); }, []);

  return (
    <div style={{ marginTop: 20 }}>
      <h3>My Videos</h3>
      <button onClick={load}>Refresh</button>
      <ul>
        {videos.map(v => (
          <li key={v.id} style={{ marginBottom: 12 }}>
            <div><strong>Prompt:</strong> {v.prompt}</div>
            <div><strong>Status:</strong> {v.status}</div>
            {v.publicUrl && <video src={v.publicUrl} controls width={320} />}
          </li>
        ))}
      </ul>
    </div>
  );
}
