/**
 * Normalise un texte
 * Exemple :
 * "Hôpital du Mali"
 * devient :
 * "hopital du mali"
 */
export function normalizeText(text = "") {
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Génère les mots-clés de recherche
 */
export function generateSearchTokens(name, aliases = []) {
  const values = [name, ...aliases].filter(Boolean);

  const tokens = new Set();

  values.forEach((value) => {
    const normalized = normalizeText(value);

    if (!normalized) return;

    // Nom complet
    tokens.add(normalized);

    const words = normalized.split(" ");

    words.forEach((word) => {
      if (word.length < 2) return;

      // Mot complet
      tokens.add(word);

      // Préfixes du mot
      for (let i = 1; i <= word.length; i++) {
        tokens.add(word.substring(0, i));
      }
    });

    // Combinaisons de mots
    for (let i = 0; i < words.length; i++) {
      let phrase = "";

      for (let j = i; j < words.length; j++) {
        phrase += (phrase ? " " : "") + words[j];

        tokens.add(phrase);

        // Préfixes de la phrase
        for (let k = 1; k <= phrase.length; k++) {
          tokens.add(phrase.substring(0, k));
        }
      }
    }
  });

  return [...tokens];
}

/**
 * Crée un objet Location standard pour N'Taakata
 */
export function createLocation({
  name,
  aliases = [],
  type = "other",
  category = "other",
  city = "",
  region = "",
  latitude,
  longitude,
  popularity = 50,
}) {
  const normalizedAliases = aliases.map(normalizeText);

  return {
    name,

    normalizedName: normalizeText(name),

    aliases: normalizedAliases,

    searchTokens: generateSearchTokens(
      name,
      normalizedAliases
    ),

    type,

    category,

    city,

    region,

    latitude: Number(latitude),

    longitude: Number(longitude),

    popularity,

    active: true,

    createdAt: new Date(),

    updatedAt: new Date(),
  };
}