import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCRq600SDHxKbvpKsOi_dxdz-mDO1cakSM",
  authDomain: "standupmanager-9e879.firebaseapp.com",
  projectId: "standupmanager-9e879",
  storageBucket: "standupmanager-9e879.firebasestorage.app",
  messagingSenderId: "267593649005",
  appId: "1:267593649005:web:f93dd44b4c09f02e05a864",
  measurementId: "G-1KVMKPDSPT",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { app, analytics, auth, googleProvider };
