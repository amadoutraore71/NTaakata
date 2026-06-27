import { useState } from "react";
import {
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  router,
  useLocalSearchParams,
} from "expo-router";

import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../../../firebase/config";
import AppHeader from "../../components/AppHeader";

export default function RateDriver() {

  const { rideId, driverPhone } =
    useLocalSearchParams();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);

  const tags = [
    "Conducteur poli",
    "Ponctuel",
    "Véhicule propre",
    "Bonne conduite",
    "Respectueux",
  ];

  const toggleTag = (tag) => {

    if (selectedTags.includes(tag)) {

      setSelectedTags(
        selectedTags.filter(
          (item) => item !== tag
        )
      );

    } else {

      setSelectedTags([
        ...selectedTags,
        tag,
      ]);

    }

  };

  const submitRating = async () => {

    if (rating === 0) {

      Alert.alert(
        "Erreur",
        "Veuillez choisir une note."
      );

      return;

    }

    try {

      // Mise à jour de la course

      await updateDoc(
        doc(db, "rides", rideId),
        {
          rating,
          comment,
          tags: selectedTags,
          ratingSubmitted: true,
        }
      );
      await addDoc(
  collection(db, "reviews"),
  {
    rideId,
    driverPhone,
    passengerPhone: "",
    rating,
    comment,
    tags: selectedTags,
    createdAt: new Date().toISOString(),
  }
);

      // Recherche du conducteur

      const driverQuery = query(
        collection(db, "users"),
        where(
          "phone",
          "==",
          driverPhone
        )
      );

      const snapshot =
        await getDocs(driverQuery);

      if (snapshot.empty) {

        Alert.alert(
          "Erreur",
          "Conducteur introuvable."
        );

        return;

      }

      const driverDoc =
        snapshot.docs[0];

      const driver =
        driverDoc.data();

      const totalRatings =
        driver.totalRatings || 0;

      const averageRating =
        driver.averageRating || 0;

      const newTotalRatings =
        totalRatings + 1;

      const newAverageRating =
        (
          (averageRating * totalRatings) +
          rating
        ) / newTotalRatings;

      await updateDoc(
        driverDoc.ref,
        {
          totalRatings:
            newTotalRatings,

          averageRating:
            Number(
              newAverageRating.toFixed(1)
            ),
        }
      );

      Alert.alert(
        "Merci !",
        "Votre avis a été enregistré."
      );

      router.replace(
        "/(passenger)/home"
      );

    } catch (error) {

      console.log(error);

      Alert.alert(
        "Erreur",
        "Impossible d'enregistrer votre avis."
      );

    }

  };

  return (

    <SafeAreaView style={styles.container}>

      <AppHeader
        title="Noter le conducteur"
        profileRoute="/(passenger)/profile"
      />

      <Text style={styles.title}>
        Évaluez votre conducteur
      </Text>

      <Text style={styles.subtitle}>
        Comment s'est passée votre course ?
      </Text>

      {/* Etoiles */}

      <View style={styles.stars}>

        {[1,2,3,4,5].map((star)=>(

          <TouchableOpacity
            key={star}
            onPress={() =>
              setRating(star)
            }
          >

            <Text style={styles.star}>
              {star <= rating ? "⭐" : "☆"}
            </Text>

          </TouchableOpacity>

        ))}

      </View>

      {/* Commentaire */}

      <Text style={styles.label}>
        Votre commentaire
      </Text>

      <TextInput
        style={styles.commentInput}
        multiline
        numberOfLines={4}
        placeholder="Décrivez votre expérience..."
        value={comment}
        onChangeText={setComment}
      />

      {/* Tags */}

      <Text style={styles.label}>
        Qu'avez-vous apprécié ?
      </Text>

      <View style={styles.tagsContainer}>

        {tags.map((tag)=>(

          <TouchableOpacity
            key={tag}
            style={[
              styles.tag,
              selectedTags.includes(tag) &&
              styles.tagSelected,
            ]}
            onPress={() =>
              toggleTag(tag)
            }
          >

            <Text
              style={[
                styles.tagText,
                selectedTags.includes(tag) &&
                styles.tagTextSelected,
              ]}
            >
              {tag}
            </Text>

          </TouchableOpacity>

        ))}

      </View>

      {/* Bouton */}

      <TouchableOpacity
        style={styles.button}
        onPress={submitRating}
      >

        <Text style={styles.buttonText}>
          Envoyer mon avis
        </Text>

      </TouchableOpacity>

    </SafeAreaView>

  );

}

const styles = StyleSheet.create({

  container:{
    flex:1,
    backgroundColor:"#FFFFFF",
    padding:20,
  },

  title:{
    marginTop:20,
    fontSize:30,
    fontWeight:"bold",
    color:"#0B6E4F",
    textAlign:"center",
  },

  subtitle:{
    marginTop:10,
    fontSize:17,
    textAlign:"center",
    color:"#666",
    marginBottom:30,
  },

  stars:{
    flexDirection:"row",
    justifyContent:"center",
    marginBottom:30,
  },

  star:{
    fontSize:48,
    marginHorizontal:5,
  },

  label:{
    fontSize:17,
    fontWeight:"bold",
    marginBottom:10,
    color:"#222",
  },

  commentInput:{
    borderWidth:1,
    borderColor:"#DDD",
    borderRadius:12,
    padding:15,
    minHeight:120,
    textAlignVertical:"top",
    marginBottom:25,
  },

  tagsContainer:{
    flexDirection:"row",
    flexWrap:"wrap",
    marginBottom:30,
  },

  tag:{
    borderWidth:1,
    borderColor:"#0B6E4F",
    borderRadius:20,
    paddingHorizontal:15,
    paddingVertical:10,
    marginRight:10,
    marginBottom:10,
  },

  tagSelected:{
    backgroundColor:"#0B6E4F",
  },

  tagText:{
    color:"#0B6E4F",
    fontWeight:"600",
  },

  tagTextSelected:{
    color:"#FFFFFF",
  },

  button:{
    backgroundColor:"#0B6E4F",
    height:55,
    borderRadius:12,
    justifyContent:"center",
    alignItems:"center",
  },

  buttonText:{
    color:"#FFFFFF",
    fontSize:18,
    fontWeight:"bold",
  },

});