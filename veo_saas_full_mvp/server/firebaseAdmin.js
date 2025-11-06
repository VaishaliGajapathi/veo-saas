// server/firebaseAdmin.js
import admin from 'firebase-admin';
import fs from 'fs';

if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON_PATH) {
  console.error('Set FIREBASE_SERVICE_ACCOUNT_JSON_PATH in env');
  process.exit(1);
}

const serviceAccount = JSON.parse(
  fs.readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT_JSON_PATH)
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
export { admin, db };
