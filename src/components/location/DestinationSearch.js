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
  const [recentDestinations, setRecentDestinations] =
    useState([]);

  const [loading, setLoading] = useState(false);

  // Indique qu'une destination vient d'être sélectionnée
  const [destinationSelected, setDestinationSelected] =
    useState(false);

  const timer = useRef(null);

  // Permet d'ignorer une ancienne recherche
  // qui terminerait après une nouvelle recherche
  const searchId = useRef(0);

  // ============================================================
  // DESTINATIONS RÉCENTES
  // ============================================================

  useEffect(() => {
    if (userId) {
      loadRecentDestinations();
    }
  }, [userId]);

  async function loadRecentDestinations() {
    try {
      const data = await getRecentDestinations(userId);

      setRecentDestinations(
        Array.isArray(data) ? data : []
      );
    } catch (error) {
      console.log(
        "Erreur destinations récentes :",
        error
      );

      setRecentDestinations([]);
    }
  }

  // ============================================================
  // RECHERCHE
  // ============================================================

  useEffect(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }

    // Une destination vient d'être sélectionnée
    if (destinationSelected) {
      setResults([]);
      setLoading(false);
      return;
    }

    const searchText = text.trim();

    // Moins de 2 caractères :
    // on affiche les destinations récentes
    if (searchText.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    const currentSearchId = ++searchId.current;

    timer.current = setTimeout(async () => {
      try {
        setLoading(true);

        const data = await searchLocations(searchText);

        // Si une autre recherche est plus récente,
        // on ignore cette réponse
        if (currentSearchId !== searchId.current) {
          return;
        }

        console.log(
          "Premier résultat :",
          JSON.stringify(data?.[0], null, 2)
        );

        setResults(
          Array.isArray(data) ? data : []
        );
      } catch (error) {
        if (currentSearchId !== searchId.current) {
          return;
        }

        console.log(
          "Erreur recherche destination :",
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
  // SAISIE
  // ============================================================

  const handleTextChange = (value) => {
    setText(value);

    // L'utilisateur recommence à écrire :
    // on réactive les suggestions
    setDestinationSelected(false);

    // Une nouvelle recherche devient prioritaire
    searchId.current += 1;
  };

  // ============================================================
  // SÉLECTION D'UNE DESTINATION
  // ============================================================

  async function handleSelect(location) {
    if (!location) {
      return;
    }

    const selectedLocation = {
      latitude: Number(location.latitude),
      longitude: Number(location.longitude),

      address:
        location.address ||
        location.name ||
        location.display_name ||
        "",

      name: location.name || "",
      city: location.city || "",
      region: location.region || "",
      category: location.category || "",
    };

    // ----------------------------------------------------------
    // 1. Afficher le lieu sélectionné dans le champ
    // ----------------------------------------------------------

    setText(selectedLocation.address);

    // ----------------------------------------------------------
    // 2. Marquer immédiatement comme sélectionné
    // ----------------------------------------------------------

    setDestinationSelected(true);

    // ----------------------------------------------------------
    // 3. Supprimer immédiatement les suggestions
    // ----------------------------------------------------------

    setResults([]);

    // ----------------------------------------------------------
    // 4. Arrêter le chargement
    // ----------------------------------------------------------

    setLoading(false);

    // ----------------------------------------------------------
    // 5. Invalider les anciennes recherches
    // ----------------------------------------------------------

    searchId.current += 1;

    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }

    // ----------------------------------------------------------
    // 6. Fermer le clavier
    // ----------------------------------------------------------

    Keyboard.dismiss();

    // ----------------------------------------------------------
    // 7. Sauvegarder dans les destinations récentes
    // ----------------------------------------------------------

    try {
      if (userId) {
        await saveRecentDestination(
          userId,
          selectedLocation
        );

        await loadRecentDestinations();
      }
    } catch (error) {
      console.log(
        "Erreur sauvegarde destination :",
        error
      );
    }

    // ----------------------------------------------------------
    // 8. Envoyer la destination au parent
    // ----------------------------------------------------------

    onSelect?.(selectedLocation);
  }

  // ============================================================
  // DESTINATIONS À AFFICHER
  // ============================================================

  let displayedResults = [];

  if (!destinationSelected) {
    if (text.trim().length >= 2) {
      displayedResults = results || [];
    } else {
      displayedResults =
        recentDestinations || [];
    }
  }

  // ============================================================
  // SUPPRESSION DES DOUBLONS
  // ============================================================

  const uniqueResults = displayedResults.filter(
    (item, index, self) =>
      index ===
      self.findIndex(
        (x) =>
          x.name === item.name &&
          Number(x.latitude) ===
            Number(item.latitude) &&
          Number(x.longitude) ===
            Number(item.longitude)
      )
  );

  // ============================================================
  // AFFICHAGE
  // ============================================================

  return (
    <View style={styles.container}>

      {/* ======================================================
          CHAMP DE RECHERCHE
      ====================================================== */}

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

      {/* ======================================================
          CHARGEMENT
      ====================================================== */}

      {loading && !destinationSelected && (
        <View style={styles.loading}>
          <ActivityIndicator
            size="small"
            color="#16A34A"
          />
        </View>
      )}

      {/* ======================================================
          LISTE DES DESTINATIONS
      ====================================================== */}

      {!destinationSelected &&
        uniqueResults.length > 0 && (
          <View style={styles.resultsContainer}>
            {uniqueResults.map((item, index) => {
              const formatted =
                formatLocation(item);

              return (
                <Pressable
                  key={`${
                    item.id ||
                    item.placeId ||
                    item.name ||
                    "destination"
                  }-${index}`}
                  style={({ pressed }) => [
                    styles.item,
                    pressed && styles.itemPressed,
                  ]}
                  onPress={() =>
                    handleSelect(item)
                  }
                >
                  <View style={styles.row}>

                    <View style={styles.iconContainer}>
                      <Ionicons
                        name="location"
                        size={21}
                        color="#16A34A"
                      />
                    </View>

                    <View
                      style={
                        styles.textContainer
                      }
                    >
                      <Text
                        style={
                          styles.locationName
                        }
                        numberOfLines={2}
                      >
                        {formatted.title}
                      </Text>

                      {formatted.subtitle ? (
                        <Text
                          style={
                            styles.locationSubtitle
                          }
                          numberOfLines={2}
                        >
                          {
                            formatted.subtitle
                          }
                        </Text>
                      ) : null}
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

  // ----------------------------------------------------------
  // CHARGEMENT
  // ----------------------------------------------------------

  loading: {
    paddingVertical: 12,

    alignItems: "center",
  },

  // ----------------------------------------------------------
  // RÉSULTATS
  // ----------------------------------------------------------

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