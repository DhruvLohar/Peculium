import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEVICE_ID_KEY = 'device_id';
const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

function generateId(length: number): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += CHARSET.charAt(Math.floor(Math.random() * CHARSET.length));
  }
  return result;
}

export const useDeviceId = () => {
  useEffect(() => {
    AsyncStorage.getItem(DEVICE_ID_KEY).then((existing) => {
      if (!existing) {
        AsyncStorage.setItem(DEVICE_ID_KEY, generateId(24));
      }
    });
  }, []);
};
