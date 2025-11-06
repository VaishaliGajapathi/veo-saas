import React, { useState } from 'react';
import axios from 'axios';
import { getAuth } from 'firebase/auth';

export default function GenerateForm({ onCreated }) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  async function handleGenerate() {
    try {
      setLoading(true);
      setStatus('Sending request...');
      const idToken = await getAuth().currentUser.getIdToken();
      const r = await axios.post(process.env.REACT_APP_API_BASE + '/api/generate', { idToken, prompt, aspectRatio: '16:9', durationSeconds: 4 });
      const { videoId, operationName } = r.data;
      setStatus('Queued. Polling for completion...');

      let done = false;
      let attempts = 0;
      while (!done && attempts < 40) {
        attempts++;
        await new Promise(r => setTimeout(r, 5000));
        const chk = await axios.post(process.env.REACT_APP_API_BASE + '/api/check', { idToken, operationName, videoId });
        if (chk.data.done) {
          done = true;
          if (chk.data.success) {
            setStatus('Video ready!');
            onCreated && onCreated();
          } else {
            setStatus('Generation failed.');
          }
        } else {
          setStatus('Still generating...');
        }
      }
      if (!done) setStatus('Timed out — check My Videos later.');
    } catch (e) {
      console.error(e);
      setStatus('Error: ' + (e.response?.data?.error || e.message));
    } finally { setLoading(false); }
  }

  return (
    <div style={{ marginTop: 12 }}>
      <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={4} cols={60} placeholder="Describe the short video you'd like..." />
      <br />
      <button onClick={handleGenerate} disabled={loading || !prompt}>Generate Video (1 credit)</button>
      <p>{status}</p>
    </div>
  );
}
