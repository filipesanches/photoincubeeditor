import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA2OB_vCgSCTQKBgtdHBbIyYbL13YTcfZo",
  authDomain: "photoincubeeditor.firebaseapp.com",
  projectId: "photoincubeeditor",
  storageBucket: "photoincubeeditor.firebasestorage.app",
  messagingSenderId: "316416117469",
  appId: "1:316416117469:web:fad64e55dae419cd64e934"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

export default app;
