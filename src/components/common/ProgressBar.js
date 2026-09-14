import * as Haptics from "expo-haptics";

import {
  useEffect,
  useRef,
} from "react";

import {
  Animated,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function ProgressBar({
  countdown,
  maxTime = 60,
}) {

  // =====================================================
  // PROGRESSION
  // =====================================================

  const progress =
    Math.max(
      0,
      Math.min(
        100,
        (countdown / maxTime) * 100
      )
    );

  // =====================================================
  // OPACITÉ
  // =====================================================

  const opacity =
    useRef(
      new Animated.Value(1)
    ).current;

  // =====================================================
  // COULEUR
  // =====================================================

  const color =
    countdown > 20
      ? "#0B6E4F"
      : countdown > 10
        ? "#F4C300"
        : "#E53935";

  // =====================================================
  // ANIMATION DERNIÈRES SECONDES
  // =====================================================

  useEffect(() => {

    if (countdown > 10) {

      opacity.setValue(1);

      return;
    }

    const animation =
      Animated.loop(

        Animated.sequence([

          Animated.timing(
            opacity,
            {
              toValue: 0.3,
              duration: 350,
              useNativeDriver: true,
            }
          ),

          Animated.timing(
            opacity,
            {
              toValue: 1,
              duration: 350,
              useNativeDriver: true,
            }
          ),

        ])

      );

    animation.start();

    return () => {
      animation.stop();
    };

  }, [countdown]);

  // =====================================================
  // VIBRATION À 10 SECONDES
  // =====================================================

  useEffect(() => {

    if (countdown === 10) {

      Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Warning
      );

    }

  }, [countdown]);

  // =====================================================
  // AFFICHAGE
  // =====================================================

  return (

    <Animated.View
      style={[
        styles.container,
        {
          opacity,
        },
      ]}
    >

      <View
        style={[
          styles.progress,
          {
            width: `${progress}%`,
            backgroundColor: color,
          },
        ]}
      />

      <View
        style={styles.overlay}
      >

        <Text
          style={styles.text}
        >
          {countdown}s
        </Text>

      </View>

    </Animated.View>

  );
}


// =======================================================
// STYLES
// =======================================================

const styles =
  StyleSheet.create({

    container: {
      height: 32,
      backgroundColor: "#E5E5E5",
      borderRadius: 16,
      overflow: "hidden",
      marginVertical: 15,
    },

    progress: {
      height: "100%",
      borderRadius: 16,
    },

    overlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: "center",
      alignItems: "center",
    },

    text: {
      color: "#FFF",
      fontSize: 16,
      fontWeight: "bold",
    },

  });