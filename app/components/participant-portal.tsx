import { clearAuthSession, requireStoredRole } from '@/services/auth-session';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  asRecord,
  eventIdOf,
  loadInvitationForEvent,
  loadMyPortalData,
  PortalEvent,
  PortalInvitation,
  requestMoreInvitation,
  titleOf,
  valueText,
} from '@/services/portal-api';

type PortalKind = 'graduate' | 'guest' | 'vip';

type ParticipantPortalProps = {
  kind: PortalKind;
  title: string;
  accent: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  canRequestMore?: boolean;
};

const roleLabels: Record<PortalKind, string> = {
  graduate: 'Graduate',
  guest: 'Guest',
  vip: 'VIP Guest',
};

function formatDate(value: unknown) {
  if (!value) return 'Date not set';
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function getQrImage(invitation: PortalInvitation | null) {
  const qr = valueText(invitation?.qr_code, '');
  if (!qr) return '';
  return qr.startsWith('data:image') ? qr : `data:image/png;base64,${qr}`;
}

function attendanceLabel(invitation: PortalInvitation | null) {
  const status = valueText(invitation?.attendance_status || asRecord(invitation?.metadata).attendance_status, 'NOT_ATTENDED');
  return status === 'ATTENDED' ? 'Attended' : 'Not attended';
}

export function ParticipantPortal({ kind, title, accent, icon, canRequestMore = false }: ParticipantPortalProps) {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  const palette = getPalette(dark, accent);
  const styles = useMemo(() => createStyles(palette), [palette]);

  const [events, setEvents] = useState<PortalEvent[]>([]);
  const [invitations, setInvitations] = useState<PortalInvitation[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedInvitation, setSelectedInvitation] = useState<PortalInvitation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [requestOpen, setRequestOpen] = useState(false);
  const [receiverName, setReceiverName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [requestMessage, setRequestMessage] = useState('');
  const selectedEventIdRef = useRef('');

  const selectedEvent = useMemo(
    () => events.find((event) => eventIdOf(event) === selectedEventId) || events[0],
    [events, selectedEventId],
  );

  const profileInvitation = selectedInvitation || invitations[0] || null;
  const qrImage = getQrImage(selectedInvitation);

  useEffect(() => {
    const allowedRoles = kind === 'graduate' ? ['Graduate'] : kind === 'guest' ? ['Guest'] : ['Special Guest'];
    void requireStoredRole(allowedRoles);
  }, [kind]);

  const loadData = useCallback(async () => {
    setError('');
    try {
      const data = await loadMyPortalData();
      setEvents(data.events);
      setInvitations(data.invitations);
      setFullName(data.fullName || valueText(data.invitations[0]?.full_name, ''));
      const nextEventId = selectedEventIdRef.current || eventIdOf(data.events[0]) || valueText(data.invitations[0]?.event_id, '');
      selectedEventIdRef.current = nextEventId;
      setSelectedEventId(nextEventId);
      if (nextEventId) {
        setSelectedInvitation(await loadInvitationForEvent(nextEventId));
      } else {
        setSelectedInvitation(data.invitations[0] || null);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load portal data.');
    }
  }, []);

  useEffect(() => {
    loadData().finally(() => setIsLoading(false));
  }, [loadData]);

  const selectEvent = useCallback(async (event: PortalEvent) => {
    const id = eventIdOf(event);
    selectedEventIdRef.current = id;
    setSelectedEventId(id);
    setSelectedInvitation(null);
    setError('');
    try {
      setSelectedInvitation(await loadInvitationForEvent(id));
    } catch (eventError) {
      setError(eventError instanceof Error ? eventError.message : 'Unable to load this invitation.');
    }
  }, []);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  }, [loadData]);

  const logout = useCallback(async () => {
    await clearAuthSession();
    router.replace('/');
  }, []);

  const submitRequest = useCallback(async () => {
    if (!selectedEventId || !receiverName.trim() || !relationship.trim()) {
      setRequestMessage('Complete all fields before submitting.');
      return;
    }
    setRequestMessage('');
    try {
      await requestMoreInvitation({
        event_id: selectedEventId,
        receiver_type: 'Guest',
        receiver_name: receiverName.trim(),
        relationship: relationship.trim(),
      });
      setReceiverName('');
      setRelationship('');
      setRequestOpen(false);
      setRequestMessage('Invitation request submitted.');
    } catch (requestError) {
      setRequestMessage(requestError instanceof Error ? requestError.message : 'Unable to submit request.');
    }
  }, [receiverName, relationship, selectedEventId]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.center}>
          <ActivityIndicator color={accent} />
          <Text style={styles.muted}>Loading portal...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={accent} />}>
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <MaterialCommunityIcons name={icon} size={28} color="#ffffff" />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>{roleLabels[kind]}</Text>
            <Text style={styles.title}>{title}</Text>
          </View>
          <Pressable style={styles.iconButton} onPress={logout}>
            <Ionicons name="log-out-outline" size={21} color={palette.text} />
          </Pressable>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {requestMessage ? <Text style={styles.notice}>{requestMessage}</Text> : null}

        <View style={styles.profileCard}>
          <Text style={styles.cardLabel}>Profile</Text>
          <Text style={styles.profileName}>{fullName || valueText(profileInvitation?.full_name, 'Signed in user')}</Text>
          <Text style={styles.muted}>{valueText(profileInvitation?.email || profileInvitation?.username, roleLabels[kind])}</Text>
          <View style={styles.statusRow}>
            <InfoPill label="Invitation" value={valueText(selectedInvitation?.status, 'Pending')} styles={styles} />
            <InfoPill label="Attendance" value={attendanceLabel(selectedInvitation)} styles={styles} />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Assigned Events</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.eventRow}>
          {events.map((event) => {
            const id = eventIdOf(event);
            const active = id === selectedEventId;
            return (
              <Pressable key={id} style={[styles.eventCard, active && styles.eventCardActive]} onPress={() => selectEvent(event)}>
                <Text style={[styles.eventName, active && styles.activeText]}>{titleOf(event)}</Text>
                <Text style={styles.muted}>{formatDate(event.event_date)}</Text>
                <Text style={styles.muted}>{valueText(event.location, 'Location not set')}</Text>
              </Pressable>
            );
          })}
          {events.length === 0 ? <Text style={styles.muted}>No assigned events found.</Text> : null}
        </ScrollView>

        <View style={styles.invitationCard}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardLabel}>Invitation</Text>
              <Text style={styles.cardTitle}>{titleOf(asRecord(selectedEvent || selectedInvitation || {}))}</Text>
            </View>
            <MaterialCommunityIcons name="ticket-confirmation-outline" size={24} color={accent} />
          </View>
          <View style={styles.detailGrid}>
            <Detail label="Date" value={formatDate(selectedInvitation?.event_date || selectedEvent?.event_date)} styles={styles} />
            <Detail label="Venue" value={valueText(selectedInvitation?.location || selectedEvent?.location, 'Location not set')} styles={styles} />
            <Detail label="Seat" value={valueText(selectedInvitation?.seat_number || selectedInvitation?.seat_group, 'Not assigned')} styles={styles} />
            <Detail label="Quantity" value={valueText(selectedInvitation?.quantity, '1')} styles={styles} />
          </View>
          <View style={styles.qrPanel}>
            {qrImage ? (
              <Image source={{ uri: qrImage }} style={styles.qrImage} resizeMode="contain" />
            ) : (
              <View style={styles.qrPlaceholder}>
                <MaterialCommunityIcons name="qrcode" size={44} color={palette.muted} />
                <Text style={styles.muted}>QR code is not available yet.</Text>
              </View>
            )}
          </View>
          {canRequestMore ? (
            <Pressable style={styles.primaryButton} onPress={() => setRequestOpen(true)}>
              <MaterialCommunityIcons name="account-plus-outline" size={19} color="#ffffff" />
              <Text style={styles.primaryButtonText}>Request More Invitation</Text>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>

      <Modal visible={requestOpen} transparent animationType="fade" onRequestClose={() => setRequestOpen(false)}>
        <View style={styles.modalShade}>
          <View style={styles.modalCard}>
            <Text style={styles.cardTitle}>Request Invitation</Text>
            <TextInput
              placeholder="Guest full name"
              placeholderTextColor={palette.muted}
              style={styles.input}
              value={receiverName}
              onChangeText={setReceiverName}
            />
            <TextInput
              placeholder="Relationship"
              placeholderTextColor={palette.muted}
              style={styles.input}
              value={relationship}
              onChangeText={setRelationship}
            />
            <View style={styles.modalActions}>
              <Pressable style={styles.secondaryButton} onPress={() => setRequestOpen(false)}>
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.primaryButtonSmall} onPress={submitRequest}>
                <Text style={styles.primaryButtonText}>Submit</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function InfoPill({ label, value, styles }: { label: string; value: string; styles: ReturnType<typeof createStyles> }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillLabel}>{label}</Text>
      <Text style={styles.pillValue}>{value}</Text>
    </View>
  );
}

