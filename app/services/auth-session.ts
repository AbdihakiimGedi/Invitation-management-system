import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

export type AuthUser = {
  id?: string;
  username?: string;
  role?: string;
};

export async function saveAuthSession(token: string | undefined, user: AuthUser | undefined) {
  if (token) await AsyncStorage.setItem('authToken', token);
  if (user) await AsyncStorage.setItem('authUser', JSON.stringify(user));
}

export async function clearAuthSession() {
  await AsyncStorage.multiRemove(['authToken', 'authUser', 'portalSession']);
}

export async function getAuthUser() {
  const [token, storedUser] = await Promise.all([
    AsyncStorage.getItem('authToken'),
    AsyncStorage.getItem('authUser'),
  ]);

  if (!token) return null;
  if (!storedUser) return {};

  try {
    return JSON.parse(storedUser) as AuthUser;
  } catch {
    await clearAuthSession();
    return null;
  }
}

export async function requireStoredRole(allowedRoles: string[]) {
  const user = await getAuthUser();
  if (!user) {
    router.replace('/login');
    return false;
  }

  if (!user.role || !allowedRoles.includes(user.role)) {
    if (!user.role) await clearAuthSession();
    router.replace('/');
    return false;
  }

  return true;
}
