import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebase/config";

export async function createRide({
  passenger,
  driver,
  pickup,
  destination,
  distance,
  duration,
  price,
}) {
  const ride = {
    status: "pending",

    passengerId: passenger.userId,
    passengerName: passenger.name,
    passengerPhone: passenger.phone,

   driverId: driver.userId,
    driverName: driver.name,
    driverPhone: driver.phone,

    pickup,

    destination,

    estimatedDistance: distance,
    estimatedDuration: duration,
    estimatedPrice: price,

    createdAt: serverTimestamp(),

    acceptedAt: null,
    startedAt: null,
    completedAt: null,
  };

  const docRef = await addDoc(
    collection(db, "rides"),
    ride
  );

  return docRef.id;
}