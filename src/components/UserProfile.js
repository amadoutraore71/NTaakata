import { useEffect, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import * as ImagePicker from "expo-image-picker";


import { router } from "expo-router";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import {
  Alert,
  Image,
  TouchableOpacity,
} from "react-native";
import { db } from "../../firebase/config";
import {
  getPhoto,
  removePhoto,
  savePhoto,
} from "../storage/photoStorage";
import {
  getUser,
  removeUser,
  saveUser,
} from "../storage/userStorage";
export default function UserProfile() {

  const [user, setUser] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [reviews, setReviews] = useState([]);
  useEffect(() => {
    loadUser();
  }, []);
const loadUser = async () => {

  try {

    // Lire l'utilisateur enregistré localement
    const localUser = await getUser();

    if (!localUser) {
      return;
    }

    // Lire les données les plus récentes dans Firestore
    const userRef = doc(
      db,
      "users",
      localUser.userId
    );

    const userSnap =
      await getDoc(userRef);

    let currentUser = localUser;

    if (userSnap.exists()) {

      currentUser = {
        userId: userSnap.id,
        ...userSnap.data(),
      };

      // Synchroniser AsyncStorage
      await saveUser(currentUser);

    }

    // Mettre à jour l'écran
    setUser(currentUser);

    // Charger les avis du conducteur
    if (currentUser.role === "driver") {
      loadReviews(currentUser.phone);
    }

    // Charger la photo locale
    const image = await getPhoto();

    if (image) {
      setPhoto(image);
    }

  } catch (error) {

    console.log(
      "Erreur loadUser :",
      error
    );

  }

};
  const loadReviews = async (phone) => {

    try {

      const q = query(
        collection(db, "reviews"),
        where("driverPhone", "==", phone)
      );

      const snapshot = await getDocs(q);

      const list = [];

      snapshot.forEach((doc) => {

        list.push({
          id: doc.id,
          ...doc.data(),
        });

      });

      list.sort((a, b) =>

        new Date(b.createdAt) -
        new Date(a.createdAt)

      );

      setReviews(list);

    } catch (error) {

      console.log(error);

    }

  };
  if (!user) {
    return null;
  }
  const choosePhoto = () => {

    Alert.alert(
      "Photo de profil",
      "Choisissez une option",
      [
        {
          text: "📷 Prendre une photo",
          onPress: takePhoto,
        },

        {
          text: "🖼️ Galerie",
          onPress: pickImage,
        },

        {
          text: "🗑️ Supprimer",
          style: "destructive",
          onPress: async () => {
            setPhoto(null);
            await removePhoto();
          },
        },

        {
          text: "Annuler",
          style: "cancel",
        },
      ]
    );

  };

  const pickImage = async () => {

    const result =
      await ImagePicker.launchImageLibraryAsync({

        mediaTypes: ["images"],

        allowsEditing: true,

        aspect: [1, 1],

        quality: 0.8,

      });

    if (!result.canceled) {

      const uri = result.assets[0].uri;

      setPhoto(uri);

      await savePhoto(uri);

    }

  };

  const takePhoto = async () => {

    const permission =
      await ImagePicker.requestCameraPermissionsAsync();

    if (permission.status !== "granted") {

      Alert.alert(
        "Permission",
        "Autorisez l'accès à la caméra."
      );

      return;

    }

    const result =
      await ImagePicker.launchCameraAsync({

        allowsEditing: true,

        aspect: [1, 1],

        quality: 0.8,

      });

    if (!result.canceled) {

      const uri = result.assets[0].uri;

      setPhoto(uri);

      await savePhoto(uri);

    }

  };
  const logout = () => {
    Alert.alert(
      "Déconnexion",
      "Voulez-vous vous déconnecter ?",
      [
        {
          text: "Annuler",
          style: "cancel",
        },
        {
          text: "Oui",
          style: "destructive",
          onPress: async () => {
            await removeUser();
            router.replace("/role-selection");
          },
        },
      ]
    );
  };
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Avatar */}

        <TouchableOpacity
          style={styles.avatarContainer}
          onPress={choosePhoto}
        >
          {photo ? (
            <Image
              source={{ uri: photo }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatar}>
              <Ionicons
                name="person"
                size={80}
                color="#FFF"
              />
            </View>
          )}

          <View style={styles.cameraButton}>
            <Ionicons
              name="camera"
              color="#FFF"
              size={20}
            />
          </View>
        </TouchableOpacity>

        {/* Nom */}

        <Text style={styles.name}>
          {user.name}
        </Text>

        {/* Téléphone */}

        <Text style={styles.phone}>
          {user.phone}
        </Text>

        {/* Badge */}

        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>
            {user.role === "driver"
              ? "🚗 Conducteur"
              : "🙋 Passager"}
          </Text>
        </View>

        {/* Informations personnelles */}

        <View style={styles.card}>

          <Text style={styles.cardTitle}>
            Informations personnelles
          </Text>

          <View style={styles.item}>
            <Ionicons
              name="person-outline"
              size={22}
              color="#0B6E4F"
            />

            <Text style={styles.itemText}>
              {user.name}
            </Text>
          </View>

          <View style={styles.item}>
            <Ionicons
              name="call-outline"
              size={22}
              color="#0B6E4F"
            />

            <Text style={styles.itemText}>
              {user.phone}
            </Text>
          </View>

        </View>

        {/* Véhicule */}

        {user.role === "driver" && (

          <View style={styles.card}>

            <Text style={styles.cardTitle}>
              Mon véhicule
            </Text>

            <View style={styles.item}>
              <Ionicons
                name="car-outline"
                size={22}
                color="#0B6E4F"
              />

              <Text style={styles.itemText}>
                Type : {user.vehicleType || "-"}
              </Text>
            </View>

            <View style={styles.item}>
              <Ionicons
                name="speedometer-outline"
                size={22}
                color="#0B6E4F"
              />

              <Text style={styles.itemText}>
                Marque : {user.vehicleBrand || "-"}
              </Text>
            </View>

            <View style={styles.item}>
              <Ionicons
                name="color-palette-outline"
                size={22}
                color="#0B6E4F"
              />

              <Text style={styles.itemText}>
                Couleur : {user.vehicleColor || "-"}
              </Text>
            </View>

            <View style={styles.item}>
              <Ionicons
                name="card-outline"
                size={22}
                color="#0B6E4F"
              />

              <Text style={styles.itemText}>
                Immatriculation : {user.plateNumber || "-"}
              </Text>
            </View>

          </View>

        )}

        {/* Statistiques */}

        <View style={styles.card}>

          <Text style={styles.cardTitle}>
            📊 Mes statistiques
          </Text>

          <View style={styles.item}>
            <Ionicons
              name="car-sport-outline"
              size={22}
              color="#0B6E4F"
            />

            <Text style={styles.itemText}>
              Courses : {user.totalRides || 0}
            </Text>

          </View>
          {user.totalRides === 0 && (

            <Text style={styles.empty}>
              Vous n'avez encore effectué aucune course.
            </Text>

          )}

          {user.role === "driver" && (

            <>
              <View style={styles.item}>

                <Ionicons
                  name="star-outline"
                  size={22}
                  color="#0B6E4F"
                />

                <Text style={styles.itemText}>
                  ⭐ {Number(user.averageRating || 0).toFixed(1)} / 5
                </Text>

              </View>

              <View style={styles.item}>

                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={22}
                  color="#0B6E4F"
                />

                <Text style={styles.itemText}>
                  {user.totalRatings || 0} avis
                </Text>

              </View>
            </>

          )}

        </View>
        {user.role === "driver" && (

          <View style={styles.card}>

            <Text style={styles.cardTitle}>
              Derniers avis
            </Text>

            {reviews.length === 0 && (

              <Text>
                Aucun avis pour le moment.
              </Text>

            )}

            {reviews.slice(0, 5).map((review) => (

              <View
                key={review.id}
                style={styles.review}
              >

                <Text style={styles.reviewStars}>
                  {"⭐".repeat(review.rating)}
                </Text>

                <Text style={styles.reviewComment}>
                  {review.comment || "Aucun commentaire"}
                </Text>
                <Text style={styles.reviewDate}>
                  {new Date(review.createdAt).toLocaleDateString()}
                </Text>
                {review.tags?.length > 0 && (

                  <View style={styles.reviewTags}>

                    {review.tags.map((tag) => (

                      <View
                        key={tag}
                        style={styles.reviewTag}
                      >

                        <Text style={styles.reviewTagText}>
                          {tag}
                        </Text>

                      </View>

                    ))}

                  </View>

                )}
              </View>

            ))}

          </View>

        )}
        {/* Modifier */}

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {

            if (user.role === "driver") {

              router.push("/(driver)/edit-profile");

            } else {

              router.push("/(passenger)/edit-profile");

            }

          }}
        >

          <Ionicons
            name="create-outline"
            size={24}
            color="#0B6E4F"
          />

          <Text style={styles.actionText}>
            Modifier mon profil
          </Text>

        </TouchableOpacity>

        {/* Déconnexion */}

        <TouchableOpacity
          style={styles.logout}
          onPress={logout}
        >

          <Ionicons
            name="log-out-outline"
            size={24}
            color="#FFF"
          />

          <Text style={styles.logoutText}>
            Déconnexion
          </Text>

        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );

}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 20,
  },

  avatarContainer: {
    alignItems: "center",
    marginTop: 20,
  },

  avatar: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "#0B6E4F",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },

  name: {
    textAlign: "center",
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 20,
    color: "#222",
  },

  phone: {
    textAlign: "center",
    marginTop: 8,
    color: "#666",
    fontSize: 17,
  },

  roleBadge: {
    alignSelf: "center",
    marginTop: 20,
    backgroundColor: "#F4C300",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },

  roleText: {
    fontWeight: "bold",
    fontSize: 16,
  },
  card: {
    width: "100%",
    backgroundColor: "#F8F8F8",
    borderRadius: 18,
    padding: 20,
    marginTop: 25,
  },

  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0B6E4F",
    marginBottom: 20,
  },

  item: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },

  itemText: {
    marginLeft: 15,
    fontSize: 17,
    color: "#333",
  },
  cameraButton: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F4C300",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFF",
  },
  actionButton: {
    marginTop: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8F8F8",
    padding: 18,
    borderRadius: 15,
  },

  actionText: {
    marginLeft: 12,
    fontSize: 18,
    fontWeight: "bold",
  },

  logout: {
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E53935",
    padding: 18,
    borderRadius: 15,
    marginBottom: 40,
  },

  logoutText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 18,
    marginLeft: 12,
  },
  review: {
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
    paddingVertical: 12,
  },

  reviewStars: {
    fontSize: 18,
    marginBottom: 5,
  },

  reviewComment: {
    color: "#444",
    fontSize: 16,
  },
  reviewTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
  },

  reviewTag: {
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 8,
  },

  reviewTagText: {
    color: "#0B6E4F",
    fontWeight: "600",
  },
  reviewDate: {
    color: "#888",
    fontSize: 13,
    marginTop: 5,
  },
  empty: {
    marginTop: 10,
    fontStyle: "italic",
    color: "#777",
  }
});