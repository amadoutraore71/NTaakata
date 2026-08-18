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
    maxTime = 20,
}) {
    const progress =
        (countdown / maxTime) * 100;

    const opacity = useRef(
        new Animated.Value(1)
    ).current;

    const color =
        countdown > 10
            ? "#0B6E4F"
            : countdown > 5
                ? "#F4C300"
                : "#E53935";
    useEffect(() => {
        if (countdown > 5) {
            opacity.setValue(1);
            return;
        }

        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 0.3,
                    duration: 350,
                    useNativeDriver: true,
                }),

                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 350,
                    useNativeDriver: true,
                }),
            ])
        );

        animation.start();

        return () => animation.stop();

    }, [countdown]);
    useEffect(() => {
        if (countdown === 5) {
            Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Warning
            );
        }
    }, [countdown]);
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

            <View style={styles.overlay}>
                <Text style={styles.text}>
                    {countdown}s
                </Text>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({

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