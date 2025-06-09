// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your Firebase config from the Firebase console
const firebaseConfig = {
  apiKey: "AIzaSyCrxxysOE3H3EYsOgHbnj0jyGSGnPl4LFE",
  authDomain: "my-app-47e22.firebaseapp.com",
  projectId: "my-app-47e22",
  storageBucket: "my-app-47e22.firebasestorage.app",
  messagingSenderId: "336746548125",
  appId: "1:336746548125:web:1a511968c4c88dbe697d74",
  measurementId: "G-57M17E2YBR",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };
