import {
    collection,
    getDocs,
} from "firebase/firestore";

import { db } from "./config";

export const getDrivers = async () => {
  const snapshot = await getDocs(
    collection(db, "drivers")
  );

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};