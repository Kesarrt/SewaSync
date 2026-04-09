import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";

// This is your unique connection to the Google Cloud
const firebaseConfig = {
  apiKey: "AIzaSyDoOAqwVNUBqqpd_JQosDb793gUZ844SW0",
  authDomain: "sewasync.firebaseapp.com",
  projectId: "sewasync",
  storageBucket: "sewasync.firebasestorage.app",
  messagingSenderId: "923589774229",
  appId: "1:923589774229:web:1bf027b97fce571bbb449c",
  measurementId: "G-TP1SFQ2MY2"
};

// Initialize the App
const app = initializeApp(firebaseConfig);

// Export the Database and Auth so our pages can use it
export const db = getFirestore(app);
export const analytics = getAnalytics(app);
export const auth = getAuth(app);

export default app;