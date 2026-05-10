import { adminRequest, ApiRecord } from '@/services/admin-api';
import { clearAuthSession, requireStoredRole } from '@/services/auth-session';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BarcodeScanningResult, CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type ThemeMode = 'light' | 'dark';

const THEME_STORAGE_KEY = 'attendanceStaffTheme';

function asArray(value: unknown): ApiRecord[] {
  if (Array.isArray(value)) return value as ApiRecord[];
  if (value && typeof value === 'object') {
    const record = value as ApiRecord;
    for (const key of ['items', 'events', 'data', 'rows']) {
      if (Array.isArray(record[key])) return record[key] as ApiRecord[];
    }
  }
  return [];
}

function text(value: unknown, fallback = 'Not available') {
  if (value === null || value === undefined || value === '') return fallback;
  return String(value);
}

function pickId(record?: ApiRecord) {
  if (!record) return '';
  return text(record.id || record.event_id);
}

function nameOf(record?: ApiRecord) {
  if (!record) return 'Event';
  return text(record.event_name || record.name, 'Event');
}

export default function QrScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [events, setEvents] = useState<ApiRecord[]>([]);
  const [eventId, setEventId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isScanned, setIsScanned] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [validated, setValidated] = useState<ApiRecord | null>(null);
  const [qrToken, setQrToken] = useState('');
  const [attendanceList, setAttendanceList] = useState<ApiRecord[]>([]);
  const [popup, setPopup] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');
  const theme = themeMode === 'dark' ? darkTheme : lightTheme;

  const selectedEvent = useMemo(
    () => events.find((event) => pickId(event) === eventId),
    [eventId, events],
  );

  const attendedCount = useMemo(
    () =>
      attendanceList.filter((item) => {
        const status = text(item.attendance_status || item.status, '').toLowerCase();
        return status.includes('attended') || Boolean(item.scanned_at);
      }).length,
    [attendanceList],
  );

  const loadEvents = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const loaded = asArray(await adminRequest('/api/v1/attendance/events'));
      setEvents(loaded);
      setEventId((current) => current || pickId(loaded[0]));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load attendance events.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadAttendanceList = useCallback(async (nextEventId = eventId) => {
    if (!nextEventId) return;
    try {
      const loaded = asArray(await adminRequest(`/api/v1/attendance/events/${nextEventId}/list`));
      setAttendanceList(loaded);
    } catch {
      setAttendanceList([]);
    }
  }, [eventId]);

  useEffect(() => {
    void requireStoredRole(['Admin', 'Attendance Staff']);
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((storedTheme) => {
        if (storedTheme === 'dark' || storedTheme === 'light') {
          setThemeMode(storedTheme);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    void loadAttendanceList();
  }, [eventId, loadAttendanceList]);

  const confirmAttendance = useCallback(
    async (token = qrToken) => {
      if (!eventId || !token) {
        setError('Select an event and scan a valid QR code first.');
        return;
      }

      setIsLoading(true);
      setError('');
      try {
        await adminRequest('/api/v1/attendance/scan/confirm', {
          method: 'POST',
          body: {
            event_id: eventId,
            qr_token: token,
          },
        });
        setMessage('Attendance marked successfully.');
        setPopup({ type: 'success', text: 'Attendance marked successfully.' });
        setValidated(null);
        setQrToken('');
        await loadAttendanceList(eventId);
        setCameraActive(false);
      } catch (confirmError) {
        const nextError = confirmError instanceof Error ? confirmError.message : 'Unable to mark attendance.';
        setError(nextError);
        setPopup({ type: 'error', text: nextError });
      } finally {
        setIsLoading(false);
        setIsScanned(false);
      }
    },
    [eventId, loadAttendanceList, qrToken],
  );

  const handleScan = useCallback(
    async (result: BarcodeScanningResult) => {
      if (isScanned || isLoading) return;

      const token = result.data?.trim();
      if (!token) return;

      setIsScanned(true);
      setIsLoading(true);
      setError('');
      setMessage('');
      setValidated(null);
      setQrToken(token);

      try {
        const data = await adminRequest<ApiRecord>('/api/v1/attendance/scan/validate', {
          method: 'POST',
          body: {
            event_id: eventId,
            qr_token: token,
          },
        });
        setValidated(data);
        setMessage('QR code validated. Confirm attendance to mark entry.');
        setPopup({ type: 'success', text: 'QR code validated. Confirm attendance to mark entry.' });
      } catch (scanError) {
        const nextError = scanError instanceof Error ? scanError.message : 'Unable to validate QR code.';
        setError(nextError);
        setPopup({ type: 'error', text: nextError });
        setIsScanned(false);
      } finally {
        setIsLoading(false);
      }
    },
    [eventId, isLoading, isScanned],
  );

  const openScanner = async () => {
    if (!eventId) {
      setPopup({ type: 'error', text: 'Select an event before scanning.' });
      return;
    }
    if (!permission?.granted) {
      const nextPermission = await requestPermission();
      if (!nextPermission.granted) {
        setPopup({ type: 'error', text: 'Camera permission is required to scan QR codes.' });
        return;
      }
    }
    setMessage('');
    setError('');
    setValidated(null);
    setQrToken('');
    setIsScanned(false);
    setCameraActive(true);
  };

  const toggleTheme = async () => {
    const nextTheme = themeMode === 'dark' ? 'light' : 'dark';
    setThemeMode(nextTheme);
    await AsyncStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  };

  const closeScanner = () => {
    setCameraActive(false);
    setIsScanned(false);
    setValidated(null);
    setQrToken('');
  };

  const logout = async () => {
    await clearAuthSession();
    router.replace('/');
  };

  if (!permission) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.center}>
          <ActivityIndicator color="#2563eb" />
          <Text style={styles.muted}>Checking camera permission...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (cameraActive && !permission.granted) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.center}>
          <MaterialCommunityIcons name="camera-off-outline" size={42} color="#64748b" />
          <Text style={styles.title}>Camera Permission</Text>
          <Text style={styles.muted}>Camera access is required to scan attendance QR codes.</Text>
          <Pressable style={styles.primaryButton} onPress={requestPermission}>
            <Text style={styles.primaryButtonText}>Allow Camera</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={closeScanner}>
            <Text style={styles.secondaryButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={[styles.header, { backgroundColor: theme.screen }]}>
        <Pressable style={styles.iconButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={theme.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.eyebrow, { color: theme.muted }]}>Attendance Staff</Text>
          <Text style={[styles.title, { color: theme.text }]}>{cameraActive ? 'QR Scanner' : 'Dashboard'}</Text>
        </View>
        <Pressable style={styles.logoutButton} onPress={logout}>
          <Ionicons name="log-out-outline" size={20} color="#be123c" />
        </Pressable>
        <Pressable style={[styles.iconButton, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={toggleTheme}>
          <Ionicons name={themeMode === 'dark' ? 'moon' : 'sunny'} size={20} color={theme.text} />
        </Pressable>
      </View>

      <View style={[styles.eventPanel, { backgroundColor: theme.screen }]}>
        <Text style={[styles.label, { color: theme.text }]}>Event</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.eventRow}>
          {events.map((event) => {
            const id = pickId(event);
            const active = id === eventId;
            return (
              <Pressable
                key={id}
                style={[styles.eventPill, { backgroundColor: theme.card, borderColor: theme.border }, active && styles.eventPillActive]}
                onPress={() => {
                  setEventId(id);
                  setValidated(null);
                  setQrToken('');
                  setIsScanned(false);
                }}>
                <Text style={[styles.eventPillText, { color: theme.muted }, active && styles.eventPillTextActive]}>{nameOf(event)}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {cameraActive ? (
        <View style={styles.cameraShell}>
          {eventId ? (
            <CameraView
              active={cameraActive}
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              facing="back"
              onBarcodeScanned={isScanned ? undefined : handleScan}
              style={styles.camera}
            />
          ) : (
            <View style={styles.center}>
              <Text style={styles.muted}>Select an event before scanning.</Text>
            </View>
          )}
          <View style={styles.scanFrame} />
          <Pressable style={styles.closeScanButton} onPress={closeScanner}>
            <Ionicons name="close" size={20} color="#ffffff" />
          </Pressable>
        </View>
      ) : (
        <View style={[styles.dashboardPanel, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.dashboardIcon}>
            <MaterialCommunityIcons name="qrcode-scan" size={34} color="#2563eb" />
          </View>
          <Text style={[styles.dashboardTitle, { color: theme.text }]}>Welcome Back</Text>
          <Text style={styles.muted}>
            {selectedEvent
              ? `Ready to manage attendance for ${nameOf(selectedEvent)}.`
              : 'Choose an event to begin scanning attendance QR codes.'}
          </Text>
          <View style={styles.summaryRow}>
            <View style={[styles.summaryTile, { backgroundColor: theme.screen, borderColor: theme.border }]}>
              <Text style={[styles.summaryNumber, { color: theme.text }]}>{attendanceList.length}</Text>
              <Text style={styles.summaryLabel}>Records</Text>
            </View>
            <View style={[styles.summaryTile, { backgroundColor: theme.screen, borderColor: theme.border }]}>
              <Text style={[styles.summaryNumber, { color: theme.text }]}>{attendedCount}</Text>
              <Text style={styles.summaryLabel}>Attended</Text>
            </View>
          </View>
          <Pressable style={styles.primaryButton} onPress={openScanner}>
            <MaterialCommunityIcons name="camera-outline" size={18} color="#ffffff" />
            <Text style={styles.primaryButtonText}>Scan QR Code</Text>
          </Pressable>
        </View>
      )}

      <ScrollView style={[styles.statusPanel, { backgroundColor: theme.card, borderTopColor: theme.border }]} contentContainerStyle={styles.statusContent}>
        <Text style={[styles.label, { color: theme.text }]}>{nameOf(selectedEvent)}</Text>
        {isLoading ? <ActivityIndicator color="#2563eb" /> : null}
        {message ? <Text style={styles.successText}>{message}</Text> : null}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {validated ? (
          <View style={styles.validationCard}>
            <Text style={styles.validationTitle}>Validated Invitation</Text>
            <Text style={styles.muted}>{text(validated.full_name || validated.name || validated.username, 'Participant ready for confirmation')}</Text>
          </View>
        ) : null}
        <View style={styles.actions}>
          <Pressable
            disabled={!validated || isLoading}
            style={[styles.primaryButton, (!validated || isLoading) && styles.disabledButton]}
            onPress={() => confirmAttendance()}>
            <MaterialCommunityIcons name="check-decagram-outline" size={18} color="#ffffff" />
            <Text style={styles.primaryButtonText}>Confirm Attendance</Text>
          </Pressable>
          <Pressable
            style={styles.secondaryButton}
            onPress={() => {
              setIsScanned(false);
              setValidated(null);
              setQrToken('');
              setMessage('');
              setError('');
              setCameraActive(true);
            }}>
            <MaterialCommunityIcons name="reload" size={18} color="#2563eb" />
            <Text style={styles.secondaryButtonText}>Scan Again</Text>
          </Pressable>
        </View>
        <View style={styles.listHeader}>
          <Text style={[styles.label, { color: theme.text }]}>Attendance List</Text>
          <Text style={styles.muted}>{attendanceList.length} scanned</Text>
        </View>
        {attendanceList.slice(0, 8).map((item) => (
          <View key={text(item.id || item.invitation_id)} style={[styles.attendeeRow, { backgroundColor: theme.screen, borderColor: theme.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.attendeeName, { color: theme.text }]}>{text(item.full_name || item.username, 'Participant')}</Text>
              <Text style={styles.muted}>{text(item.participant_type || item.seat_group, 'Attendance recorded')}</Text>
            </View>
            <Text style={styles.successText}>{text(item.attendance_status, 'ATTENDED')}</Text>
          </View>
        ))}
      </ScrollView>

      <Modal visible={Boolean(popup)} transparent animationType="fade" onRequestClose={() => setPopup(null)}>
        <View style={styles.modalShade}>
          <View style={[styles.popupCard, { backgroundColor: theme.card }]}>
            <MaterialCommunityIcons
              name={popup?.type === 'success' ? 'check-circle-outline' : 'alert-circle-outline'}
              size={38}
              color={popup?.type === 'success' ? '#16a34a' : '#be123c'}
            />
            <Text style={[styles.popupText, { color: theme.text }]}>{popup?.text}</Text>
            <Pressable style={styles.primaryButton} onPress={() => setPopup(null)}>
              <Text style={styles.primaryButtonText}>OK</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const lightTheme = {
  screen: '#edf2f7',
  card: '#f8fafc',
  border: '#cbd5e1',
  text: '#111827',
  muted: '#64748b',
};

const darkTheme = {
  screen: '#0f1720',
  card: '#17212f',
  border: '#2d3a4f',
  text: '#f8fafc',
  muted: '#a6b3c4',
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#edf2f7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  iconButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  logoutButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#fecdd3',
  },
  eyebrow: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '800',
  },
  title: {
    color: '#111827',
    fontSize: 25,
    fontWeight: '800',
  },
  eventPanel: {
    gap: 10,
    paddingHorizontal: 18,
    paddingBottom: 12,
  },
  label: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '800',
  },
  eventRow: {
    gap: 10,
  },
  eventPill: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  eventPillActive: {
    borderColor: '#2563eb',
    backgroundColor: '#dbeafe',
  },
  eventPillText: {
    color: '#475569',
    fontWeight: '800',
  },
  eventPillTextActive: {
    color: '#2563eb',
  },
  cameraShell: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: 26,
    backgroundColor: '#111827',
    marginHorizontal: 18,
    minHeight: 300,
  },
  dashboardPanel: {
    gap: 16,
    borderWidth: 1,
    borderRadius: 24,
    marginHorizontal: 18,
    padding: 18,
    shadowColor: '#10233f',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 22,
    elevation: 4,
  },
  dashboardIcon: {
    width: 66,
    height: 66,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: '#dbeafe',
  },
  dashboardTitle: {
    fontSize: 24,
    fontWeight: '800',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryTile: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
  },
  summaryNumber: {
    fontSize: 26,
    fontWeight: '800',
  },
  summaryLabel: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  camera: {
    flex: 1,
  },
  scanFrame: {
    position: 'absolute',
    alignSelf: 'center',
    top: '28%',
    width: 220,
    height: 220,
    borderWidth: 3,
    borderColor: '#93c5fd',
    borderRadius: 24,
  },
  closeScanButton: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
  },
  statusPanel: {
    borderTopWidth: 1,
    maxHeight: 330,
  },
  statusContent: {
    gap: 10,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 22,
  },
  validationCard: {
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 16,
    backgroundColor: '#f0fdf4',
    padding: 12,
  },
  validationTitle: {
    color: '#166534',
    fontWeight: '800',
    marginBottom: 3,
  },
  muted: {
    color: '#64748b',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  successText: {
    color: '#166534',
    fontWeight: '800',
    textAlign: 'center',
  },
  errorText: {
    color: '#be123c',
    fontWeight: '800',
    textAlign: 'center',
  },
  actions: {
    gap: 10,
  },
  listHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  attendeeRow: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    padding: 10,
  },
  attendeeName: {
    fontSize: 14,
    fontWeight: '800',
  },
  modalShade: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.58)',
    padding: 18,
  },
  popupCard: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    gap: 14,
    borderRadius: 8,
    padding: 18,
  },
  popupText: {
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
    textAlign: 'center',
  },
  primaryButton: {
    minHeight: 52,
    borderRadius: 15,
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  disabledButton: {
    opacity: 0.55,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '800',
  },
  secondaryButton: {
    minHeight: 50,
    borderRadius: 15,
    backgroundColor: '#dbeafe',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  secondaryButtonText: {
    color: '#2563eb',
    fontWeight: '800',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingHorizontal: 24,
  },
});
