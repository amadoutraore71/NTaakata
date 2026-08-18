import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View
} from "react-native";
import { searchLocations } from "../../../services/locationService";
import {
    getRecentDestinations,
    saveRecentDestination,
} from "../../services/recentDestinationService";
import { formatLocation } from "../../utils/locationFormatter";
import { Ionicons } from "@expo/vector-icons";
export default function DestinationSearch({
    userId,
    placeholder = "Où allez-vous ?",
    onSelect,
}) {
    const [text, setText] = useState("");
    const [results, setResults] = useState([]);
    const [recentDestinations, setRecentDestinations] = useState([]);
    const [loading, setLoading] = useState(false);

    const timer = useRef(null);

    /**
     * Chargement des destinations récentes
     */
    useEffect(() => {
        if (userId) {
            loadRecentDestinations();
        }
    }, [userId]);

    async function loadRecentDestinations() {
        try {
            const data = await getRecentDestinations(userId);

            setRecentDestinations(data);
        } catch (error) {
            console.log(error);
        }
    }

    /**
     * Recherche avec debounce
     */
    useEffect(() => {
        if (timer.current) {
            clearTimeout(timer.current);
        }

        if (text.trim().length < 2) {
            setResults([]);
            return;
        }

        timer.current = setTimeout(async () => {
            try {
                setLoading(true);

                const data = await searchLocations(text);

console.log(
  "Premier résultat :",
  JSON.stringify(data[0], null, 2)
);

setResults(data);
            } catch (error) {
                console.log(error);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => {
            if (timer.current) {
                clearTimeout(timer.current);
            }
        };
    }, [text]);

    /**
     * Sélection d'une destination
     */
    async function handleSelect(location) {
        const selectedLocation = {
            latitude: location.latitude,
            longitude: location.longitude,

            // Adresse utilisée partout dans l'application
            address:
                location.address ||
                location.name ||
                location.display_name ||
                "",

            // On conserve aussi les autres informations
            name: location.name,
            city: location.city,
            region: location.region,
            category: location.category,
        };

        setText(selectedLocation.address);

        setResults([]);

        try {
            if (userId) {
                await saveRecentDestination(
                    userId,
                    selectedLocation
                );

                loadRecentDestinations();
            }
        } catch (error) {
            console.log(error);
        }

        onSelect?.(selectedLocation);
    }
    const displayedResults =
        text.trim().length >= 2
            ? (results || [])
            : (recentDestinations || []);

    const uniqueResults = displayedResults.filter(
        (item, index, self) =>
            index ===
            self.findIndex(
                (x) =>
                    x.name === item.name &&
                    x.latitude === item.latitude &&
                    x.longitude === item.longitude
            )
    );

    return (
        <View style={styles.container}>
            <TextInput
                value={text}
                onChangeText={setText}
                placeholder={placeholder}
                style={styles.input}
            />

            {loading && (
                <View style={styles.loading}>
                    <ActivityIndicator
                        size="small"
                        color="#22c55e"
                    />
                </View>
            )}

            {text.trim().length < 2 &&
                recentDestinations.length > 0 && (
                    <Text style={styles.historyTitle}>
                        🕘 Destinations récentes
                    </Text>
                )}

            <View>
                {uniqueResults.map((item, index) => {
    const formatted = formatLocation(item);

    return (
        <Pressable
            key={`${item.id || item.placeId || item.name}-${index}`}
            style={styles.item}
            onPress={() => handleSelect(item)}
        >
            <View style={styles.row}>
               <Ionicons
  name="location"
  size={22}
  color="#16a34a"
  style={styles.icon}  
/>

                <View style={styles.textContainer}>
                    <Text style={styles.locationName}>
                        {formatted.title}
                    </Text>

                    <Text style={styles.locationSubtitle}>
                        {formatted.subtitle}
                    </Text>
                </View>
            </View>
        </Pressable>
    );
})}
          </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: "100%",
    },

    input: {
        height: 52,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#ddd",
        backgroundColor: "#fff",
        paddingHorizontal: 16,
        fontSize: 16,
    },

    loading: {
        marginTop: 10,
        alignItems: "center",
    },

    historyTitle: {
        marginTop: 12,
        marginBottom: 8,
        fontWeight: "700",
        fontSize: 15,
    },

    item: {
        backgroundColor: "#fff",
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
    },

    name: {
        fontSize: 16,
        fontWeight: "600",
        color: "#222",
    },

    subtitle: {
        marginTop: 3,
        color: "#777",
        fontSize: 13,
    },

    empty: {
        textAlign: "center",
        marginTop: 20,
        color: "#777",
        fontSize: 14,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
    },

    icon: {
        fontSize: 24,
        marginRight: 12,
    },

    textContainer: {
        flex: 1,
    },
  locationName: {
  fontSize: 16,
  fontWeight: "700",
  color: "#111827",
},

locationSubtitle: {
  marginTop: 3,
  fontSize: 13,
  color: "#6B7280",
  lineHeight: 18,
},
name: {
  fontSize: 16,
  fontWeight: "600",
  color: "#222",
},
});