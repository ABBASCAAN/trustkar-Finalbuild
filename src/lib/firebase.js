import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const envConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const hasEnvConfig = Object.values(envConfig).every(Boolean);

export const firebaseConfig = {
  // Prefer env in deployment; fallback keeps local project bootable.
  apiKey: envConfig.apiKey || "AIzaSyDraeS2-d6szC_Gt8d-pVXILwywO5kII9Y",
  authDomain: envConfig.authDomain || "romeo-escrow.firebaseapp.com",
  projectId: envConfig.projectId || "romeo-escrow",
  storageBucket: envConfig.storageBucket || "romeo-escrow.firebasestorage.app",
  messagingSenderId: envConfig.messagingSenderId || "899058347483",
  appId: envConfig.appId || "1:899058347483:web:da235c9d0290f601328bfe",
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

if (typeof window !== "undefined" && !hasEnvConfig) {
  console.warn(
    "[Firebase] NEXT_PUBLIC_FIREBASE_* env vars missing. Using fallback config from source."
  );
}

export default app;
