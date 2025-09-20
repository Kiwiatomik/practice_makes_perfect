import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getPerformance } from 'firebase/performance';

interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

const validateFirebaseConfig = (): FirebaseConfig => {
  const config = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  };

  const missingKeys = Object.entries(config)
    .filter(([key, value]) => !value && key !== 'measurementId')
    .map(([key]) => key);

  if (missingKeys.length > 0) {
    throw new Error(
      `Missing Firebase configuration: ${missingKeys.join(', ')}. ` +
      'Please check your environment variables.'
    );
  }

  return config as FirebaseConfig;
};

let firebaseApp: any;
let auth: any;
let db: any;
let functions: any;
let analytics: any;
let performance: any;

try {
  const firebaseConfig = validateFirebaseConfig();
  firebaseApp = initializeApp(firebaseConfig);
  auth = getAuth(firebaseApp);
  db = getFirestore(firebaseApp);
  functions = getFunctions(firebaseApp);

  // Initialize Analytics (only in browser and production)
  if (typeof window !== 'undefined' && !import.meta.env.DEV) {
    isSupported().then((supported) => {
      if (supported) {
        analytics = getAnalytics(firebaseApp);
      }
    });
  }

  // Initialize Performance Monitoring
  if (typeof window !== 'undefined') {
    performance = getPerformance(firebaseApp);
  }

  if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
    try {
      connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
      connectFirestoreEmulator(db, 'localhost', 8080);
      connectFunctionsEmulator(functions, 'localhost', 5001);
    } catch (error) {
      console.warn('Firebase emulators already connected or unavailable');
    }
  }
} catch (error) {
  console.error('Failed to initialize Firebase:', error);
  throw error;
}

export { auth, db, functions, analytics, performance };
export default firebaseApp;