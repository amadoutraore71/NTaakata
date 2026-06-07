import AsyncStorage from "@react-native-async-storage/async-storage";

const USER_KEY = "ntaakata_user";

export const saveUser = async (user) => {
  try {
    await AsyncStorage.setItem(
      USER_KEY,
      JSON.stringify(user)
    );
  } catch (error) {
    console.log(error);
  }
};

export const getUser = async () => {
  try {
    const user =
      await AsyncStorage.getItem(USER_KEY);

    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.log(error);
    return null;
  }
};

export const removeUser = async () => {
  try {
    await AsyncStorage.removeItem(USER_KEY);
  } catch (error) {
    console.log(error);
  }
};