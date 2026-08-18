import {
    collection,
    getDocs,
    limit,
    query,
    where,
} from "firebase/firestore";

import { db } from "../firebase/config";

export async function getActiveRide(passengerId) {

  const q = query(
    collection(db, "rides"),
    where("passengerId", "==", passengerId),
    where(
      "status",
      "in",
      [
        "searching",
        "accepted",
        "arrived",
        "started",
      ]
    ),
    limit(1)
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return null;
  }

  return {
    id: snapshot.docs[0].id,
    ...snapshot.docs[0].data(),
  };
}