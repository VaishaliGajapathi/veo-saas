// server/index.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { db, admin } from './firebaseAdmin.js';
import { createVideo, getOperation } from './gemini.js';
import stripe from './stripe.js';
import {Storage} from '@google-cloud/storage';
import axios from 'axios';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' }));

const storage = new Storage();
const bucket = storage.bucket(process.env.GCS_BUCKET_NAME);

async function verifyFirebaseIdToken(idToken) {
  if (!idToken) throw new Error('No ID token');
  const decoded = await admin.auth().verifyIdToken(idToken);
  return decoded.uid;
}

async function chargeCredits(uid, creditsNeeded) {
  const ref = db.collection('users').doc(uid);
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.exists ? snap.data() : { credits: 0 };
    const credits = data.credits || 0;
    if (credits < creditsNeeded) throw new Error('Insufficient credits');
    tx.update(ref, { credits: credits - creditsNeeded });
    return true;
  });
}

app.post('/api/create-checkout-session', async (req, res) => {
  const { priceId, idToken } = req.body;
  try {
    const uid = await verifyFirebaseIdToken(idToken);
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: process.env.FRONTEND_BASE_URL + '/?checkout=success',
      cancel_url: process.env.FRONTEND_BASE_URL + '/?checkout=cancel',
      metadata: { uid },
    });
    res.json({ url: session.url });
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: e.message });
  }
});

app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const uid = session.metadata?.uid;
    if (uid) {
      const creditsToAdd = 10;
      const ref = db.collection('users').doc(uid);
      await ref.set({ credits: admin.firestore.FieldValue.increment(creditsToAdd) }, { merge: true });
    }
  }
  res.json({ received: true });
});

app.post('/api/generate', async (req, res) => {
  try {
    const { idToken, prompt, aspectRatio = '16:9', durationSeconds = 4 } = req.body;
    const uid = await verifyFirebaseIdToken(idToken);

    await chargeCredits(uid, 1);

    const payload = {
      prompt: { text: prompt },
      config: { aspectRatio, durationSeconds }
    };

    const createResp = await createVideo(process.env.GOOGLE_API_KEY, payload);
    const operationName = createResp.name;

    const docRef = db.collection('users').doc(uid).collection('videos').doc();
    await docRef.set({ status: 'pending', operationName, prompt, createdAt: admin.firestore.FieldValue.serverTimestamp() });

    res.json({ videoId: docRef.id, operationName });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/check', async (req, res) => {
  const { idToken, operationName, videoId } = req.body;
  try {
    const uid = await verifyFirebaseIdToken(idToken);
    const op = await getOperation(process.env.GOOGLE_API_KEY, operationName);
    if (!op.done) return res.json({ done: false });

    const videoUri = op.response?.video?.uri;
    if (!videoUri) {
      await db.collection('users').doc(uid).collection('videos').doc(videoId).update({ status: 'error', op });
      return res.json({ done: true, success: false });
    }

    const r = await axios.get(videoUri, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(r.data);
    const filename = `videos/${uid}/${videoId}.mp4`;
    const file = bucket.file(filename);
    await file.save(buffer, { resumable: false, metadata: { contentType: 'video/mp4' } });

    const [url] = await file.getSignedUrl({ action: 'read', expires: Date.now() + 1000 * 60 * 60 * 24 * 30 });

    await db.collection('users').doc(uid).collection('videos').doc(videoId).update({ status: 'done', gcsPath: filename, publicUrl: url, completedAt: admin.firestore.FieldValue.serverTimestamp() });

    res.json({ done: true, success: true, url });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/list', async (req, res) => {
  try {
    const { idToken } = req.body;
    const uid = await verifyFirebaseIdToken(idToken);
    const snaps = await db.collection('users').doc(uid).collection('videos').orderBy('createdAt','desc').limit(20).get();
    const items = snaps.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json({ items });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
