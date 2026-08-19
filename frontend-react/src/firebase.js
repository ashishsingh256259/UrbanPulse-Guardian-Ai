import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD8SvaV70b30BNbZ6PXrhD2dn5ArBdbqLw",
  authDomain: "urbanpulse-gardian-ai.firebaseapp.com",
  projectId: "urbanpulse-gardian-ai",
  storageBucket: "urbanpulse-gardian-ai.firebasestorage.app",
  messagingSenderId: "234829673567",
  appId: "1:234829673567:web:ec4f17630cf8a9308d97ea",
  measurementId: "G-X1FHYL7TL2"
};

const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
