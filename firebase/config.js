import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyApbr70gcbgACLvYV7-FVTK-b5P9gf-z2g",
  authDomain: "ntaakata.firebaseapp.com",
  projectId: "ntaakata",
  storageBucket: "ntaakata.firebasestorage.app",
  messagingSenderId: "38744766427",
  appId: "1:38744766427:web:bfe4ca8dedc5136db719fe",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;