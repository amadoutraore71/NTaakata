import { initializeApp, getApp, getApps } from "firebase/app";

import {
  getAuth,
  getReactNativePersistence,
  initializeAuth,
} from "firebase/auth";

import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";

import { getFirestore } from "firebase/firestore";
const firebaseConfig = {
  apiKey: "AIzaSyApbr70gcbgACLvYV7-FVTK-b5P9gf-z2g",
  authDomain: "ntaakata.firebaseapp.com",
  projectId: "ntaakata",
  storageBucket: "ntaakata.firebasestorage.app",
  messagingSenderId: "38744766427",
  appId: "1:38744766427:web:bfe4ca8dedc5136db719fe",
};
const app = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

let auth;

try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(
      ReactNativeAsyncStorage
    ),
  });
} catch (error) {
  if (error?.code === "auth/already-initialized") {
    auth = getAuth(app);
  } else {
    throw error;
  }
}

export { auth };

export const db = getFirestore(app);