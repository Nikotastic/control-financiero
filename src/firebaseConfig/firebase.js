// src/firebase/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; // Firestore


const firebaseConfig = {
  apiKey: "AIzaSyAGJnL4svDmCWzeXLvJVI7nXXsJqdapQWY",
  authDomain: "gestion-de-finanzas-d43a0.firebaseapp.com",
  projectId: "gestion-de-finanzas-d43a0",
  storageBucket: "gestion-de-finanzas-d43a0.appspot.com", 
  messagingSenderId: "311365225225",
  appId: "1:311365225225:web:f02a9c2f294f2ff14a21d8",
  measurementId: "G-WWN7ND8D8J"
};

const app = initializeApp(firebaseConfig);

// Exportar Firestore y Auth
export const db = getFirestore(app);

