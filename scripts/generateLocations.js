import fs, { createReadStream } from "fs";
import Parser from "osm-pbf-parser";
import path from "path";
import { fileURLToPath } from "url";
import { createLocation } from "../models/locationModel.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const INPUT_FILE = path.join(
    __dirname,
    "../data/mali-latest.osm.pbf"
);

const OUTPUT_FILE = path.join(
    __dirname,
    "../data/mali_locations.json"
);

const parser = new Parser();

const locations = [];

const ALLOWED_AMENITIES = new Set([
    // Santé
    "hospital",
    "clinic",
    "pharmacy",
    "doctors",
    "dentist",

    // Education
    "school",
    "college",
    "university",
    "kindergarten",

    // Banque
    "bank",
    "atm",

    // Restaurants
    "restaurant",
    "fast_food",
    "cafe",
    "bar",

    // Transport
    "bus_station",
    "taxi",
    "fuel",
    "charging_station",

    // Commerce
    "marketplace",

    // Administration
    "police",
    "fire_station",
    "post_office",
    "townhall",
    "courthouse",

    // Religion
    "place_of_worship",
]);
const ALLOWED_PLACES = new Set([
    "city",
    "town",
    "village",
    "suburb",
    "neighbourhood",
    "hamlet",
]);
const ALLOWED_SHOPS = new Set([
    "supermarket",
    "mall",
    "bakery",
    "butcher",
    "clothes",
    "electronics",
    "mobile_phone",
    "hardware",
    "car",
    "car_repair",
]);
const ALLOWED_TOURISM = new Set([
    "hotel",
    "guest_house",
    "hostel",
    "museum",
    "attraction",
]);
const ALLOWED_LEISURE = new Set([
    "park",
    "stadium",
    "sports_centre",
]);
const stats = {
    amenity: 0,
    place: 0,
    shop: 0,
    tourism: 0,
    leisure: 0,
};
function getPopularity(type) {
    switch (type) {
        case "city":
            return 100;

        case "town":
            return 95;

        case "village":
            return 90;

        case "hospital":
            return 95;

        case "bus_station":
            return 95;

        case "marketplace":
            return 90;

        case "bank":
            return 85;

        case "school":
            return 80;

        case "restaurant":
            return 75;

        case "hotel":
            return 75;

        case "fuel":
            return 70;

        default:
            return 50;
    }
}

function isUseful(item) {
    if (!item.tags) return false;

    if (!isValidName(item.tags.name)) return false;

    if (
        item.tags.amenity &&
        ALLOWED_AMENITIES.has(item.tags.amenity)
    ) {
        return true;
    }

    if (
        item.tags.place &&
        ALLOWED_PLACES.has(item.tags.place)
    ) {
        return true;
    }

    if (
        item.tags.shop &&
        ALLOWED_SHOPS.has(item.tags.shop)
    ) {
        return true;
    }

    if (
        item.tags.tourism &&
        ALLOWED_TOURISM.has(item.tags.tourism)
    ) {
        return true;
    }

    if (
        item.tags.leisure &&
        ALLOWED_LEISURE.has(item.tags.leisure)
    ) {
        return true;
    }

    return false;
}
function isValidName(name) {
    if (!name) return false;

    const value = name.trim();

    if (value.length < 2) return false;

    if (/^\d+$/.test(value)) return false;

    return true;
}
function createLocationFromOSM(item) {
    const type =
        item.tags.amenity ||
        item.tags.place ||
        item.tags.shop ||
        item.tags.tourism ||
        item.tags.leisure ||
        "other";

    const aliases = [];

    // Nom en français
    if (item.tags["name:fr"]) {
        aliases.push(item.tags["name:fr"]);
    }

    // Nom en anglais
    if (item.tags["name:en"]) {
        aliases.push(item.tags["name:en"]);
    }

    // Nom local
    if (item.tags.alt_name) {
        aliases.push(item.tags.alt_name);
    }

    // Ancien nom
    if (item.tags.old_name) {
        aliases.push(item.tags.old_name);
    }

    return createLocation({
        name: item.tags.name,
        aliases,
        type,
        category: type,
        city:
            item.tags["addr:city"] ||
            item.tags.is_in ||
            "",
        region:
            item.tags["addr:state"] ||
            "",
        latitude: item.lat,
        longitude: item.lon,
        popularity: getPopularity(type),
    });
}
const seen = new Set();

let totalObjects = 0;
let keptLocations = 0;
let duplicateCount = 0;
parser.on("data", (items) => {
    for (const item of items) {
        totalObjects++;

        if (!isUseful(item)) continue;

        if (
            typeof item.lat !== "number" ||
            typeof item.lon !== "number"
        ) {
            continue;
        }

        const location = createLocationFromOSM(item);
        if (item.tags.amenity) stats.amenity++;
        else if (item.tags.place) stats.place++;
        else if (item.tags.shop) stats.shop++;
        else if (item.tags.tourism) stats.tourism++;
        else if (item.tags.leisure) stats.leisure++;
        const key = [
            location.normalizedName,
            location.category,
            location.latitude.toFixed(5),
            location.longitude.toFixed(5),
        ].join("_");

        if (seen.has(key)) {
            duplicateCount++;
            continue;
        }

        seen.add(key);

        locations.push(location);

        keptLocations++;

        if (keptLocations % 1000 === 0) {
            console.log(`${keptLocations} lieux conservés...`);
        }
    }
});

parser.on("end", () => {
    locations.sort((a, b) => {
        if (b.popularity !== a.popularity) {
            return b.popularity - a.popularity;
        }

        return (a.name || "").localeCompare(b.name || "");
    });

    fs.writeFileSync(
        OUTPUT_FILE,
        JSON.stringify(locations, null, 2),
        "utf8"
    );

    console.log("");
    console.log("==============================");
    console.log(" Génération terminée");
    console.log("==============================");
    console.log("");

    console.log("Objets analysés :", totalObjects);
    console.log("Lieux retenus :", keptLocations);
    console.log("Doublons supprimés :", totalObjects - keptLocations);

    console.log("");
    console.log("Fichier créé :");
    console.log(OUTPUT_FILE);
    console.log("\nRépartition :");
    console.log(stats);
});

parser.on("error", (error) => {
    console.error(error);
});

if (!fs.existsSync(INPUT_FILE)) {
    console.error("Fichier introuvable :", INPUT_FILE);
    process.exit(1);
}
createReadStream(INPUT_FILE).pipe(parser);