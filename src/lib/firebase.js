// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAPRG2u1q07eB4zcJeAAVrjK5yXS1USjq8",
  authDomain: "realestatesite-cb280.firebaseapp.com",
  projectId: "realestatesite-cb280",
  storageBucket: "realestatesite-cb280.firebasestorage.app",
  messagingSenderId: "37414044491",
  appId: "1:37414044491:web:cea064404186a57c1c9ece"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
const storage = getStorage(app);