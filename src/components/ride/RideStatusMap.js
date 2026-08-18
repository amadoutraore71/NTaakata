import { StyleSheet, View } from "react-native";

import RideTrackingMap from "../RideTrackingMap";

export default function RideStatusMap({
  passengerLocation,
  driverLocation,
}) {
  if (!passengerLocation || !driverLocation) {
    return null;
  }

  return (
    <View style={styles.container}>
      <RideTrackingMap
        passengerLocation={passengerLocation}
       
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 330,
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 20,
    backgroundColor: "#F5F5F5",
  },
});