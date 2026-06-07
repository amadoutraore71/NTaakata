import {
    doc,
    setDoc,
} from "firebase/firestore";

import { db } from "./config";

export const createUserProfile = async (
  uid,
  data
) => {
  await setDoc(
    doc(db, "users", uid),
    data
  );
};