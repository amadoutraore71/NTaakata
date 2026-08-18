import { LOCATION_CATEGORIES } from "../constants/locationCategories";

/**
 * Retourne une catégorie à partir de son id
 */
export function getCategoryById(id) {
  return LOCATION_CATEGORIES.find(
    (category) => category.id === id
  );
}

/**
 * Retourne une catégorie à partir d'un type OSM
 * Exemple : hospital -> health
 */
export function getCategoryByType(type) {
  return LOCATION_CATEGORIES.find((category) =>
    category.types.includes(type)
  );
}

/**
 * Retourne l'icône d'une catégorie
 */
export function getCategoryIcon(typeOrId) {
  const category =
    getCategoryByType(typeOrId) ||
    getCategoryById(typeOrId);

  return category?.icon || "📍";
}

/**
 * Retourne la couleur d'une catégorie
 */
export function getCategoryColor(typeOrId) {
  const category =
    getCategoryByType(typeOrId) ||
    getCategoryById(typeOrId);

  return category?.color || "#4CAF50";
}

/**
 * Retourne le libellé d'une catégorie
 */
export function getCategoryLabel(typeOrId) {
  const category =
    getCategoryByType(typeOrId) ||
    getCategoryById(typeOrId);

  return category?.label || "Autre";
}