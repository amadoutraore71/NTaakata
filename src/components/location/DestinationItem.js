import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import {
    getCategoryIcon,
    getCategoryLabel,
} from "../../utils/locationCategoryUtils";

export default function DestinationItem({
    item,
    onPress,
}) {
    return (
        <TouchableOpacity
            style={styles.container}
            onPress={() => onPress(item)}
        >
            <Text style={styles.icon}>
                {getCategoryIcon(item.category)}
            </Text>

            <View style={styles.info}>
                <Text style={styles.name}>
                    {item.name}
                </Text>
                <Text style={styles.distance}>
                    {location.distance
                        ? `${location.distance.toFixed(1)} km`
                        : ""}
                </Text>
                <Text style={styles.subtitle}>
                    {getCategoryLabel(item.category)}
                    {" • "}
                    {item.city}
                </Text>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({

    container: {
        flexDirection: "row",
        alignItems: "center",
        padding: 14,
        borderBottomWidth: 1,
        borderColor: "#eee",
    },

    icon: {
        fontSize: 24,
        marginRight: 12,
    },

    info: {
        flex: 1,
    },

    name: {
        fontWeight: "700",
        fontSize: 16,
    },

    subtitle: {
        color: "#777",
        marginTop: 3,
    },
    distance: {
        color: "#0B6E4F",
        fontSize: 13,
        marginTop: 4,
        fontWeight: "600",
    },
});