function Detail({ label, value, styles }: { label: string; value: string; styles: ReturnType<typeof createStyles> }) {
  return (
    <View style={styles.detail}>
      <Text style={styles.cardLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function getPalette(dark: boolean, accent: string) {
  return {
    accent,
    screen: dark ? '#0f1720' : '#f4f7fb',
    card: dark ? '#17212f' : '#ffffff',
    cardAlt: dark ? '#1f2b3d' : '#eef5ff',
    text: dark ? '#f8fafc' : '#0f172a',
    muted: dark ? '#a6b3c4' : '#64748b',
    border: dark ? '#2d3a4f' : '#d8e2ef',
    dangerBg: dark ? '#3f1d25' : '#fff1f2',
    danger: dark ? '#fda4af' : '#be123c',
  };
}

function createStyles(palette: ReturnType<typeof getPalette>) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: palette.screen },
    content: { gap: 16, padding: 18, paddingBottom: 32 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
    header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    headerIcon: { width: 52, height: 52, borderRadius: 16, backgroundColor: palette.accent, alignItems: 'center', justifyContent: 'center' },
    headerText: { flex: 1 },
    eyebrow: { color: palette.muted, fontSize: 13, fontWeight: '800' },
    title: { color: palette.text, fontSize: 28, fontWeight: '800' },
    iconButton: { width: 44, height: 44, borderRadius: 14, borderWidth: 1, borderColor: palette.border, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.card },
    profileCard: { gap: 8, padding: 16, borderRadius: 8, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.card },
    cardLabel: { color: palette.muted, fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
    profileName: { color: palette.text, fontSize: 24, fontWeight: '800' },
    muted: { color: palette.muted, fontSize: 14, lineHeight: 20 },
    statusRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
    pill: { flex: 1, gap: 3, borderRadius: 8, backgroundColor: palette.cardAlt, padding: 10 },
    pillLabel: { color: palette.muted, fontSize: 11, fontWeight: '800' },
    pillValue: { color: palette.text, fontSize: 13, fontWeight: '800' },
    sectionTitle: { color: palette.text, fontSize: 18, fontWeight: '800', marginTop: 4 },
    eventRow: { gap: 12, paddingRight: 18 },
    eventCard: { width: 230, minHeight: 128, gap: 8, padding: 14, borderRadius: 8, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.card },
    eventCardActive: { borderColor: palette.accent, backgroundColor: palette.cardAlt },
    activeText: { color: palette.accent },
    eventName: { color: palette.text, fontSize: 16, fontWeight: '800' },
    invitationCard: { gap: 14, padding: 16, borderRadius: 8, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.card },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
    cardTitle: { color: palette.text, fontSize: 20, fontWeight: '800' },
    detailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    detail: { width: '47%', minHeight: 70, gap: 5, borderRadius: 8, backgroundColor: palette.cardAlt, padding: 10 },
    detailValue: { color: palette.text, fontSize: 14, fontWeight: '700' },
    qrPanel: { minHeight: 230, alignItems: 'center', justifyContent: 'center', borderRadius: 8, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.screen, padding: 14 },
    qrImage: { width: 210, height: 210, borderRadius: 8 },
    qrPlaceholder: { alignItems: 'center', gap: 10 },
    primaryButton: { minHeight: 52, borderRadius: 8, backgroundColor: palette.accent, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 14 },
    primaryButtonSmall: { minHeight: 48, borderRadius: 8, backgroundColor: palette.accent, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
    primaryButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '800' },
    secondaryButton: { minHeight: 48, borderRadius: 8, borderWidth: 1, borderColor: palette.border, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
    secondaryButtonText: { color: palette.text, fontSize: 15, fontWeight: '800' },
    error: { borderRadius: 8, backgroundColor: palette.dangerBg, color: palette.danger, fontWeight: '800', padding: 12, textAlign: 'center' },
    notice: { borderRadius: 8, backgroundColor: palette.cardAlt, color: palette.text, fontWeight: '800', padding: 12, textAlign: 'center' },
    modalShade: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.58)', padding: 18 },
    modalCard: { width: '100%', maxWidth: 420, gap: 12, borderRadius: 8, backgroundColor: palette.card, padding: 16 },
    input: { minHeight: 52, borderRadius: 8, borderWidth: 1, borderColor: palette.border, color: palette.text, paddingHorizontal: 14, backgroundColor: palette.screen },
    modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  });
}
