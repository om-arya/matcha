import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: "matcha-post-survey.firebaseapp.com",
  projectId: "matcha-post-survey",
  storageBucket: "matcha-post-survey.firebasestorage.app",
  messagingSenderId: "176000784905",
  appId: "1:176000784905:web:cc0c80016d404ee3a436d8",
  measurementId: "G-RHNFNZJSCN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };