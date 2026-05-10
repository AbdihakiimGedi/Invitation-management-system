import { saveAuthSession } from '@/services/auth-session';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type LoginResponse = {
  message?: string;
  error?: string;
  token?: string;
  role?: string;
  redirect_path?: string;
  user?: {
    role?: string;
    username?: string;
  };
};

type RoleRoute =
  | '/graduate-portal'
  | '/guest-portal'
  | '/vip-portal'
  | '/admin-dashboard'
  | '/qr-scanner';

const REQUEST_TIMEOUT_MS = 12000;

function getApiBaseUrl() {
  return "http://kk0g84k04ow0cgs8owsckgwg.38.242.148.212.sslip.io";
}

const API_BASE_URL = getApiBaseUrl();

const roleRoutes: Record<string, RoleRoute> = {
  graduate: '/graduate-portal',
  guest: '/guest-portal',
  vip: '/vip-portal',
  'vip guest': '/vip-portal',
  'special guest': '/vip-portal',
  admin: '/admin-dashboard',
  'attendance staff': '/qr-scanner',
  'event staff': '/qr-scanner',
};

function normalizeRole(role?: string) {
  return role?.trim().toLowerCase().replace(/\s+/g, ' ');
}

function getRoleRoute(role?: string) {
  const normalized = normalizeRole(role);
  return normalized ? roleRoutes[normalized] : undefined;
}

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async () => {
    const cleanUsername = username.trim();

    if (!cleanUsername || !password) {
      setErrorMessage('Please enter both username and password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    const requestUrl = `${API_BASE_URL}/api/v1/auth/login`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const requestPayload = {
      username: cleanUsername,
      password,
    };

    console.log('[Login] Request URL:', requestUrl);
    console.log('[Login] Request payload:', {
      username: requestPayload.username,
      passwordProvided: Boolean(requestPayload.password),
    });

    try {
      const response = await fetch(requestUrl, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      });

      const data = (await response.json().catch(() => ({}))) as LoginResponse;

      if (!response.ok) {
        const message = data.error || data.message || 'Invalid credentials.';
        console.log('[Login] Response error:', {
          status: response.status,
          message,
        });
        setErrorMessage(message);
        return;
      }

      await saveAuthSession(data.token, data.user);

      const role = data.role || data.user?.role;
      const destination = getRoleRoute(role);

      if (!destination) {
        setErrorMessage('Login succeeded, but this account role is not supported yet.');
        return;
      }

      router.replace(destination);
    } catch (error) {
      const isTimeout = error instanceof Error && error.name === 'AbortError';
      console.log('[Login] Network error:', error);
      setErrorMessage(
        isTimeout
          ? 'Server request timed out. Check your WiFi and backend URL.'
          : 'Unable to connect to the server. Make sure your phone and backend are on the same WiFi.',
      );
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#f7fbff', '#edf5ff', '#ffffff']} style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <View style={styles.container}>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.back()}
                style={styles.backButton}>
                <Text style={styles.backButtonText}>Back</Text>
              </Pressable>

              <View style={styles.header}>
                <Text style={styles.title}>Login</Text>
                <Text style={styles.subtitle}>Sign in to continue</Text>
              </View>

              <View style={styles.card}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Username</Text>
                  <TextInput
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                    onChangeText={setUsername}
                    placeholder="Student ID or email"
                    placeholderTextColor="#8a99ad"
                    returnKeyType="next"
                    style={styles.input}
                    textContentType="username"
                    value={username}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Password</Text>
                  <TextInput
                    editable={!isLoading}
                    onChangeText={setPassword}
                    placeholder="Enter password"
                    placeholderTextColor="#8a99ad"
                    returnKeyType="done"
                    secureTextEntry
                    style={styles.input}
                    textContentType="password"
                    value={password}
                    onSubmitEditing={handleLogin}
                  />
                </View>

                <Pressable
                  accessibilityRole="button"
                  disabled={isLoading}
                  onPress={handleLogin}
                  style={({ pressed }) => [
                    styles.loginButton,
                    (pressed || isLoading) && styles.loginButtonPressed,
                  ]}>
                  {isLoading ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.loginButtonText}>Login</Text>
                  )}
                </Pressable>
              </View>

              {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingVertical: 24,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 22,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  backButtonText: {
    color: '#315b91',
    fontSize: 16,
    fontWeight: '700',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    color: '#0f172a',
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: 0,
  },
  subtitle: {
    color: '#64748b',
    fontSize: 16,
    lineHeight: 22,
    marginTop: 8,
    maxWidth: 320,
    textAlign: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#dfe8f4',
    borderRadius: 22,
    backgroundColor: '#ffffff',
    gap: 18,
    padding: 20,
    shadowColor: '#10233f',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.08,
    shadowRadius: 28,
    elevation: 5,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    color: '#24364d',
    fontSize: 14,
    fontWeight: '800',
  },
  input: {
    minHeight: 56,
    borderWidth: 1,
    borderColor: '#dbe5f1',
    borderRadius: 16,
    backgroundColor: '#ffffff',
    color: '#0f172a',
    fontSize: 16,
    paddingHorizontal: 16,
  },
  errorText: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 420,
    borderWidth: 1,
    borderColor: '#fecdd3',
    borderRadius: 14,
    backgroundColor: '#fff1f2',
    color: '#be123c',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    textAlign: 'center',
  },
  loginButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    borderRadius: 18,
    backgroundColor: '#1f6feb',
    marginTop: 4,
  },
  loginButtonPressed: {
    opacity: 0.82,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
  },
});
