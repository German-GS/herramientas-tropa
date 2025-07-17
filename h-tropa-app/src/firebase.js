// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAef4tU9UxKiwbof4ZZt1hSb8soGR_ijJc",
  authDomain: "herramienta-tropa.firebaseapp.com",
  projectId: "herramienta-tropa",
  storageBucket: "herramienta-tropa.appspot.com", // ← CORREGIDO
  messagingSenderId: "554472339858",
  appId: "1:554472339858:web:eab7c6099f22a4a9d6694b",
  measurementId: "G-4P9JK1QX4B",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
