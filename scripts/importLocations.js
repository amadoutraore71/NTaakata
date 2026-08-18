import { cert, initializeApp } from "firebase-admin/app";
import {
    FieldValue,
    getFirestore,
} from "firebase-admin/firestore";

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import serviceAccount from "./serviceAccountKey.json" with {
    type: "json"
};

import locations from "../data/mali_locations.json" with {
    type: "json"
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOCATIONS_FILE = path.join(
  __dirname,
  "../data/mali_locations.json"
);

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

const COLLECTION = "locations";
const BATCH_SIZE = 500;

let created = 0;
let skipped = 0;
let errors = 0;

async function loadExistingLocations() {
  const snapshot = await db.collection(COLLECTION).get();

  const existing = new Set();

  snapshot.forEach((doc) => {
    const data = doc.data();

    if (
      !data.normalizedName ||
      data.latitude == null ||
      data.longitude == null
    ) {
      return;
    }

    const key = [
      data.normalizedName,
      Number(data.latitude).toFixed(5),
      Number(data.longitude).toFixed(5),
    ].join("_");

    existing.add(key);
  });

  return existing;
}

function buildDocumentId(location) {
  return [
    location.normalizedName,
    Number(location.latitude).toFixed(5),
    Number(location.longitude).toFixed(5),
  ]
    .join("_")
    .replace(/[^a-zA-Z0-9_]/g, "_");
}

async function importLocations() {
  if (!fs.existsSync(LOCATIONS_FILE)) {
    console.error("❌ mali_locations.json introuvable.");
    return;
  }

  const startTime = Date.now();

  console.log("");
  console.log("=================================");
  console.log("Import des lieux");
  console.log("=================================");
  console.log("");

  console.log(`${locations.length} lieux à traiter...`);

  const existingLocations = await loadExistingLocations();

  console.log(
    `${existingLocations.size} lieux déjà présents dans Firestore.`
  );

  for (
    let i = 0;
    i < locations.length;
    i += BATCH_SIZE
  ) {
    const batch = db.batch();

    const chunk = locations.slice(
      i,
      i + BATCH_SIZE
    );

    chunk.forEach((location) => {
      const key = [
        location.normalizedName,
        Number(location.latitude).toFixed(5),
        Number(location.longitude).toFixed(5),
      ].join("_");

      if (existingLocations.has(key)) {
        skipped++;
        return;
      }

      existingLocations.add(key);

      const docId = buildDocumentId(location);

      const ref = db
        .collection(COLLECTION)
        .doc(docId);

      batch.set(
        ref,
        {
          ...location,
          updatedAt:
            FieldValue.serverTimestamp(),
        },
        {
          merge: true,
        }
      );

      created++;
    });

    try {
      await batch.commit();
    } catch (error) {
      console.error(error);
      errors++;
    }

    console.log(
      `[${Math.min(
        i + BATCH_SIZE,
        locations.length
      )}/${locations.length}] Créés : ${created} | Ignorés : ${skipped}`
    );
  }

  const duration = (
    (Date.now() - startTime) /
    1000
  ).toFixed(2);

  console.log("");
  console.log("=================================");
  console.log("Import terminé");
  console.log("=================================");
  console.log(`Créés      : ${created}`);
  console.log(`Ignorés    : ${skipped}`);
  console.log(`Erreurs    : ${errors}`);
  console.log(`Durée      : ${duration} s`);
  console.log("=================================");
}

importLocations().catch(console.error);