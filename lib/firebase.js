import { initializeApp } from "firebase/app";
import { GoogleAuthProvider, getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAQuKmsvn-8SseAB5BTNFRjdmGB3ujfpyQ",
  authDomain: "brainos-a84c8.firebaseapp.com",
  projectId: "brainos-a84c8",
  storageBucket: "brainos-a84c8.firebasestorage.app",
  messagingSenderId: "730143430095",
  appId: "1:730143430095:web:f7e5d2ca65cf8c18a12eba",
  measurementId: "G-01J55BK60B"
};

const app = initializeApp(firebaseConfig);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);
export { app, provider, db };