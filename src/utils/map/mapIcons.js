import { Asset } from "expo-asset";

export async function loadMapIcons() {
  const carAsset = Asset.fromModule(
    require("../../../assets/map-icons/car.png")
  );

  const motoAsset = Asset.fromModule(
    require("../../../assets/map-icons/moto.png")
  );

  const passengerAsset = Asset.fromModule(
    require("../../../assets/map-icons/passenger.png")
  );

  await Promise.all([
    carAsset.downloadAsync(),
    motoAsset.downloadAsync(),
    passengerAsset.downloadAsync(),
  ]);

  return {
    car: carAsset.uri,
    moto: motoAsset.uri,
    passenger: passengerAsset.uri,
  };
}