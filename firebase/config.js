import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyApbr70gcbgACLvYV7-FVTK-b5P9gf-z2g",
  authDomain: "ntaakata.firebaseapp.com",
  projectId: "ntaakata",
  storageBucket: "ntaakata.firebasestorage.app",
  messagingSenderId: "38744766427",
  appId: "1:38744766427:web:bfe4ca8dedc5136db719fe",
};

// Initialisation Firebase
const app = initializeApp(firebaseConfig);

// Services Firebase
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;