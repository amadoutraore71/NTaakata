import {
    addDoc,
    collection,
} from "firebase/firestore";

import { db } from "./config";

export const createRide = async (
  rideData
) => {
  return await addDoc(
    collection(db, "rides"),
    rideData
  );
};