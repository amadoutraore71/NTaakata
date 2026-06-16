export const calculateFare = (
  pickup,
  destination
) => {
  if (
    pickup
      .toLowerCase()
      .includes("sogoniko") &&
    destination
      .toLowerCase()
      .includes("kalaban")
  ) {
    return 1000;
  }

  if (
    pickup
      .toLowerCase()
      .includes("aci") &&
    destination
      .toLowerCase()
      .includes("yirimadio")
  ) {
    return 1500;
  }

  return 1200;
};