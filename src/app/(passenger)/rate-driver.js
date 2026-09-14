import { useEffect, useRef, useState } from "react";

import {
  Alert,
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import {
  router,
  useLocalSearchParams,
} from "expo-router";

import {
  addDoc,
  collection,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";

import { db } from "../../../firebase/config";

import AppHeader from "../../components/AppHeader";

export default function RateDriver() {

  const { rideId } =
    useLocalSearchParams();

  // =====================================================
  // ÉTATS
  // =====================================================

  const [rating, setRating] =
    useState(0);

  const [loading, setLoading] =
    useState(false);

  const [ridePrice, setRidePrice] =
    useState(null);

  const [rideDistance, setRideDistance] =
    useState(null);

  // =====================================================
  // ANIMATIONS
  // =====================================================

  const fadeAnim =
    useRef(
      new Animated.Value(0)
    ).current;

  const slideAnim =
    useRef(
      new Animated.Value(25)
    ).current;

  const scaleAnim =
    useRef(
      new Animated.Value(0.94)
    ).current;

  const successPulse =
    useRef(
      new Animated.Value(0)
    ).current;

  const starAnimations =
    useRef(
      [1, 2, 3, 4, 5].map(
        () => new Animated.Value(1)
      )
    ).current;

  // =====================================================
  // ANIMATION ENTRÉE
  // =====================================================

  useEffect(() => {

    Animated.parallel([

      Animated.timing(
        fadeAnim,
        {
          toValue: 1,
          duration: 550,
          easing:
            Easing.out(
              Easing.cubic
            ),
          useNativeDriver: true,
        }
      ),

      Animated.spring(
        slideAnim,
        {
          toValue: 0,
          damping: 15,
          stiffness: 120,
          useNativeDriver: true,
        }
      ),

      Animated.spring(
        scaleAnim,
        {
          toValue: 1,
          damping: 13,
          stiffness: 120,
          useNativeDriver: true,
        }
      ),

    ]).start();

  }, []);

  // =====================================================
  // CHARGER LA COURSE
  // =====================================================

  useEffect(() => {

    const loadRide =
      async () => {

        if (!rideId) {
          return;
        }

        try {

          const rideRef =
            doc(
              db,
              "rides",
              rideId
            );

          const snapshot =
            await getDoc(
              rideRef
            );

          if (
            !snapshot.exists()
          ) {
            return;
          }

          const ride =
            snapshot.data();

          setRidePrice(
            Number(
              ride.estimatedPrice || 0
            )
          );

          setRideDistance(
            Number(
              ride.estimatedDistance ||
              0
            )
          );

        } catch (error) {

          console.log(
            "❌ Erreur chargement course :",
            error
          );

        }

      };

    loadRide();

  }, [rideId]);

  // =====================================================
  // ANIMATION ÉTOILE
  // =====================================================

  const animateStar =
    (value) => {

      const index =
        value - 1;

      starAnimations[
        index
      ].setValue(0.55);

      Animated.spring(
        starAnimations[index],
        {
          toValue: 1,
          damping: 7,
          stiffness: 220,
          useNativeDriver: true,
        }
      ).start();

    };

  // =====================================================
  // ENREGISTRER LA NOTE
  // =====================================================

  const submitRating =
    async (
      selectedRating
    ) => {

      if (
        loading ||
        !selectedRating ||
        !rideId
      ) {
        return;
      }

      try {

        setLoading(true);

        // ===============================================
        // COURSE
        // ===============================================

        const rideRef =
          doc(
            db,
            "rides",
            rideId
          );

        const rideSnapshot =
          await getDoc(
            rideRef
          );

        if (
          !rideSnapshot.exists()
        ) {

          Alert.alert(
            "Erreur",
            "Cette course n'existe plus."
          );

          return;

        }

        const ride =
          rideSnapshot.data();

        // ===============================================
        // DÉJÀ NOTÉE
        // ===============================================

        if (
          ride.ratingSubmitted === true
        ) {

          router.replace(
            "/(passenger)/home"
          );

          return;

        }

        // ===============================================
        // CONDUCTEUR
        // ===============================================

        const driverId =
          ride.driverId;

        if (!driverId) {

          Alert.alert(
            "Erreur",
            "Aucun conducteur associé à cette course."
          );

          return;

        }

        // ===============================================
        // CONDUCTEUR
        // ===============================================

        const driverRef =
          doc(
            db,
            "users",
            driverId
          );

        const driverSnapshot =
          await getDoc(
            driverRef
          );

        if (
          !driverSnapshot.exists()
        ) {

          Alert.alert(
            "Erreur",
            "Le conducteur est introuvable."
          );

          return;

        }

        const driver =
          driverSnapshot.data();

        // ===============================================
        // ANCIENNES NOTES
        // ===============================================

        const totalRatings =
          Number(
            driver.totalRatings || 0
          );

        const averageRating =
          Number(
            driver.averageRating || 0
          );

        // ===============================================
        // NOUVELLE MOYENNE
        // ===============================================

        const newTotalRatings =
          totalRatings + 1;

        const newAverageRating =
          (
            averageRating *
              totalRatings +
            selectedRating
          ) /
          newTotalRatings;

        const roundedAverage =
          Number(
            newAverageRating.toFixed(
              1
            )
          );

        // ===============================================
        // ENREGISTRER L'AVIS
        // ===============================================

        await addDoc(
          collection(
            db,
            "reviews"
          ),
          {
            rideId,

            driverId,

            driverName:
              driver.name ??
              "Conducteur",

            passengerId:
              ride.passengerId ??
              null,

            rating:
              selectedRating,

            ridePrice:
              ride.estimatedPrice ??
              0,

            rideDistance:
              ride.estimatedDistance ??
              0,

            createdAt:
              new Date().toISOString(),
          }
        );

        // ===============================================
        // MARQUER LA COURSE COMME NOTÉE
        // ===============================================

        await updateDoc(
          rideRef,
          {
            rating:
              selectedRating,

            ratingSubmitted:
              true,
          }
        );

        // ===============================================
        // METTRE À JOUR LE CONDUCTEUR
        // ===============================================

        await updateDoc(
          driverRef,
          {
            totalRatings:
              newTotalRatings,

            averageRating:
              roundedAverage,
          }
        );

        // ===============================================
        // ANIMATION SUCCÈS
        // ===============================================

        Animated.sequence([

          Animated.timing(
            successPulse,
            {
              toValue: 1,
              duration: 220,
              useNativeDriver: true,
            }
          ),

          Animated.timing(
            successPulse,
            {
              toValue: 0,
              duration: 220,
              useNativeDriver: true,
            }
          ),

        ]).start();

        // ===============================================
        // RETOUR ACCUEIL
        // ===============================================

        Alert.alert(
          "Merci ❤️",
          "Votre note a bien été enregistrée.",
          [
            {
              text: "OK",

              onPress: () => {

                router.replace(
                  "/(passenger)/home"
                );

              },
            },
          ]
        );

      } catch (error) {

        console.error(
          "❌ Erreur notation :",
          error
        );

        Alert.alert(
          "Erreur",
          "Impossible d'enregistrer votre note."
        );

      } finally {

        setLoading(false);

      }

    };

  // =====================================================
  // CHOISIR UNE NOTE
  // =====================================================

  const handleRating =
    async (value) => {

      if (loading) {
        return;
      }

      setRating(value);

      animateStar(value);

      await submitRating(
        value
      );

    };

  // =====================================================
  // MESSAGE SELON LA NOTE
  // =====================================================

  const getRatingMessage =
    () => {

      switch (rating) {

        case 5:
          return "Excellent ! 🤩";

        case 4:
          return "Très bien ! 😊";

        case 3:
          return "Bien 👍";

        case 2:
          return "Peut mieux faire 😐";

        case 1:
          return "Nous ferons mieux 🙏";

        default:
          return "Choisissez une note";

      }

    };

  // =====================================================
  // ANIMATION PRINCIPALE
  // =====================================================

  const animatedContainerStyle = {

    opacity:
      fadeAnim,

    transform: [

      {
        translateY:
          slideAnim,
      },

      {
        scale:
          scaleAnim,
      },

    ],

  };

  // =====================================================
  // ANIMATION SUCCÈS
  // =====================================================

  const successStyle = {

    transform: [

      {

        scale:
          successPulse.interpolate({

            inputRange: [
              0,
              1,
            ],

            outputRange: [
              1,
              1.1,
            ],

          }),

      },

    ],

  };

  // =====================================================
  // INTERFACE
  // =====================================================

  return (

    <SafeAreaView
      style={styles.container}
    >

     

      <Animated.ScrollView
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.content
        }
        style={
          animatedContainerStyle
        }
      >

        {/* =============================================
            ICÔNE DE FIN
        ============================================= */}

        <Animated.View
          style={[
            styles.successCircle,
            successStyle,
          ]}
        >

          <Text
            style={styles.successIcon}
          >
            ✓
          </Text>

        </Animated.View>


        {/* =============================================
            TITRE
        ============================================= */}

        <Text
          style={styles.title}
        >
          Course terminée !
        </Text>


        {/* =============================================
            RÉSUMÉ
        ============================================= */}

        <View
          style={styles.summaryCard}
        >

          <View
            style={styles.summaryItem}
          >

            <Text
              style={styles.summaryIcon}
            >
              💰
            </Text>

            <View>

              <Text
                style={
                  styles.summaryLabel
                }
              >
                Prix
              </Text>

              <Text
                style={
                  styles.summaryValue
                }
              >
                {ridePrice !== null
                  ? `${ridePrice.toLocaleString()} FCFA`
                  : "--"}
              </Text>

            </View>

          </View>


          <View
            style={
              styles.summaryDivider
            }
          />


          <View
            style={styles.summaryItem}
          >

            <Text
              style={styles.summaryIcon}
            >
              📍
            </Text>

            <View>

              <Text
                style={
                  styles.summaryLabel
                }
              >
                Distance
              </Text>

              <Text
                style={
                  styles.summaryValue
                }
              >
                {rideDistance !== null
                  ? `${rideDistance.toFixed(
                      1
                    )} km`
                  : "--"}
              </Text>

            </View>

          </View>

        </View>


        {/* =============================================
            QUESTION
        ============================================= */}

        <View
          style={
            styles.ratingSection
          }
        >

          <Text
            style={styles.question}
          >
            Comment s'est passée
            votre course ?
          </Text>

          <Text
            style={
              styles.questionSub
            }
          >
            Votre avis nous aide à
            améliorer N'Taakata.
          </Text>


          {/* ===========================================
              ÉTOILES
          =========================================== */}

          <View
            style={styles.stars}
          >

            {[1, 2, 3, 4, 5].map(
              (star) => (

                <TouchableOpacity
                  key={star}
                  disabled={loading}
                  activeOpacity={0.7}
                  onPress={() =>
                    handleRating(
                      star
                    )
                  }
                >

                  <Animated.Text
                    style={[

                      styles.star,

                      star <= rating &&
                        styles.starActive,

                      {
                        transform: [
                          {
                            scale:
                              starAnimations[
                                star - 1
                              ],
                          },
                        ],
                      },

                    ]}
                  >

                    {star <= rating
                      ? "★"
                      : "☆"}

                  </Animated.Text>

                </TouchableOpacity>

              )
            )}

          </View>


          {/* =========================================
              MESSAGE NOTE
          ========================================= */}

          <Text
            style={
              styles.ratingMessage
            }
          >
            {getRatingMessage()}
          </Text>

        </View>

      </Animated.ScrollView>

    </SafeAreaView>

  );
}


// =======================================================
// STYLES
// =======================================================

const styles =
  StyleSheet.create({

    // ===================================================
    // CONTAINER
    // ===================================================

    container: {
      flex: 1,
      backgroundColor:
        "#F5FBF8",
    },

    content: {
      paddingHorizontal: 20,
      paddingTop: 30,
      paddingBottom: 40,
      alignItems: "stretch",
    },


    // ===================================================
    // ICÔNE
    // ===================================================

    successCircle: {
      width: 82,
      height: 82,
      borderRadius: 41,
      alignSelf: "center",
      backgroundColor:
        "#0B6E4F",

      alignItems: "center",
      justifyContent: "center",

      marginBottom: 18,

      shadowColor:
        "#0B6E4F",

      shadowOpacity: 0.20,

      shadowRadius: 13,

      shadowOffset: {
        width: 0,
        height: 6,
      },

      elevation: 7,
    },

    successIcon: {
      fontSize: 46,
      color: "#FFFFFF",
      fontWeight: "900",
    },


    // ===================================================
    // TITRE
    // ===================================================

    title: {
      fontSize: 28,
      fontWeight: "800",
      color: "#173B30",
      textAlign: "center",
      marginBottom: 30,
    },


    // ===================================================
    // RÉSUMÉ
    // ===================================================

    summaryCard: {
      backgroundColor:
        "#0B6E4F",

      borderRadius: 20,

      padding: 18,

      flexDirection: "row",

      alignItems: "center",

      marginBottom: 38,

      shadowColor:
        "#0B6E4F",

      shadowOpacity: 0.18,

      shadowRadius: 12,

      shadowOffset: {
        width: 0,
        height: 6,
      },

      elevation: 5,
    },

    summaryItem: {
      flex: 1,

      flexDirection: "row",

      alignItems: "center",
    },

    summaryIcon: {
      fontSize: 25,

      marginRight: 10,
    },

    summaryLabel: {
      fontSize: 12,

      color: "#D1ECE2",

      marginBottom: 2,
    },

    summaryValue: {
      fontSize: 17,

      color: "#FFFFFF",

      fontWeight: "800",
    },

    summaryDivider: {
      width: 1,

      height: 42,

      backgroundColor:
        "rgba(255,255,255,0.25)",

      marginHorizontal: 12,
    },


    // ===================================================
    // NOTATION
    // ===================================================

    ratingSection: {
      alignItems: "center",

      paddingHorizontal: 5,
    },

    question: {
      fontSize: 23,

      fontWeight: "800",

      color: "#173B30",

      textAlign: "center",
    },

    questionSub: {
      marginTop: 8,

      fontSize: 14,

      color: "#7A8983",

      textAlign: "center",

      lineHeight: 20,
    },


    // ===================================================
    // ÉTOILES
    // ===================================================

    stars: {
      flexDirection: "row",

      alignItems: "center",

      justifyContent: "center",

      marginTop: 26,
    },

    star: {
      fontSize: 56,

      color: "#CBD5D0",

      marginHorizontal: 3,
    },

    starActive: {
      color: "#F2B840",

      textShadowColor:
        "rgba(242,184,64,0.25)",

      textShadowRadius: 8,
    },

    ratingMessage: {
      marginTop: 10,

      fontSize: 17,

      fontWeight: "800",

      color: "#0B6E4F",

      textAlign: "center",
    },

  });