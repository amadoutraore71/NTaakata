import AsyncStorage from "@react-native-async-storage/async-storage";

const PHOTO_KEY = "profile_photo";

export const savePhoto = async (uri) => {
  try {
    await AsyncStorage.setItem(PHOTO_KEY, uri);
  } catch (error) {
    console.log("Erreur savePhoto :", error);
  }
};

export const getPhoto = async () => {
  try {
    return await AsyncStorage.getItem(PHOTO_KEY);
  } catch (error) {
    console.log("Erreur getPhoto :", error);
    return null;
  }
};

export const removePhoto = async () => {
  try {
    await AsyncStorage.removeItem(PHOTO_KEY);
  } catch (error) {
    console.log("Erreur removePhoto :", error);
  }
};