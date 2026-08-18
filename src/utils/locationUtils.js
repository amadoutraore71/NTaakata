/**
 * Normalise un texte
 */
function normalizeText(text = "") {
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
function generateSearchTokens(name, aliases = []) {
  const values = [name, ...aliases].filter(Boolean);

  const tokens = new Set();

  values.forEach((value) => {
    const normalized = normalizeText(value);

    if (!normalized) return;

    // Nom complet
    tokens.add(normalized);

    const words = normalized.split(" ");

    // Chaque mot
    words.forEach((word) => {
      if (word.length >= 2) {
        tokens.add(word);
      }
    });

    // Toutes les combinaisons
    for (let i = 0; i < words.length; i++) {
      let phrase = "";

      for (let j = i; j < words.length; j++) {
        phrase += (phrase ? " " : "") + words[j];

        if (phrase.length >= 2) {
          tokens.add(phrase);
        }
      }
    }
  });

  return [...tokens];
}

module.exports = {
  normalizeText,
  generateSearchTokens,
};