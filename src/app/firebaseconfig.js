// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB_pMlWDBq7Z46n6beG90xPg1lV2kEk_ZI",
  authDomain: "sproutsynch.firebaseapp.com",
  databaseURL: "https://sproutsynch-default-rtdb.firebaseio.com",
  projectId: "sproutsynch",
  storageBucket: "sproutsynch.firebasestorage.app",
  messagingSenderId: "647445604875",
  appId: "1:647445604875:web:5fc39a815e36687f6e350e",
  measurementId: "G-EP63KT83XD"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app)

export {db};

export const auth = getAuth(app);