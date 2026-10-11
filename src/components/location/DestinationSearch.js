import { useEffect, useRef, useState } from "react";

import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import { searchLocations } from "../../../services/locationService";

import {
  getRecentDestinations,
  saveRecentDestination,
} from "../../services/recentDestinationService";

import { formatLocation } from "../../utils/locationFormatter";

export default function DestinationSearch({
  userId,
  placeholder = "Où allez-vous ?",
  onSelect,
}) {
  const [text, setText] = useState("");
  const [results, setResults] = useState([]);
  const [recentDestinations, setRecentDestinations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [destinationSelected, setDestinationSelected] = useState(false);

  const timer = useRef(null);
  const searchId = useRef(0);

  // ============================================================
  // NORMALISATION DES COORDONNÉES
  // ============================================================

  function normalizeLocation(location) {
    if (!location) return null;

    const latitude = Number(
      location.latitude ?? location.lat
    );

    const longitude = Number(
      location.longitude ?? location.lon ?? location.lng
    );

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      console.log(
        "❌ Coordonnées invalides :",
        JSON.stringify(location)
      );
      return null;
    }

    const address = String(
      location.address ??
        location.name ??
        location.display_name ??
        ""
    ).trim();

    return {
      ...location,
      latitude,
      longitude,
      address,
      name: location.name ?? address,
      city: location.city ?? "",
      region: location.region ?? "",
      category: location.category ?? location.type ?? "",
    };
  }

  // ============================================================
  // CHARGEMENT DES DESTINATIONS RÉCENTES
  // ============================================================

  useEffect(() => {
    let cancelled = false;

    async function loadRecentDestinations() {
      if (!userId) {
        setRecentDestinations([]);
        return;
      }

      try {
        const data = await getRecentDestinations(userId);

        if (!cancelled) {
          setRecentDestinations(
            Array.isArray(data) ? data : []
          );
        }
      } catch (error) {
        console.log(
          "❌ Erreur destinations récentes :",
          error
        );

        if (!cancelled) {
          setRecentDestinations([]);
        }
      }
    }

    loadRecentDestinations();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  // ============================================================
  // RECHERCHE DES LIEUX
  // ============================================================

  useEffect(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }

    if (destinationSelected) {
      setResults([]);
      setLoading(false);
      return undefined;
    }

    const searchText = text.trim();

    if (searchText.length < 2) {
      setResults([]);
      setLoading(false);
      return undefined;
    }

    const currentSearchId = ++searchId.current;

    timer.current = setTimeout(async () => {
      setLoading(true);

      try {
        const data = await searchLocations(searchText);

        // Ignorer une réponse qui appartient à une ancienne recherche.
        if (currentSearchId !== searchId.current) {
          return;
        }

        setResults(Array.isArray(data) ? data : []);
      } catch (error) {
        if (currentSearchId !== searchId.current) {
          return;
        }

        console.log(
          "❌ Erreur recherche destination :",
          error
        );

        setResults([]);
      } finally {
        if (currentSearchId === searchId.current) {
          setLoading(false);
        }
      }
    }, 300);

    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
      }
    };
  }, [text, destinationSelected]);

  // ============================================================
  // SAISIE DANS LE CHAMP
  // ============================================================

  const handleTextChange = (value) => {
    searchId.current += 1;

    setText(value);
    setDestinationSelected(false);
  };

  // ============================================================
  // SÉLECTION D'UNE DESTINATION
  // ============================================================

  async function handleSelect(location) {
    if (!location) return;

    const selectedLocation = normalizeLocation(location);

    if (!selectedLocation) {
      console.log(
        "❌ Impossible de sélectionner ce lieu : coordonnées manquantes."
      );
      return;
    }

    console.log(
      "📍 Destination sélectionnée :",
      selectedLocation.address,
      selectedLocation.latitude,
      selectedLocation.longitude
    );

    // Arrêter immédiatement les recherches en cours.
    searchId.current += 1;

    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }

    // Mettre à jour l'interface.
    setText(selectedLocation.address);
    setDestinationSelected(true);
    setResults([]);
    setLoading(false);

    Keyboard.dismiss();

    // Transmettre la destination au composant parent sans attendre
    // la sauvegarde de l'historique.
    try {
      if (typeof onSelect === "function") {
        await onSelect(selectedLocation);
      }
    } catch (error) {
      console.log(
        "❌ Erreur lors du traitement de la destination :",
        error
      );
    }

    // Enregistrer le lieu dans l'historique.
    if (userId) {
      try {
        await saveRecentDestination(
          userId,
          selectedLocation
        );

        const data = await getRecentDestinations(userId);

        setRecentDestinations(
          Array.isArray(data) ? data : []
        );
      } catch (error) {
        console.log(
          "❌ Erreur sauvegarde destination :",
          error
        );
      }
    }
  }

  // ============================================================
  // DESTINATIONS À AFFICHER
  // ============================================================

  const displayedResults = destinationSelected
    ? []
    : text.trim().length >= 2
      ? results
      : recentDestinations;

  // ============================================================
  // SUPPRESSION DES DOUBLONS
  // ============================================================

  const uniqueResults = displayedResults.filter(
    (item, index, all) => {
      const normalized = normalizeLocation(item);

      // Garder les lieux sans coordonnées visibles afin de ne pas
      // supprimer silencieusement leur affichage dans l'historique.
      if (!normalized) {
        return (
          all.findIndex(
            (other) =>
              String(other.name ?? other.address ?? "") ===
              String(item.name ?? item.address ?? "")
          ) === index
        );
      }

      return (
        all.findIndex((other) => {
          const otherLocation = normalizeLocation(other);

          return (
            otherLocation &&
            otherLocation.address === normalized.address &&
            otherLocation.latitude === normalized.latitude &&
            otherLocation.longitude === normalized.longitude
          );
        }) === index
      );
    }
  );

  // ============================================================
  // AFFICHAGE
  // ============================================================

  return (
    <View style={styles.container}>
      {/* Champ de recherche */}

      <View style={styles.inputContainer}>
        <Ionicons
          name="search-outline"
          size={21}
          color="#9CA3AF"
          style={styles.searchIcon}
        />

        <TextInput
          value={text}
          onChangeText={handleTextChange}
          placeholder={placeholder}
          placeholderTextColor="#B8B8B8"
          style={styles.input}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="sentences"
        />
      </View>

      {/* Indicateur de chargement */}

      {loading && !destinationSelected && (
        <View style={styles.loading}>
          <ActivityIndicator
            size="small"
            color="#16A34A"
          />
        </View>
      )}

      {/* Résultats de recherche et historique */}

      {!destinationSelected &&
        uniqueResults.length > 0 && (
          <View style={styles.resultsContainer}>
            {uniqueResults.map((item, index) => {
              const normalized = normalizeLocation(item);
              const formatted = formatLocation(item);

              const title =
                formatted?.title ||
                item.name ||
                item.address ||
                item.display_name ||
                "Lieu sans nom";

              const subtitle = formatted?.subtitle || "";

              return (
                <Pressable
                  key={`${item.id ?? item.placeId ?? title}-${index}`}
                  style={({ pressed }) => [
                    styles.item,
                    pressed && styles.itemPressed,
                  ]}
                  onPress={() => handleSelect(item)}
                >
                  <View style={styles.row}>
                    <View style={styles.iconContainer}>
                      <Ionicons
                        name="location"
                        size={21}
                        color="#16A34A"
                      />
                    </View>

                    <View style={styles.textContainer}>
                      <Text
                        style={styles.locationName}
                        numberOfLines={2}
                      >
                        {title}
                      </Text>

                      {!!subtitle && (
                        <Text
                          style={styles.locationSubtitle}
                          numberOfLines={2}
                        >
                          {subtitle}
                        </Text>
                      )}
                    </View>

                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color="#9CA3AF"
                    />
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
    </View>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },

  inputContainer: {
    height: 58,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    backgroundColor: "#FFFFFF",
  },

  searchIcon: {
    marginLeft: 17,
  },

  input: {
    flex: 1,
    height: "100%",
    paddingHorizontal: 12,
    fontSize: 17,
    color: "#111111",
  },

  loading: {
    paddingVertical: 12,
    alignItems: "center",
  },

  resultsContainer: {
    marginTop: 8,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EEEEEE",
  },

  item: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },

  itemPressed: {
    backgroundColor: "#F0FDF4",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
  },

  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ECFDF5",
    marginRight: 12,
  },

  textContainer: {
    flex: 1,
    paddingRight: 8,
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
});