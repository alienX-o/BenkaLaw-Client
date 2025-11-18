import AsyncStorage from '@react-native-async-storage/async-storage';

export const setItem = async (key, value) => {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (e) {
    console.log('Error Storing Value', e);
  }
};

export const getItem = async key => {
  try {
    return await AsyncStorage.getItem(key);
  } catch (e) {
    console.log('Error Retrieving Value', e);
  }
};

export const removeItem = async key => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (e) {
    console.log('Error Deleting Value', e);
  }
};
