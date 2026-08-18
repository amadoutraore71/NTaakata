import { StyleSheet, Text, View } from "react-native";

export default function TripProgressCard({
    distance,
    duration,
    eta,
}) {

    return (
        <View style={styles.container}>

            <View style={styles.item}>
                <Text style={styles.label}>
                    🚗 Distance restante
                </Text>

                <Text style={styles.value}>
                    {distance}
                </Text>
            </View>

            <View style={styles.separator} />

            <View style={styles.item}>
                <Text style={styles.label}>
                    ⏱ Temps restant
                </Text>

                <Text style={styles.value}>
                    {duration}
                </Text>
            </View>

            <View style={styles.separator} />

            <View style={styles.item}>
                <Text style={styles.label}>
                    🕓 Arrivée estimée
                </Text>

                <Text style={styles.value}>
                    {eta}
                </Text>
            </View>

        </View>
    );

}

const styles = StyleSheet.create({

    container: {
        backgroundColor: "#FFFFFF",
        marginHorizontal: 16,
        marginTop: 12,
        borderRadius: 18,
        padding: 18,
        elevation: 4,
        shadowColor: "#000",
        shadowOpacity: 0.12,
        shadowRadius: 8,
        shadowOffset: {
            width: 0,
            height: 2,
        },
    },

    item: {
        paddingVertical: 4,
    },

    separator: {
        height: 1,
        backgroundColor: "#EEEEEE",
        marginVertical: 12,
    },

    label: {
        fontSize: 14,
        color: "#666",
    },

    value: {
        marginTop: 4,
        fontSize: 20,
        fontWeight: "bold",
        color: "#111",
    },

});