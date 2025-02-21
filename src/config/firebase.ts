// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAQ-Aq4WhvOVJs-jLjKvXBt3_WT5msaHJQ",
  authDomain: "barbearia-andin.firebaseapp.com",
  projectId: "barbearia-andin",
  storageBucket: "barbearia-andin.firebasestorage.app",
  messagingSenderId: "336746868613",
  appId: "1:336746868613:web:ea217625a53b3d88f9deec",
  measurementId: "G-7E4CMDZV4N",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firestore and export
export const db = getFirestore(app);
