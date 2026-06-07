import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize client-side Firebase components
const app = initializeApp(firebaseConfig);

// CRITICAL: We pass the specific custom firestoreDatabaseId from the configuration block to prevent db mismatched errors
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
