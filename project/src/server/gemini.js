// server/gemini.js
import axios from 'axios';

const BASE = 'https://generativelanguage.googleapis.com/v1beta';
const MODEL = 'models/veo-3.1';

export async function createVideo(apiKey, payload) {
  const url = `${BASE}/${MODEL}:generateVideo?key=${apiKey}`;
  const r = await axios.post(url, payload, { timeout: 120000 });
  return r.data;
}

export async function getOperation(apiKey, operationName) {
  const url = `${BASE}/${operationName}?key=${apiKey}`;
  const r = await axios.get(url, { timeout: 60000 });
  return r.data;
}
