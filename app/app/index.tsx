import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WelcomeScreen() {
  return (
    <LinearGradient colors={['#f7fbff', '#edf7ff', '#ffffff']} style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.logo}>
              <MaterialCommunityIcons name="ticket-confirmation-outline" size={42} color="#ffffff" />
            </View>

            <Text style={styles.appName}>InviteTrack</Text>
            <Text style={styles.subtitle}>Event Invitation & Attendance System</Text>
          </View>

          <View style={styles.visualWrap}>
            <View style={styles.visualCard}>
              <View style={styles.ticketRow}>
                <View style={styles.ticketIcon}>
                  <MaterialCommunityIcons name="email-fast-outline" size={30} color="#0f62fe" />
                </View>
                <View style={styles.ticketLines}>
                  <View style={styles.lineLong} />
                  <View style={styles.lineShort} />
                </View>
                <MaterialCommunityIcons name="qrcode" size={48} color="#172033" />
              </View>
              <View style={styles.visualFooter}>
                <View style={styles.avatarStack}>
                  <View style={[styles.avatar, styles.avatarBlue]} />
                  <View style={[styles.avatar, styles.avatarGreen]} />
                  <View style={[styles.avatar, styles.avatarCoral]} />
                </View>
                <View style={styles.statusPill}>
                  <MaterialCommunityIcons name="check-decagram-outline" size={16} color="#166534" />
                  <Text style={styles.statusText}>Ready</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.heroCopy}>
            <Text style={styles.welcomeTitle}>Welcome Back</Text>
            <Text style={styles.welcomeText}>
              Manage guests, invitations, check-ins, and reports from one calm mobile workspace.
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/login')}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </Pressable>
        </View>
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
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 26,
    paddingVertical: 34,
  },
  header: {
    alignItems: 'center',
    width: '100%',
    marginTop: 14,
  },
  logo: {
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 26,
    backgroundColor: '#0f62fe',
    marginBottom: 20,
    shadowColor: '#0f62fe',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.22,
    shadowRadius: 26,
    elevation: 8,
  },
  appName: {
    color: '#0f172a',
    fontSize: 38,
    fontWeight: '800',
    letterSpacing: 0,
    textAlign: 'center',
  },
  subtitle: {
    color: '#53657d',
    fontSize: 16,
    lineHeight: 23,
    marginTop: 10,
    maxWidth: 330,
    textAlign: 'center',
  },
  visualWrap: {
    width: '100%',
    alignItems: 'center',
  },
  visualCard: {
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    borderColor: '#dfe8f4',
    borderRadius: 26,
    backgroundColor: '#ffffff',
    padding: 18,
    shadowColor: '#10233f',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.09,
    shadowRadius: 28,
    elevation: 6,
  },
  ticketRow: {
    minHeight: 132,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 22,
    backgroundColor: '#f1f7ff',
    padding: 16,
  },
  ticketIcon: {
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#dbeafe',
  },
  ticketLines: {
    flex: 1,
    gap: 10,
  },
  lineLong: {
    width: '88%',
    height: 12,
    borderRadius: 8,
    backgroundColor: '#cbd5e1',
  },
  lineShort: {
    width: '58%',
    height: 12,
    borderRadius: 8,
    backgroundColor: '#86efac',
  },
  visualFooter: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatarStack: {
    flexDirection: 'row',
  },
  avatar: {
    width: 34,
    height: 34,
    borderWidth: 3,
    borderColor: '#ffffff',
    borderRadius: 17,
    marginRight: -8,
  },
  avatarBlue: { backgroundColor: '#93c5fd' },
  avatarGreen: { backgroundColor: '#86efac' },
  avatarCoral: { backgroundColor: '#fda4af' },
  statusPill: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 17,
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 12,
  },
  statusText: {
    color: '#166534',
    fontWeight: '800',
  },
  heroCopy: {
    alignItems: 'center',
    maxWidth: 340,
  },
  welcomeTitle: {
    color: '#111827',
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'center',
  },
  welcomeText: {
    color: '#64748b',
    fontSize: 15,
    lineHeight: 23,
    marginTop: 12,
    textAlign: 'center',
  },
  primaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    minHeight: 56,
    borderRadius: 18,
    backgroundColor: '#0f62fe',
    paddingHorizontal: 22,
    shadowColor: '#0f62fe',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 7,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },
});
