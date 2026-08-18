import { StyleSheet, View } from "react-native";

import TripProgressCard from "../TripProgressCard";
import DriverInfoCard from "./DriverInfoCard";
import RideActionButtons from "./RideActionButtons";
import RideArrivalInfo from "./RideArrivalInfo";

export default function RideBottomSheet({
  driver,
  ride,
  distance,
  duration,
  eta,
  phone,
  onChat,
  onCancel,
}) {
  return (
    <View style={styles.container}>

      <DriverInfoCard
        driver={driver}
      />

      <TripProgressCard
        distance={distance}
        duration={duration}
        eta={eta}
      />

      <RideArrivalInfo
        distance={distance}
        duration={duration}
        fare={ride?.estimatedPrice}
      />

      <RideActionButtons
        phone={phone}
        onChat={onChat}
        onCancel={onCancel}
      />

    </View>
  );
}

const styles = StyleSheet.create({

  container: {

    position: "absolute",

    left: 0,
    right: 0,
    bottom: 0,

    backgroundColor: "#FFF",

    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,

    paddingTop: 15,

    paddingBottom: 30,

    paddingHorizontal: 15,

    elevation: 20,

    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,

  },

});