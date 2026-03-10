import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";

const env = import.meta.env;

const requiredFirebaseEnvKeys = [
  "REACT_APP_FB_API_KEY",
  "REACT_APP_FB_AUTH_DOMAIN",
  "REACT_APP_FB_PROJECT_ID",
  "REACT_APP_FB_STORAGE_BUCKET",
  "REACT_APP_FB_MESSAGING_SENDER_ID",
  "REACT_APP_FB_APP_ID",
];

export const firebaseConfig = {
  apiKey: env.REACT_APP_FB_API_KEY,
  authDomain: env.REACT_APP_FB_AUTH_DOMAIN,
  projectId: env.REACT_APP_FB_PROJECT_ID,
  storageBucket: env.REACT_APP_FB_STORAGE_BUCKET,
  messagingSenderId: env.REACT_APP_FB_MESSAGING_SENDER_ID,
  appId: env.REACT_APP_FB_APP_ID,
};

let app = null;
let auth = null;
let db = null;
let storage = null;
let firebaseInitError = "";

try {
  const missingFirebaseEnvKeys = requiredFirebaseEnvKeys.filter(
    (key) => !(env[key] || "").trim()
  );

  if (missingFirebaseEnvKeys.length) {
    throw new Error(
      `Missing Firebase env keys: ${missingFirebaseEnvKeys.join(", ")}`
    );
  }

  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
} catch (error) {
  firebaseInitError =
    error?.message || "Firebase failed to initialize with the current config";
  // Keep app usable when Firebase credentials are unavailable/invalid.
  console.warn("Firebase disabled:", firebaseInitError);
}

export { app, auth, db, storage, firebaseInitError };
export const isFirebaseEnabled = Boolean(app && auth && db && storage);

export default app;
