const fs = require("fs");
const Parser = require("osm-pbf-parser");
const ALLOWED_TAGS = {
  hospital: "hospital",
  clinic: "clinic",
  pharmacy: "pharmacy",
  school: "school",
  university: "university",
  bank: "bank",
  atm: "atm",
  restaurant: "restaurant",
  cafe: "cafe",
  fuel: "fuel",
  marketplace: "marketplace",
  bus_station: "bus_station",
};

const parser = new Parser();

let count = 0;

fs.createReadStream("./data/mali-latest.osm.pbf")
  .pipe(parser)
  .on("data", (items) => {
    count += items.length;

    if (count >= 10) {
      const useful = items.filter(isUsefulLocation);

if (useful.length > 0) {
  console.log(useful);
  process.exit(0);
}
      process.exit(0);
    }
  })
  .on("error", console.error)
  .on("end", () => {
    console.log("Terminé");
  });

  function isUsefulLocation(item) {
  if (!item.tags) return false;

  const amenity = item.tags.amenity;

  return amenity && ALLOWED_TAGS[amenity];
}