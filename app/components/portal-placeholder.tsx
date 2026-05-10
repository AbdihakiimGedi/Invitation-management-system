import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type PortalPlaceholderProps = {
  title: string;
  description: string;
};

export function PortalPlaceholder({ title, description }: PortalPlaceholderProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Signed in</Text>
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
        <Pressable accessibilityRole="button" onPress={() => router.replace('/')} style={styles.button}>
          <Text style={styles.buttonText}>Back to Welcome</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f7fbff',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  badge: {
    borderRadius: 999,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginBottom: 18,
  },
  badgeText: {
    color: '#166534',
    fontSize: 13,
    fontWeight: '800',
  },
  title: {
    color: '#0f172a',
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'center',
  },
  description: {
    color: '#64748b',
    fontSize: 15,
    lineHeight: 23,
    marginTop: 12,
    maxWidth: 320,
    textAlign: 'center',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: '#1f6feb',
    marginTop: 34,
    paddingHorizontal: 22,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
});
