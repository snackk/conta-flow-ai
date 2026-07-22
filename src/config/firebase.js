import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, GoogleAuthProvider } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { connectStorageEmulator, getStorage } from 'firebase/storage';

// Fallback config used only when no VITE_FIREBASE_CONFIG is provided in dev mode,
// so the app can boot straight against the Firebase Local Emulator Suite with
// zero setup (no .env file, no real Firebase project). See README "Testar sem
// projeto Firebase" for how to start the emulators.
const DEMO_EMULATOR_CONFIG = {
  apiKey: 'demo-key',
  authDomain: 'demo-conta-flow-ai.firebaseapp.com',
  projectId: 'demo-conta-flow-ai',
  storageBucket: 'demo-conta-flow-ai.appspot.com',
  messagingSenderId: '000000000000',
  appId: '1:000000000000:web:demo',
};

let firebaseConfig = {};
try {
  const configStr = import.meta.env.VITE_FIREBASE_CONFIG;
  if (configStr) {
    firebaseConfig = JSON.parse(configStr);
  }
} catch (e) {
  console.error('Erro ao fazer parse da configuração do Firebase', e);
}

const hasExplicitConfig = Object.keys(firebaseConfig).length > 0;
const useEmulators = import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true'
  || (import.meta.env.DEV && !hasExplicitConfig);

if (!hasExplicitConfig && useEmulators) {
  firebaseConfig = DEMO_EMULATOR_CONFIG;
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();
const appId = import.meta.env.VITE_APP_ID || 'conta-flow-ai';

if (useEmulators) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  connectStorageEmulator(storage, '127.0.0.1', 9199);
  console.info('[ContaFlow AI] Ligado aos emuladores locais do Firebase (Auth :9099, Firestore :8080, Storage :9199).');
}

export { firebaseConfig, app, auth, db, storage, googleProvider, appId, useEmulators };
