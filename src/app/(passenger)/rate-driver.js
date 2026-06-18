import {
  Alert,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  router,
  useLocalSearchParams
} from "expo-router";
import {
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "../../../firebase/config";
export default function RateDriver() {
const {
  driverPhone,
  driverName,
  rideId,
} = useLocalSearchParams();
 const submitRating = async (
  rating
) => {
  try {
    const q = query(
      collection(db, "users"),
      where(
        "phone",
        "==",
        driverPhone
      )
    );

    const snapshot =
      await getDocs(q);

    if (snapshot.empty) {
      Alert.alert(
        "Erreur",
        "Conducteur introuvable"
      );
      return;
    }

    const driverDoc =
      snapshot.docs[0];

    const data =
      driverDoc.data();

    const oldAverage =
      data.averageRating || 0;

    const oldTotal =
      data.totalRatings || 0;

    const newTotal =
      oldTotal + 1;

    const newAverage =
      (
        oldAverage *
          oldTotal +
        rating
      ) / newTotal;

    await updateDoc(
      driverDoc.ref,
      {
        averageRating:
          Number(
            newAverage.toFixed(
              1
            )
          ),

        totalRatings:
          newTotal,
      }
    );

    await updateDoc(
      doc(
        db,
        "rides",
        rideId
      ),
      {
        ratingSubmitted:
          true,

        driverRating:
          rating,
          archived: true,
      }
    );

    Alert.alert(
      "Merci",
      "Votre note a été enregistrée"
    );

    router.replace(
      "/(passenger)/home"
    );
  } catch (error) {
    console.log(error);

    Alert.alert(
      "Erreur",
      "Impossible d'enregistrer la note"
    );
  }
};

  return (
    <SafeAreaView
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text
        style={{
          fontSize: 28,
          fontWeight: "bold",
        }}
      >
        Noter votre chauffeur
      </Text>
        <Text
        style={{
            marginTop: 20,
            fontSize: 16,
        }}
        >
      Chauffeur : {driverName}
        </Text>
      <View
        style={{
          flexDirection: "row",
          marginTop: 30,
        }}
      >
        {[1, 2, 3, 4, 5].map(
          (star) => (
            <TouchableOpacity
              key={star}
              onPress={() =>
                submitRating(star)
              }
            >
              <Text
                style={{
                  fontSize: 50,
                }}
              >
                ⭐
              </Text>
            </TouchableOpacity>
          )
        )}
      </View>
    </SafeAreaView>
  );
}