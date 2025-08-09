// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDtvCT-Wqp700jFbfywSJkPJ_AF2734KJY",
  authDomain: "marketing-saas-c9ced.firebaseapp.com",
  projectId: "marketing-saas-c9ced",
  storageBucket: "marketing-saas-c9ced.firebasestorage.app",
  messagingSenderId: "455312804784",
  appId: "1:455312804784:web:cf94beccbf000c777a6475",
  measurementId: "G-DKBR5TG91N"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Analytics (optional)
export const analytics = getAnalytics(app);

export default app;