import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#f6f8fb' },
      }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="graduate-portal" />
      <Stack.Screen name="guest-portal" />
      <Stack.Screen name="vip-portal" />
      <Stack.Screen name="admin-dashboard" />
      <Stack.Screen name="qr-scanner" />
      <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
