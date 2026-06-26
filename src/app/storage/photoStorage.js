import AsyncStorage from "@react-native-async-storage/async-storage";

export const savePhoto = async (uri) => {
  try {
    await AsyncStorage.setItem("profilePhoto", uri);
  } catch (e) {
    console.log(e);
  }
};

export const getPhoto = async () => {
  try {
    return await AsyncStorage.getItem("profilePhoto");
  } catch (e) {
    console.log(e);
    return null;
  }
};

export const removePhoto = async () => {
  try {
    await AsyncStorage.removeItem("profilePhoto");
  } catch (e) {
    console.log(e);
  }
};