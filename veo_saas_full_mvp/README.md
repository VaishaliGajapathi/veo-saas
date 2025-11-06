Veo-SaaS Full MVP
==================

This is a ready-to-run scaffold for a SaaS using Google Gemini (Veo) video API,
Firebase Auth + Firestore for users & credits, Stripe for payments, and Google Cloud Storage
to persist generated videos.

Quick start (local dev):
1. Copy server/.env.example -> server/.env and fill in keys.
2. Place your Firebase service account JSON at the path you set in server/.env.
3. Install server deps: cd server && npm install
4. Start server: node index.js
5. Install client deps: cd client && npm install
6. Start client: npm start
7. Open the app at http://localhost:3000 and sign in with Google.

NOTE: This scaffold uses placeholders. For production, secure your keys, enable HTTPS,
configure Firestore rules, configure Stripe webhook endpoint, and set proper GCS lifecycle rules.
