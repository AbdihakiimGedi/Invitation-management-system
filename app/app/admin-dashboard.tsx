import { adminRequest, ApiRecord } from '@/services/admin-api';
import { clearAuthSession, requireStoredRole } from '@/services/auth-session';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type TabKey =
  | 'dashboard'
  | 'events'
  | 'participants'
  | 'invitations'
  | 'attendance'
  | 'reports'
  | 'users'
  | 'logs';

type ThemeMode = 'light' | 'dark';
type ModalType =
  | 'event'
  | 'eventEdit'
  | 'user'
  | 'userEdit'
  | 'eventView'
  | 'participantView'
  | 'userView'
  | null;
type AlertType = 'success' | 'error' | 'warning' | 'confirm';

type EventForm = {
  event_name: string;
  event_date: string;
  location: string;
  description: string;
  max_capacity: string;
};

type UserForm = {
  username: string;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  password: string;
};

type AppTheme = {
  mode: ThemeMode;
  primary: string;
  primarySoft: string;
  danger: string;
  dangerSoft: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  background: string;
  surface: string;
  elevated: string;
  border: string;
  text: string;
  muted: string;
  subtle: string;
  input: string;
  overlay: string;
  shadow: string;
  white: string;
};

const drawerWidth = Math.min(330, Dimensions.get('window').width * 0.84);

const tabs: { key: TabKey; label: string }[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'events', label: 'Events' },
  { key: 'participants', label: 'Participants' },
  { key: 'invitations', label: 'Invitations' },
  { key: 'attendance', label: 'Attendance' },
  { key: 'reports', label: 'Reports' },
  { key: 'users', label: 'Users' },
  { key: 'logs', label: 'Settings' },
];

const participantTypes = [
  { label: 'Graduates', slug: 'graduates' },
  { label: 'Guests', slug: 'guests' },
  { label: 'VIP Guests', slug: 'vip_guests' },
];

const themes: Record<ThemeMode, AppTheme> = {
  light: {
    mode: 'light',
    primary: '#0f62fe',
    primarySoft: '#dbeafe',
    danger: '#be123c',
    dangerSoft: '#fff1f2',
    success: '#166534',
    successSoft: '#f0fdf4',
    warning: '#9a3412',
    warningSoft: '#fff7ed',
    background: '#edf2f7',
    surface: '#f8fafc',
    elevated: '#f8fafc',
    border: '#cbd5e1',
    text: '#0f172a',
    muted: '#53657d',
    subtle: '#7b8a9e',
    input: '#f1f5f9',
    overlay: 'rgba(15, 23, 42, 0.42)',
    shadow: '#10233f',
    white: '#ffffff',
  },
  dark: {
    mode: 'dark',
    primary: '#93c5fd',
    primarySoft: '#1e3a5f',
    danger: '#fb7185',
    dangerSoft: '#3a1720',
    success: '#86efac',
    successSoft: '#12321f',
    warning: '#fdba74',
    warningSoft: '#3a2412',
    background: '#111827',
    surface: '#1f2937',
    elevated: '#263244',
    border: '#3a4a61',
    text: '#eef5ff',
    muted: '#a8b6c9',
    subtle: '#8090a7',
    input: '#172033',
    overlay: 'rgba(0, 0, 0, 0.58)',
    shadow: '#000000',
    white: '#ffffff',
  },
};

const moduleIcons: Record<TabKey, keyof typeof MaterialCommunityIcons.glyphMap> = {
  dashboard: 'view-dashboard-outline',
  events: 'calendar-star',
  participants: 'account-group-outline',
  invitations: 'email-fast-outline',
  attendance: 'qrcode-scan',
  reports: 'chart-box-outline',
  users: 'account-cog-outline',
  logs: 'history',
};

const moduleDescriptions: Record<TabKey, string> = {
  dashboard: 'Overview and shortcuts',
  events: 'Create and manage event records',
  participants: 'Participant lists, filters, and credentials',
  invitations: 'Sent invitations, batches, and approvals',
  attendance: 'Attendance dashboard and scan results',
  reports: 'Event reports and attendance comparison',
  users: 'System users, roles, and password reset',
  logs: 'System activity and audit history',
};

function asArray(value: unknown): ApiRecord[] {
  if (Array.isArray(value)) return value as ApiRecord[];
  if (value && typeof value === 'object') {
    const record = value as ApiRecord;
    for (const key of ['items', 'events', 'participants', 'users', 'logs', 'rows', 'data', 'records']) {
      if (Array.isArray(record[key])) return record[key] as ApiRecord[];
    }
  }
  return [];
}

function text(value: unknown, fallback = 'Not available') {
  if (value === null || value === undefined || value === '') return fallback;
  return String(value);
}

function numberText(value: unknown) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number.toLocaleString() : '0';
}

function dateText(value: unknown) {
  if (!value) return 'No date';
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString();
}

function findFirst(record: ApiRecord | undefined | null, keys: string[], fallback = '') {
  if (!record) return fallback;
  const key = keys.find((candidate) => record[candidate] !== undefined && record[candidate] !== null);
  return key ? text(record[key], fallback) : fallback;
}

function pickId(record?: ApiRecord | null) {
  return findFirst(record, ['id', 'event_id', 'eventparticipant_id', 'user_id']);
}

function roleName(role?: ApiRecord | null) {
  return findFirst(role, ['role_name', 'name', 'role']);
}

function safeDateValue(value: string) {
  if (!value) return new Date();
  const parsed = new Date(value.replace(' ', 'T'));
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: theme.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 18,
      paddingTop: 10,
      paddingBottom: 14,
    },
    headerLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
    iconButton: {
      width: 42,
      height: 42,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 14,
      backgroundColor: theme.surface,
    },
    modeButton: {
      width: 42,
      height: 42,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 14,
      backgroundColor: theme.primarySoft,
    },
    eyebrow: { color: theme.muted, fontSize: 13, fontWeight: '800' },
    title: { color: theme.text, fontSize: 25, fontWeight: '800' },
    body: { flex: 1 },
    bodyContent: { paddingHorizontal: 18, paddingBottom: 34 },
    section: { gap: 14 },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    sectionTitle: { color: theme.text, fontSize: 18, fontWeight: '800', marginTop: 6 },
    sectionHint: { color: theme.muted, fontSize: 13, lineHeight: 19, marginTop: 3 },
    summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    summaryCard: {
      width: '48%',
      minHeight: 104,
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 18,
      backgroundColor: theme.surface,
      padding: 14,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: theme.mode === 'dark' ? 0.18 : 0.05,
      shadowRadius: 18,
      elevation: 2,
    },
    summaryIcon: {
      width: 34,
      height: 34,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
      backgroundColor: theme.primarySoft,
      marginBottom: 8,
    },
    summaryLabel: { color: theme.muted, fontSize: 13, fontWeight: '700' },
    summaryValue: { color: theme.text, fontSize: 26, fontWeight: '800' },
    shortcutGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    shortcutCard: {
      width: '48%',
      minHeight: 132,
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 20,
      backgroundColor: theme.surface,
      padding: 14,
    },
    shortcutIcon: {
      width: 42,
      height: 42,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 15,
      backgroundColor: theme.primarySoft,
    },
    shortcutTitle: { color: theme.text, fontSize: 16, fontWeight: '800' },
    shortcutText: { color: theme.muted, fontSize: 12, lineHeight: 17, marginTop: 3 },
    dataCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 16,
      backgroundColor: theme.surface,
      padding: 14,
    },
    dataCardText: { flex: 1, gap: 4 },
    dataTitle: { color: theme.text, fontSize: 15, fontWeight: '800' },
    dataSubtitle: { color: theme.muted, fontSize: 13, lineHeight: 18 },
    dataMeta: { color: theme.subtle, fontSize: 12, lineHeight: 17 },
    actionRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    smallIconButton: {
      width: 38,
      height: 38,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 13,
      backgroundColor: theme.primarySoft,
    },
    dangerIconButton: { backgroundColor: theme.dangerSoft },
    formCard: {
      gap: 12,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 20,
      backgroundColor: theme.surface,
      padding: 16,
    },
    inputWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      minHeight: 52,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 15,
      backgroundColor: theme.input,
      paddingHorizontal: 12,
    },
    input: { flex: 1, color: theme.text, fontSize: 15, paddingVertical: 12 },
    multiline: { minHeight: 90, paddingTop: 12, textAlignVertical: 'top' },
    rolePickerWrap: { gap: 8 },
    selectInput: { alignItems: 'center' },
    disabledSelect: { opacity: 0.62 },
    selectTextWrap: { flex: 1, gap: 2 },
    selectLabel: { color: theme.muted, fontSize: 12, fontWeight: '800' },
    selectValue: { color: theme.text, fontSize: 15, fontWeight: '800' },
    selectPlaceholder: { color: theme.subtle },
    selectMenu: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 16,
      backgroundColor: theme.surface,
      overflow: 'hidden',
    },
    selectOption: {
      minHeight: 48,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 14,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    selectOptionActive: { backgroundColor: theme.primarySoft },
    selectOptionText: { color: theme.text, fontSize: 15, fontWeight: '800' },
    selectOptionTextActive: { color: theme.primary },
    primaryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      minHeight: 52,
      borderRadius: 15,
      backgroundColor: theme.primary,
      paddingHorizontal: 16,
    },
    primaryButtonText: { color: theme.white, fontSize: 16, fontWeight: '800' },
    secondaryAction: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      minHeight: 48,
      borderRadius: 14,
      backgroundColor: theme.primarySoft,
    },
    secondaryActionText: { color: theme.primary, fontWeight: '800' },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    chip: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 999,
      backgroundColor: theme.surface,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    chipActive: { borderColor: theme.primary, backgroundColor: theme.primarySoft },
    chipText: { color: theme.muted, fontWeight: '800' },
    chipTextActive: { color: theme.primary },
    eventSelector: { gap: 10, paddingVertical: 4 },
    eventPill: {
      maxWidth: 230,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 14,
      backgroundColor: theme.surface,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    eventPillActive: { borderColor: theme.primary, backgroundColor: theme.primarySoft },
    eventPillText: { color: theme.text, fontSize: 13, fontWeight: '800' },
    banner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginHorizontal: 18,
      marginBottom: 10,
      borderWidth: 1,
      borderRadius: 14,
      padding: 12,
    },
    errorBanner: { borderColor: theme.danger, backgroundColor: theme.dangerSoft },
    successBanner: { borderColor: theme.success, backgroundColor: theme.successSoft },
    bannerText: { flex: 1, color: theme.text, fontWeight: '800', lineHeight: 18 },
    retryButton: {
      borderRadius: 11,
      backgroundColor: theme.surface,
      paddingHorizontal: 10,
      paddingVertical: 7,
    },
    retryText: { color: theme.primary, fontWeight: '800', fontSize: 12 },
    emptyState: {
      alignItems: 'center',
      gap: 8,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 16,
      backgroundColor: theme.surface,
      padding: 18,
    },
    emptyText: { color: theme.muted, fontWeight: '700', textAlign: 'center' },
    loader: { alignItems: 'center', gap: 10, paddingVertical: 60 },
    loaderText: { color: theme.muted, fontWeight: '700' },
    drawerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: theme.overlay, zIndex: 20 },
    drawer: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      width: drawerWidth,
      backgroundColor: theme.elevated,
      borderRightWidth: 1,
      borderRightColor: theme.border,
      paddingTop: 30,
      paddingHorizontal: 16,
      zIndex: 25,
      shadowColor: theme.shadow,
      shadowOffset: { width: 10, height: 0 },
      shadowOpacity: theme.mode === 'dark' ? 0.35 : 0.16,
      shadowRadius: 28,
      elevation: 12,
    },
    drawerHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 18,
    },
    profileBlock: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
    drawerLogo: {
      width: 52,
      height: 52,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 18,
      backgroundColor: theme.primary,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: theme.mode === 'dark' ? 0.18 : 0.12,
      shadowRadius: 16,
      elevation: 4,
    },
    drawerTitle: { color: theme.text, fontSize: 18, fontWeight: '800' },
    drawerSubtitle: { color: theme.muted, fontSize: 12, lineHeight: 17, marginTop: 3 },
    drawerItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 11,
      borderRadius: 18,
      paddingHorizontal: 10,
      paddingVertical: 10,
      marginBottom: 7,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    drawerItemActive: { backgroundColor: theme.primarySoft, borderColor: theme.border },
    drawerItemIcon: {
      width: 38,
      height: 38,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 14,
      backgroundColor: theme.input,
    },
    drawerItemIconActive: { backgroundColor: theme.primary },
    drawerItemCopy: { flex: 1 },
    drawerItemText: { color: theme.muted, fontSize: 15, fontWeight: '800' },
    drawerItemTextActive: { color: theme.primary },
    drawerItemHint: { color: theme.subtle, fontSize: 11, lineHeight: 15, marginTop: 1 },
    drawerFooter: { marginTop: 'auto', gap: 14, paddingBottom: 24 },
    themeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 16,
      padding: 12,
    },
    themeLabel: { color: theme.text, fontWeight: '800' },
    modalOverlay: { flex: 1, justifyContent: 'center', backgroundColor: theme.overlay, padding: 18 },
    modalCard: {
      maxHeight: '88%',
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 24,
      backgroundColor: theme.elevated,
      padding: 18,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 18 },
      shadowOpacity: 0.25,
      shadowRadius: 30,
      elevation: 16,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      marginBottom: 16,
    },
    modalTitle: { color: theme.text, fontSize: 21, fontWeight: '800' },
    modalSubtitle: { color: theme.muted, fontSize: 13, marginTop: 4 },
    modalContent: { gap: 12, paddingBottom: 6 },
    detailRow: { borderBottomWidth: 1, borderBottomColor: theme.border, paddingVertical: 10 },
    detailLabel: { color: theme.subtle, fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
    detailValue: { color: theme.text, fontSize: 15, lineHeight: 22, marginTop: 4 },
    alertCard: { borderRadius: 24, backgroundColor: theme.elevated, padding: 20, borderWidth: 1, borderColor: theme.border },
    alertIcon: {
      width: 54,
      height: 54,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 18,
      marginBottom: 14,
      alignSelf: 'center',
    },
    alertTitle: { color: theme.text, fontSize: 22, fontWeight: '800', textAlign: 'center' },
    alertMessage: { color: theme.muted, fontSize: 15, lineHeight: 22, marginTop: 8, textAlign: 'center' },
    alertActions: { flexDirection: 'row', gap: 10, marginTop: 18 },
    alertCancel: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 48,
      borderRadius: 14,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    alertCancelText: { color: theme.text, fontWeight: '800' },
    alertConfirm: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 48,
      borderRadius: 14,
      backgroundColor: theme.primary,
    },
    alertConfirmDanger: { backgroundColor: theme.danger },
    alertConfirmText: { color: theme.white, fontWeight: '800' },
  });
}

function SummaryCard({
  label,
  value,
  icon,
  styles,
  theme,
}: {
  label: string;
  value: unknown;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  styles: ReturnType<typeof createStyles>;
  theme: AppTheme;
}) {
  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryIcon}>
        <MaterialCommunityIcons name={icon} size={18} color={theme.primary} />
      </View>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{numberText(value)}</Text>
    </View>
  );
}

function DataCard({
  title,
  subtitle,
  meta,
  actionIcon = 'chevron-right',
  secondActionIcon,
  danger,
  secondDanger,
  styles,
  theme,
  onPress,
  onSecondPress,
  onView,
}: {
  title: string;
  subtitle?: string;
  meta?: string;
  actionIcon?: keyof typeof MaterialCommunityIcons.glyphMap;
  secondActionIcon?: keyof typeof MaterialCommunityIcons.glyphMap;
  danger?: boolean;
  secondDanger?: boolean;
  styles: ReturnType<typeof createStyles>;
  theme: AppTheme;
  onPress?: () => void;
  onSecondPress?: () => void;
  onView?: () => void;
}) {
  return (
    <View style={styles.dataCard}>
      <View style={styles.dataCardText}>
        <Text style={styles.dataTitle}>{title}</Text>
        {subtitle ? <Text style={styles.dataSubtitle}>{subtitle}</Text> : null}
        {meta ? <Text style={styles.dataMeta}>{meta}</Text> : null}
      </View>
      <View style={styles.actionRow}>
        {onView ? (
          <Pressable accessibilityRole="button" onPress={onView} style={styles.smallIconButton}>
            <MaterialCommunityIcons name="eye-outline" size={18} color={theme.primary} />
          </Pressable>
        ) : null}
        {onPress ? (
          <Pressable
            accessibilityRole="button"
            onPress={onPress}
            style={[styles.smallIconButton, danger && styles.dangerIconButton]}>
            <MaterialCommunityIcons
              name={actionIcon}
              size={18}
              color={danger ? theme.danger : theme.primary}
            />
          </Pressable>
        ) : null}
        {onSecondPress && secondActionIcon ? (
          <Pressable
            accessibilityRole="button"
            onPress={onSecondPress}
            style={[styles.smallIconButton, secondDanger && styles.dangerIconButton]}>
            <MaterialCommunityIcons
              name={secondActionIcon}
              size={18}
              color={secondDanger ? theme.danger : theme.primary}
            />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function EmptyState({
  title,
  styles,
  theme,
}: {
  title: string;
  styles: ReturnType<typeof createStyles>;
  theme: AppTheme;
}) {
  return (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons name="database-search-outline" size={28} color={theme.subtle} />
      <Text style={styles.emptyText}>{title}</Text>
    </View>
  );
}

function FormInput({
  icon,
  placeholder,
  value,
  onChangeText,
  styles,
  theme,
  multiline,
  keyboardType,
  secureTextEntry,
  autoCapitalize,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  styles: ReturnType<typeof createStyles>;
  theme: AppTheme;
  multiline?: boolean;
  keyboardType?: 'default' | 'number-pad' | 'email-address';
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}) {
  return (
    <View style={[styles.inputWrap, multiline && { alignItems: 'flex-start' }]}>
      <MaterialCommunityIcons
        name={icon}
        size={19}
        color={theme.subtle}
        style={multiline ? { marginTop: 13 } : undefined}
      />
      <TextInput
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        multiline={multiline}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.subtle}
        secureTextEntry={secureTextEntry}
        style={[styles.input, multiline && styles.multiline]}
        value={value}
      />
    </View>
  );
}

function RolePicker({
  roles,
  selectedRole,
  onSelect,
  styles,
  theme,
}: {
  roles: ApiRecord[];
  selectedRole: string;
  onSelect: (role: string) => void;
  styles: ReturnType<typeof createStyles>;
  theme: AppTheme;
}) {
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.rolePickerWrap}>
      <Pressable
        accessibilityRole="button"
        disabled={!roles.length}
        onPress={() => setOpen((current) => !current)}
        style={[styles.inputWrap, styles.selectInput, !roles.length && styles.disabledSelect]}>
        <MaterialCommunityIcons name="shield-account-outline" size={20} color={theme.primary} />
        <View style={styles.selectTextWrap}>
          <Text style={styles.selectLabel}>Role</Text>
          <Text style={[styles.selectValue, !selectedRole && styles.selectPlaceholder]}>
            {selectedRole || (roles.length ? 'Select a role' : 'Loading roles...')}
          </Text>
        </View>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={theme.muted} />
      </Pressable>
      {open ? (
        <View style={styles.selectMenu}>
          {roles.map((role) => {
            const name = roleName(role);
            if (!name) return null;
            const active = selectedRole === name;
            return (
              <Pressable
                accessibilityRole="button"
                key={name}
                onPress={() => {
                  onSelect(name);
                  setOpen(false);
                }}
                style={[styles.selectOption, active && styles.selectOptionActive]}>
                <Text style={[styles.selectOptionText, active && styles.selectOptionTextActive]}>{name}</Text>
                {active ? <Ionicons name="checkmark-circle" size={18} color={theme.primary} /> : null}
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

export default function AdminDashboardScreen() {
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [state, setState] = useState({ loading: false, error: '', message: '' });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedRecord, setSelectedRecord] = useState<ApiRecord | null>(null);
  const [alert, setAlert] = useState<{
    visible: boolean;
    type: AlertType;
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({ visible: false, type: 'success', title: '', message: '' });

  const drawerX = useRef(new Animated.Value(-drawerWidth)).current;
  const loadedTabsRef = useRef(new Set<TabKey>());
  const theme = themes[themeMode];
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [picker, setPicker] = useState<{ visible: boolean; mode: 'date' | 'time' }>({
    visible: false,
    mode: 'date',
  });

  const [dashboard, setDashboard] = useState<ApiRecord | null>(null);
  const [events, setEvents] = useState<ApiRecord[]>([]);
  const [eventForm, setEventForm] = useState<EventForm>({
    event_name: '',
    event_date: '',
    location: '',
    description: '',
    max_capacity: '',
  });

  const [participantEvents, setParticipantEvents] = useState<ApiRecord[]>([]);
  const [participantEventId, setParticipantEventId] = useState('');
  const [participantType, setParticipantType] = useState('graduates');
  const [participants, setParticipants] = useState<ApiRecord[]>([]);
  const [participantSearch, setParticipantSearch] = useState('');

  const [invitationEvents, setInvitationEvents] = useState<ApiRecord[]>([]);
  const [invitationEventId, setInvitationEventId] = useState('');
  const [sentParticipants, setSentParticipants] = useState<ApiRecord[]>([]);
  const [invitationRequests, setInvitationRequests] = useState<ApiRecord[]>([]);
  const [batches, setBatches] = useState<ApiRecord[]>([]);

  const [attendanceEvents, setAttendanceEvents] = useState<ApiRecord[]>([]);
  const [attendanceEventId, setAttendanceEventId] = useState('');
  const [attendanceDashboard, setAttendanceDashboard] = useState<ApiRecord | null>(null);
  const [attendanceList, setAttendanceList] = useState<ApiRecord[]>([]);

  const [reportEvents, setReportEvents] = useState<ApiRecord[]>([]);
  const [reportEventId, setReportEventId] = useState('');
  const [report, setReport] = useState<ApiRecord | null>(null);

  const [users, setUsers] = useState<ApiRecord[]>([]);
  const [roles, setRoles] = useState<ApiRecord[]>([]);
  const [userForm, setUserForm] = useState<UserForm>({
    username: '',
    full_name: '',
    email: '',
    phone: '',
    role: '',
    password: '',
  });

  const [logs, setLogs] = useState<ApiRecord[]>([]);

  const openDrawer = useCallback(() => {
    setDrawerOpen(true);
    Animated.timing(drawerX, { toValue: 0, duration: 240, useNativeDriver: true }).start();
  }, [drawerX]);

  const closeDrawer = useCallback(() => {
    Animated.timing(drawerX, { toValue: -drawerWidth, duration: 220, useNativeDriver: true }).start(() =>
      setDrawerOpen(false),
    );
  }, [drawerX]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dx) > 16 && Math.abs(gesture.dy) < 18,
        onPanResponderRelease: (_, gesture) => {
          if (!drawerOpen && gesture.dx > 60) openDrawer();
          if (drawerOpen && gesture.dx < -50) closeDrawer();
        },
      }),
    [closeDrawer, drawerOpen, openDrawer],
  );

  const showAlert = useCallback(
    (type: AlertType, title: string, message: string, onConfirm?: () => void) => {
      setAlert({ visible: true, type, title, message, onConfirm });
    },
    [],
  );

  const closeAlert = useCallback(() => {
    setAlert((current) => ({ ...current, visible: false, onConfirm: undefined }));
  }, []);

  const load = useCallback(
    async (tab = activeTab, force = false) => {
      if (!force && loadedTabsRef.current.has(tab)) {
        return;
      }
      setState((current) => ({ ...current, loading: true, error: '' }));
      try {
        if (tab === 'dashboard') {
          setDashboard(await adminRequest<ApiRecord>('/api/v1/dashboard/overview'));
        }

        if (tab === 'events') {
          setEvents(asArray(await adminRequest('/api/v1/events')));
        }

        if (tab === 'participants') {
          const loadedEvents = asArray(await adminRequest('/api/v1/participant-lists/events'));
          setParticipantEvents(loadedEvents);
          const selectedEventId = participantEventId || pickId(loadedEvents[0]);
          setParticipantEventId(selectedEventId);
          if (selectedEventId) {
            setParticipants(
              asArray(
                await adminRequest(
                  `/api/v1/participant-directories/types/${participantType}/events/${selectedEventId}/participants`,
                  { query: { search: participantSearch } },
                ),
              ),
            );
          }
        }

        if (tab === 'invitations') {
          const loadedEvents = asArray(await adminRequest('/api/v1/invitations/management/events'));
          setInvitationEvents(loadedEvents);
          const selectedEventId = invitationEventId || pickId(loadedEvents[0]);
          setInvitationEventId(selectedEventId);
          if (selectedEventId) {
            const [sent, requests, loadedBatches] = await Promise.all([
              adminRequest(`/api/v1/invitations/management/events/${selectedEventId}/sent-participants`),
              adminRequest(`/api/v1/invitations/management/events/${selectedEventId}/requests`),
              adminRequest(`/api/v1/invitations/batches/${selectedEventId}`),
            ]);
            setSentParticipants(asArray(sent));
            setInvitationRequests(asArray(requests));
            setBatches(asArray(loadedBatches));
          }
        }

        if (tab === 'attendance') {
          const loadedEvents = asArray(await adminRequest('/api/v1/attendance/events'));
          setAttendanceEvents(loadedEvents);
          const selectedEventId = attendanceEventId || pickId(loadedEvents[0]);
          setAttendanceEventId(selectedEventId);
          if (selectedEventId) {
            const [summary, list] = await Promise.all([
              adminRequest<ApiRecord>(`/api/v1/attendance/events/${selectedEventId}/dashboard`),
              adminRequest(`/api/v1/attendance/events/${selectedEventId}/list`),
            ]);
            setAttendanceDashboard(summary);
            setAttendanceList(asArray(list));
          }
        }

        if (tab === 'reports') {
          const loadedEvents = asArray(await adminRequest('/api/v1/reports/events'));
          setReportEvents(loadedEvents);
          const selectedEventId = reportEventId || pickId(loadedEvents[0]);
          setReportEventId(selectedEventId);
          if (selectedEventId) {
            setReport(await adminRequest<ApiRecord>(`/api/v1/reports/events/${selectedEventId}`));
          }
        }

        if (tab === 'users') {
          const [loadedUsers, loadedRoles] = await Promise.all([
            adminRequest('/api/v1/users'),
            adminRequest('/api/v1/users/roles'),
          ]);
          setUsers(asArray(loadedUsers));
          setRoles(asArray(loadedRoles));
        }

        if (tab === 'logs') {
          setLogs(asArray(await adminRequest('/api/v1/logs', { query: { limit: 50 } })));
        }

        loadedTabsRef.current.add(tab);
        setState({ loading: false, error: '', message: '' });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to load admin data.';
        setState({ loading: false, error: message, message: '' });
        showAlert('error', 'Unable to load data', message);
      }
    },
    [
      activeTab,
      attendanceEventId,
      invitationEventId,
      participantEventId,
      participantSearch,
      participantType,
      reportEventId,
      showAlert,
    ],
  );

  const loadRef = useRef(load);

  useEffect(() => {
    loadRef.current = load;
  }, [load]);

  useEffect(() => {
    void requireStoredRole(['Admin']);
  }, []);

  useEffect(() => {
    void loadRef.current(activeTab);
  }, [activeTab]);

  const metrics = (dashboard?.metrics as ApiRecord | undefined) || {};
  const roleNames = useMemo(() => roles.map((role) => text(role.role_name)).join(', '), [roles]);
  const selectedRoleIsValid = useMemo(
    () => roles.some((role) => roleName(role) === userForm.role),
    [roles, userForm.role],
  );

  async function performAction(action: () => Promise<unknown>, success: string) {
    setState((current) => ({ ...current, loading: true, error: '', message: '' }));
    try {
      await action();
      setState({ loading: false, error: '', message: success });
      showAlert('success', 'Success', success);
      loadedTabsRef.current.delete(activeTab);
      await load(activeTab, true);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Action failed.';
      setState({ loading: false, error: message, message: '' });
      showAlert('error', 'Action failed', message);
    }
  }

  function confirmAction(title: string, message: string, action: () => Promise<unknown>, success: string) {
    showAlert('confirm', title, message, () => {
      closeAlert();
      void performAction(action, success);
    });
  }

  function createEvent() {
    const payload: ApiRecord = {
      event_name: eventForm.event_name.trim(),
      event_date: eventForm.event_date.trim(),
      location: eventForm.location.trim(),
      description: eventForm.description.trim(),
      max_capacity: Number(eventForm.max_capacity || 0),
      status: 'active',
    };

    return performAction(async () => {
      await adminRequest('/api/v1/events', { method: 'POST', body: payload });
      setEventForm({ event_name: '', event_date: '', location: '', description: '', max_capacity: '' });
      setModalType(null);
    }, 'Event created successfully.');
  }

  function editEvent() {
    const eventId = pickId(selectedRecord);
    const payload: ApiRecord = {
      event_name: eventForm.event_name.trim(),
      event_date: eventForm.event_date.trim(),
      location: eventForm.location.trim(),
      description: eventForm.description.trim(),
      max_capacity: Number(eventForm.max_capacity || 0),
      status: findFirst(selectedRecord, ['status'], 'active'),
    };

    return performAction(async () => {
      await adminRequest(`/api/v1/events/${eventId}`, { method: 'PUT', body: payload });
      setModalType(null);
      setSelectedRecord(null);
    }, 'Event updated successfully.');
  }

  function createUser() {
    if (!selectedRoleIsValid) {
      showAlert('warning', 'Select a role', 'Choose a valid role from the backend role list before saving.');
      return;
    }

    const payload: ApiRecord = {
      username: userForm.username.trim(),
      full_name: userForm.full_name.trim(),
      email: userForm.email.trim(),
      phone: userForm.phone.trim(),
      role: userForm.role,
      password: userForm.password.trim() || undefined,
      is_active: true,
    };

    return performAction(async () => {
      await adminRequest('/api/v1/users', { method: 'POST', body: payload });
      setUserForm({ username: '', full_name: '', email: '', phone: '', role: '', password: '' });
      setModalType(null);
    }, 'User created successfully.');
  }

  function editUser() {
    if (userForm.role && !selectedRoleIsValid) {
      showAlert('warning', 'Select a role', 'Choose a valid role from the backend role list before saving.');
      return;
    }

    const userId = pickId(selectedRecord);
    const payload: ApiRecord = {
      full_name: userForm.full_name.trim() || undefined,
      email: userForm.email.trim() || undefined,
      phone: userForm.phone.trim() || undefined,
      role: userForm.role || undefined,
      is_active: selectedRecord?.is_active,
    };

    return performAction(async () => {
      await adminRequest(`/api/v1/users/${userId}`, { method: 'PATCH', body: payload });
      setModalType(null);
      setSelectedRecord(null);
    }, 'User updated successfully.');
  }

  function openEventEdit(event: ApiRecord) {
    setSelectedRecord(event);
    setEventForm({
      event_name: findFirst(event, ['event_name', 'name']),
      event_date: findFirst(event, ['event_date']),
      location: findFirst(event, ['location']),
      description: findFirst(event, ['description']),
      max_capacity: findFirst(event, ['max_capacity']),
    });
    setModalType('eventEdit');
  }

  function openUserEdit(user: ApiRecord) {
    setSelectedRecord(user);
    setUserForm({
      username: findFirst(user, ['username']),
      full_name: findFirst(user, ['full_name']),
      email: findFirst(user, ['email']),
      phone: findFirst(user, ['phone']),
      role: findFirst(user, ['role']),
      password: '',
    });
    setModalType('userEdit');
  }

  function updateEventDateTime(selected: Date, mode: 'date' | 'time') {
    const current = eventForm.event_date ? new Date(eventForm.event_date) : new Date();
    const base = Number.isNaN(current.getTime()) ? new Date() : current;

    if (mode === 'date') {
      base.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
    } else {
      base.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
    }

    const local = new Date(base.getTime() - base.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16)
      .replace('T', ' ');
    setEventForm((currentForm) => ({ ...currentForm, event_date: local }));
  }

  function onDateTimePicked(event: DateTimePickerEvent, selected?: Date) {
    if (Platform.OS !== 'ios') {
      setPicker((current) => ({ ...current, visible: false }));
    }
    if (event.type === 'dismissed' || !selected) return;
    updateEventDateTime(selected, picker.mode);
  }

  function openDetails(type: ModalType, record: ApiRecord) {
    setSelectedRecord(record);
    setModalType(type);
  }

  function renderDashboard() {
    const shortcuts = tabs.filter((tab) => tab.key !== 'dashboard');

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.summaryGrid}>
          <SummaryCard label="Total Events" value={metrics.total_events} icon="calendar-multiple" styles={styles} theme={theme} />
          <SummaryCard label="Participants" value={metrics.total_participants} icon="account-group" styles={styles} theme={theme} />
          <SummaryCard label="Invitations" value={metrics.total_invitations_sent} icon="email-check-outline" styles={styles} theme={theme} />
          <SummaryCard label="Attendance" value={metrics.total_attended} icon="check-decagram-outline" styles={styles} theme={theme} />
          <SummaryCard label="Active Events" value={metrics.active_events} icon="calendar-clock" styles={styles} theme={theme} />
          <SummaryCard label="Finished" value={metrics.finished_events} icon="calendar-check" styles={styles} theme={theme} />
        </View>

        <Text style={styles.sectionTitle}>Quick Access</Text>
        <View style={styles.shortcutGrid}>
          {shortcuts.slice(0, 6).map((tab) => (
            <Pressable
              accessibilityRole="button"
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={styles.shortcutCard}>
              <View style={styles.shortcutIcon}>
                <MaterialCommunityIcons name={moduleIcons[tab.key]} size={22} color={theme.primary} />
              </View>
              <View>
                <Text style={styles.shortcutTitle}>{tab.label}</Text>
                <Text style={styles.shortcutText}>{moduleDescriptions[tab.key]}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </View>
    );
  }

  function renderEvents() {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Events</Text>
            <Text style={styles.sectionHint}>Create, view, and remove events using the existing Events API.</Text>
          </View>
        </View>
        <Pressable accessibilityRole="button" style={styles.primaryButton} onPress={() => setModalType('event')}>
          <Ionicons name="add-circle-outline" size={19} color={theme.white} />
          <Text style={styles.primaryButtonText}>Add New Event</Text>
        </Pressable>

        {events.map((event) => (
          <DataCard
            key={pickId(event)}
            title={findFirst(event, ['event_name', 'name'], 'Event')}
            subtitle={`${dateText(event.event_date)} - ${findFirst(event, ['location'], 'No location')}`}
            meta={`Status: ${findFirst(event, ['status'], 'unknown')} - Capacity: ${numberText(event.max_capacity)}`}
            actionIcon="pencil-outline"
            secondActionIcon="trash-can-outline"
            secondDanger
            styles={styles}
            theme={theme}
            onView={() => openDetails('eventView', event)}
            onPress={() => openEventEdit(event)}
            onSecondPress={() =>
              confirmAction(
                'Delete event?',
                `This will delete ${findFirst(event, ['event_name', 'name'], 'this event')}.`,
                () => adminRequest(`/api/v1/events/${pickId(event)}`, { method: 'DELETE' }),
                'Event deleted successfully.',
              )
            }
          />
        ))}
        {!events.length ? <EmptyState title="No events returned by backend." styles={styles} theme={theme} /> : null}
      </View>
    );
  }

  function renderParticipants() {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Filters</Text>
        <View style={styles.chipRow}>
          {participantTypes.map((type) => (
            <Pressable
              key={type.slug}
              style={[styles.chip, participantType === type.slug && styles.chipActive]}
              onPress={() => {
                setParticipantType(type.slug);
                setParticipants([]);
                loadedTabsRef.current.delete('participants');
              }}>
              <Text style={[styles.chipText, participantType === type.slug && styles.chipTextActive]}>
                {type.label}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.inputWrap}>
          <MaterialCommunityIcons name="magnify" size={19} color={theme.subtle} />
          <TextInput
            autoCapitalize="none"
            onChangeText={setParticipantSearch}
            onSubmitEditing={() => load('participants', true)}
            placeholder="Search participants"
            placeholderTextColor={theme.subtle}
            style={styles.input}
            value={participantSearch}
          />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.eventSelector}>
          {participantEvents.map((event) => (
            <Pressable
              key={pickId(event)}
              style={[styles.eventPill, participantEventId === pickId(event) && styles.eventPillActive]}
              onPress={() => {
                setParticipantEventId(pickId(event));
                loadedTabsRef.current.delete('participants');
              }}>
              <Text style={styles.eventPillText}>{findFirst(event, ['event_name', 'name'], 'Event')}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <Pressable style={styles.secondaryAction} onPress={() => load('participants', true)}>
          <MaterialCommunityIcons name="database-search-outline" size={18} color={theme.primary} />
          <Text style={styles.secondaryActionText}>Load Participants</Text>
        </Pressable>

        <Text style={styles.sectionTitle}>Participants</Text>
        {participants.length ? (
          participants.map((participant, index) => (
            <DataCard
              key={`${pickId(participant)}-${index}`}
              title={findFirst(participant, ['full_name', 'name', 'guest_name', 'username'], 'Participant')}
              subtitle={findFirst(participant, ['email', 'student_id', 'user_id', 'phone'])}
              meta={`Role: ${findFirst(participant, ['role', 'type_name', 'participant_role'], participantType)}`}
              actionIcon="key-plus"
              styles={styles}
              theme={theme}
              onView={() => openDetails('participantView', participant)}
              onPress={() =>
                confirmAction(
                  'Generate password?',
                  `Generate a login password for ${findFirst(participant, ['full_name', 'name', 'username'], 'this participant')}?`,
                  () =>
                    adminRequest(
                      `/api/v1/participant-directories/types/${participantType}/events/${participantEventId}/participants/${pickId(participant)}/password`,
                      { method: 'POST' },
                    ),
                  'Participant password generated.',
                )
              }
            />
          ))
        ) : (
          <EmptyState title="Select an event and load participants." styles={styles} theme={theme} />
        )}
      </View>
    );
  }

  function renderInvitations() {
    return (
      <View style={styles.section}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.eventSelector}>
          {invitationEvents.map((event) => (
            <Pressable
              key={pickId(event)}
              style={[styles.eventPill, invitationEventId === pickId(event) && styles.eventPillActive]}
              onPress={() => {
                setInvitationEventId(pickId(event));
                loadedTabsRef.current.delete('invitations');
              }}>
              <Text style={styles.eventPillText}>{findFirst(event, ['event_name', 'name'], 'Event')}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <Pressable style={styles.secondaryAction} onPress={() => load('invitations', true)}>
          <MaterialCommunityIcons name="email-sync-outline" size={18} color={theme.primary} />
          <Text style={styles.secondaryActionText}>Load Invitations</Text>
        </Pressable>

        <Text style={styles.sectionTitle}>Sent Invitations</Text>
        {sentParticipants.map((participant, index) => (
          <DataCard
            key={`sent-${index}`}
            title={findFirst(participant, ['full_name', 'name', 'username'], 'Participant')}
            subtitle={`Tickets: ${numberText(participant.quantity || participant.invitation_count)}`}
            meta={findFirst(participant, ['comm_status', 'status', 'role'])}
            actionIcon="send-clock-outline"
            styles={styles}
            theme={theme}
            onPress={() =>
              confirmAction(
                'Resend invitation?',
                `Resend invitation to ${findFirst(participant, ['full_name', 'name', 'username'], 'this participant')}?`,
                () =>
                  adminRequest(
                    `/api/v1/invitations/management/events/${invitationEventId}/participants/${pickId(participant)}/resend`,
                    { method: 'POST' },
                  ),
                'Invitation resend processed.',
              )
            }
          />
        ))}

        <Text style={styles.sectionTitle}>Invitation Requests</Text>
        {invitationRequests.length ? (
          invitationRequests.map((request, index) => (
            <DataCard
              key={`request-${index}`}
              title={findFirst(request, ['requester_name', 'full_name', 'username'], 'Invitation request')}
              subtitle={`Requested: ${numberText(request.requested_qty || request.quantity || request.qty)}`}
              meta={`Status: ${findFirst(request, ['status'], 'unknown')}`}
              actionIcon="check-circle-outline"
              styles={styles}
              theme={theme}
              onPress={() =>
                confirmAction(
                  'Approve request?',
                  'This will approve the invitation request using the existing backend endpoint.',
                  () =>
                    adminRequest(`/api/v1/invitations/management/requests/${pickId(request)}/approve`, {
                      method: 'POST',
                    }),
                  'Invitation request approved.',
                )
              }
            />
          ))
        ) : (
          <EmptyState title="No invitation requests returned for this event." styles={styles} theme={theme} />
        )}

        <Text style={styles.sectionTitle}>Generation Batches</Text>
        {batches.map((batch, index) => (
          <DataCard
            key={`batch-${index}`}
            title={findFirst(batch, ['batch_name'], 'Batch')}
            subtitle={`Status: ${findFirst(batch, ['status'], 'unknown')}`}
            meta={`Total: ${numberText(batch.total_count)} - Qty each: ${numberText(batch.qty_per_person)}`}
            styles={styles}
            theme={theme}
          />
        ))}
      </View>
    );
  }

  function renderAttendance() {
    const stats = attendanceDashboard || {};
    return (
      <View style={styles.section}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.eventSelector}>
          {attendanceEvents.map((event) => (
            <Pressable
              key={pickId(event)}
              style={[styles.eventPill, attendanceEventId === pickId(event) && styles.eventPillActive]}
              onPress={() => {
                setAttendanceEventId(pickId(event));
                loadedTabsRef.current.delete('attendance');
              }}>
              <Text style={styles.eventPillText}>{findFirst(event, ['event_name', 'name'], 'Event')}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <Pressable style={styles.secondaryAction} onPress={() => load('attendance', true)}>
          <MaterialCommunityIcons name="qrcode-scan" size={18} color={theme.primary} />
          <Text style={styles.secondaryActionText}>Load Attendance</Text>
        </Pressable>
        <Pressable style={styles.primaryButton} onPress={() => router.push('/qr-scanner')}>
          <MaterialCommunityIcons name="camera-outline" size={18} color={theme.white} />
          <Text style={styles.primaryButtonText}>Open QR Scanner</Text>
        </Pressable>

        <View style={styles.summaryGrid}>
          <SummaryCard label="Attended" value={stats.attended || stats.attended_count || stats.total_attended} icon="account-check-outline" styles={styles} theme={theme} />
          <SummaryCard label="Absent" value={stats.absent || stats.not_attended || stats.pending} icon="account-clock-outline" styles={styles} theme={theme} />
          <SummaryCard label="Total" value={stats.total || stats.total_participants || attendanceList.length} icon="account-group-outline" styles={styles} theme={theme} />
          <SummaryCard label="Rate" value={stats.percentage || stats.attendance_rate} icon="chart-donut" styles={styles} theme={theme} />
        </View>

        <Text style={styles.sectionTitle}>Scan Results</Text>
        {attendanceList.length ? (
          attendanceList.map((item, index) => (
            <DataCard
              key={`attendance-${index}`}
              title={findFirst(item, ['full_name', 'name', 'username'], 'Participant')}
              subtitle={findFirst(item, ['role', 'type', 'participant_role'])}
              meta={dateText(item.scanned_at || item.time || item.created_at)}
              styles={styles}
              theme={theme}
            />
          ))
        ) : (
          <EmptyState title="No attendance records returned for this event." styles={styles} theme={theme} />
        )}
      </View>
    );
  }

  function renderReports() {
    const summary = (report?.summary as ApiRecord | undefined) || {};
    const analysis = (report?.attendance_analysis as ApiRecord | undefined) || {};
    const invitationAnalysis = (report?.invitation_analysis as ApiRecord | undefined) || {};
    const lists = (report?.lists as ApiRecord | undefined) || {};

    return (
      <View style={styles.section}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.eventSelector}>
          {reportEvents.map((event) => (
            <Pressable
              key={pickId(event)}
              style={[styles.eventPill, reportEventId === pickId(event) && styles.eventPillActive]}
              onPress={() => {
                setReportEventId(pickId(event));
                loadedTabsRef.current.delete('reports');
              }}>
              <Text style={styles.eventPillText}>{findFirst(event, ['event_name', 'name'], 'Event')}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <Pressable style={styles.secondaryAction} onPress={() => load('reports', true)}>
          <MaterialCommunityIcons name="chart-box-outline" size={18} color={theme.primary} />
          <Text style={styles.secondaryActionText}>Load Report</Text>
        </Pressable>

        <View style={styles.summaryGrid}>
          <SummaryCard label="Invitations" value={summary.total_invitations || invitationAnalysis.sent} icon="email-check-outline" styles={styles} theme={theme} />
          <SummaryCard label="Attended" value={summary.total_attended || analysis.attended} icon="account-check-outline" styles={styles} theme={theme} />
          <SummaryCard label="Absent" value={analysis.absent} icon="account-off-outline" styles={styles} theme={theme} />
          <SummaryCard label="Attendance %" value={analysis.percentage} icon="chart-arc" styles={styles} theme={theme} />
        </View>

        <Text style={styles.sectionTitle}>Attended</Text>
        {asArray(lists.attended).slice(0, 20).map((item, index) => (
          <DataCard key={`attended-${index}`} title={findFirst(item, ['name'])} subtitle={findFirst(item, ['type'])} meta={dateText(item.time)} styles={styles} theme={theme} />
        ))}

        <Text style={styles.sectionTitle}>Not Attended</Text>
        {asArray(lists.absent).slice(0, 20).map((item, index) => (
          <DataCard key={`absent-${index}`} title={findFirst(item, ['name'])} subtitle={findFirst(item, ['type'])} styles={styles} theme={theme} />
        ))}
      </View>
    );
  }

  function renderUsers() {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Users</Text>
            <Text style={styles.sectionHint}>Create users and reset passwords with the existing Users API.</Text>
          </View>
        </View>
        <Pressable accessibilityRole="button" style={styles.primaryButton} onPress={() => setModalType('user')}>
          <Ionicons name="person-add-outline" size={19} color={theme.white} />
          <Text style={styles.primaryButtonText}>Add New User</Text>
        </Pressable>

        {users.map((user) => (
          <DataCard
            key={pickId(user)}
            title={findFirst(user, ['full_name', 'username'], 'User')}
            subtitle={`${findFirst(user, ['username'])} - ${findFirst(user, ['role'])}`}
            meta={`Active: ${text(user.is_active)} - ${findFirst(user, ['email'], 'No email')}`}
            actionIcon="pencil-outline"
            secondActionIcon="lock-reset"
            styles={styles}
            theme={theme}
            onView={() => openDetails('userView', user)}
            onPress={() => openUserEdit(user)}
            onSecondPress={() =>
              confirmAction(
                'Reset password?',
                `Reset password for ${findFirst(user, ['full_name', 'username'], 'this user')}?`,
                () => adminRequest(`/api/v1/users/${pickId(user)}/reset-password`, { method: 'POST' }),
                'Password reset successfully.',
              )
            }
          />
        ))}
      </View>
    );
  }

  function renderLogs() {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>System Activity Logs</Text>
        {logs.length ? (
          logs.map((log, index) => (
            <DataCard
              key={`log-${index}`}
              title={findFirst(log, ['action_type'], 'Activity')}
              subtitle={findFirst(log, ['description'])}
              meta={`${findFirst(log, ['actor_name', 'performed_by', 'username'], 'System')} - ${dateText(log.created_at)}`}
              styles={styles}
              theme={theme}
            />
          ))
        ) : (
          <EmptyState title="No logs returned by backend." styles={styles} theme={theme} />
        )}
      </View>
    );
  }

  function renderActiveTab() {
    if (activeTab === 'dashboard') return renderDashboard();
    if (activeTab === 'events') return renderEvents();
    if (activeTab === 'participants') return renderParticipants();
    if (activeTab === 'invitations') return renderInvitations();
    if (activeTab === 'attendance') return renderAttendance();
    if (activeTab === 'reports') return renderReports();
    if (activeTab === 'users') return renderUsers();
    return renderLogs();
  }

  function renderDrawer() {
    if (!drawerOpen) return null;

    return (
      <>
        <Pressable style={styles.drawerOverlay} onPress={closeDrawer} />
        <Animated.View style={[styles.drawer, { transform: [{ translateX: drawerX }] }]}>
          <View style={styles.drawerHeader}>
            <View style={styles.profileBlock}>
              <View style={styles.drawerLogo}>
                <MaterialCommunityIcons name="shield-account-outline" size={24} color={theme.white} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.drawerTitle}>Admin Portal</Text>
                <Text style={styles.drawerSubtitle}>Event operations workspace</Text>
              </View>
            </View>
            <Pressable accessibilityRole="button" onPress={closeDrawer} style={styles.iconButton}>
              <Ionicons name="close" size={21} color={theme.text} />
            </Pressable>
          </View>

          {tabs.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <Pressable
                accessibilityRole="button"
                key={tab.key}
                onPress={() => {
                  setActiveTab(tab.key);
                  closeDrawer();
                }}
                style={[styles.drawerItem, active && styles.drawerItemActive]}>
                <View style={[styles.drawerItemIcon, active && styles.drawerItemIconActive]}>
                  <MaterialCommunityIcons
                    name={moduleIcons[tab.key]}
                    size={20}
                    color={active ? theme.white : theme.primary}
                  />
                </View>
                <View style={styles.drawerItemCopy}>
                  <Text style={[styles.drawerItemText, active && styles.drawerItemTextActive]}>{tab.label}</Text>
                  <Text style={styles.drawerItemHint}>{moduleDescriptions[tab.key]}</Text>
                </View>
              </Pressable>
            );
          })}

          <View style={styles.drawerFooter}>
            <View style={styles.themeRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
                <Ionicons name={themeMode === 'dark' ? 'moon' : 'sunny'} size={18} color={theme.primary} />
                <Text style={styles.themeLabel}>Dark Mode</Text>
              </View>
              <Switch
                onValueChange={(enabled) => setThemeMode(enabled ? 'dark' : 'light')}
                thumbColor={theme.white}
                trackColor={{ false: theme.border, true: theme.primary }}
                value={themeMode === 'dark'}
              />
            </View>
            <Pressable
              style={styles.secondaryAction}
              onPress={async () => {
                await clearAuthSession();
                router.replace('/');
              }}>
              <Ionicons name="exit-outline" size={18} color={theme.primary} />
              <Text style={styles.secondaryActionText}>Logout</Text>
            </Pressable>
          </View>
        </Animated.View>
      </>
    );
  }

  function renderModalContent() {
    if (modalType === 'event' || modalType === 'eventEdit') {
      return (
        <>
          <FormInput icon="calendar-edit" placeholder="Event name" value={eventForm.event_name} onChangeText={(event_name) => setEventForm((current) => ({ ...current, event_name }))} styles={styles} theme={theme} />
          <View style={styles.formCard}>
            <Text style={styles.sectionHint}>Event Date & Time</Text>
            <Pressable style={styles.secondaryAction} onPress={() => setPicker({ visible: true, mode: 'date' })}>
              <MaterialCommunityIcons name="calendar-month-outline" size={18} color={theme.primary} />
              <Text style={styles.secondaryActionText}>{eventForm.event_date || 'Select date'}</Text>
            </Pressable>
            <Pressable style={styles.secondaryAction} onPress={() => setPicker({ visible: true, mode: 'time' })}>
              <MaterialCommunityIcons name="clock-outline" size={18} color={theme.primary} />
              <Text style={styles.secondaryActionText}>Select time</Text>
            </Pressable>
          </View>
          <FormInput icon="map-marker-outline" placeholder="Location" value={eventForm.location} onChangeText={(location) => setEventForm((current) => ({ ...current, location }))} styles={styles} theme={theme} />
          <FormInput icon="seat-outline" placeholder="Max capacity" keyboardType="number-pad" value={eventForm.max_capacity} onChangeText={(max_capacity) => setEventForm((current) => ({ ...current, max_capacity }))} styles={styles} theme={theme} />
          <FormInput icon="text-box-outline" placeholder="Description" multiline value={eventForm.description} onChangeText={(description) => setEventForm((current) => ({ ...current, description }))} styles={styles} theme={theme} />
          {picker.visible ? (
            <DateTimePicker
              mode={picker.mode}
              value={safeDateValue(eventForm.event_date)}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onDateTimePicked}
            />
          ) : null}
          <Pressable style={styles.primaryButton} onPress={modalType === 'eventEdit' ? editEvent : createEvent}>
            <Ionicons name={modalType === 'eventEdit' ? 'save-outline' : 'add-circle-outline'} size={19} color={theme.white} />
            <Text style={styles.primaryButtonText}>{modalType === 'eventEdit' ? 'Save Event' : 'Create Event'}</Text>
          </Pressable>
        </>
      );
    }

    if (modalType === 'user' || modalType === 'userEdit') {
      return (
        <>
          {modalType === 'user' ? (
            <FormInput icon="account-outline" placeholder="Username" value={userForm.username} onChangeText={(username) => setUserForm((current) => ({ ...current, username }))} styles={styles} theme={theme} />
          ) : null}
          <FormInput icon="account-card-outline" placeholder="Full name" value={userForm.full_name} onChangeText={(full_name) => setUserForm((current) => ({ ...current, full_name }))} styles={styles} theme={theme} />
          <FormInput icon="email-outline" placeholder="Email" autoCapitalize="none" keyboardType="email-address" value={userForm.email} onChangeText={(email) => setUserForm((current) => ({ ...current, email }))} styles={styles} theme={theme} />
          <FormInput icon="phone-outline" placeholder="Phone" value={userForm.phone} onChangeText={(phone) => setUserForm((current) => ({ ...current, phone }))} styles={styles} theme={theme} />
          <RolePicker
            roles={roles}
            selectedRole={userForm.role}
            onSelect={(role) => setUserForm((current) => ({ ...current, role }))}
            styles={styles}
            theme={theme}
          />
          {roles.length ? (
            <Text style={styles.sectionHint}>Available roles are loaded from the backend: {roleNames}</Text>
          ) : null}
          {modalType === 'user' ? (
            <FormInput icon="lock-outline" placeholder="Password (optional)" secureTextEntry value={userForm.password} onChangeText={(password) => setUserForm((current) => ({ ...current, password }))} styles={styles} theme={theme} />
          ) : null}
          <Pressable style={styles.primaryButton} onPress={modalType === 'userEdit' ? editUser : createUser}>
            <Ionicons name={modalType === 'userEdit' ? 'save-outline' : 'person-add-outline'} size={19} color={theme.white} />
            <Text style={styles.primaryButtonText}>{modalType === 'userEdit' ? 'Save User' : 'Create User'}</Text>
          </Pressable>
        </>
      );
    }

    const record = selectedRecord || {};
    return Object.entries(record).slice(0, 16).map(([key, value]) => (
      <View style={styles.detailRow} key={key}>
        <Text style={styles.detailLabel}>{key.replace(/_/g, ' ')}</Text>
        <Text style={styles.detailValue}>{text(value)}</Text>
      </View>
    ));
  }

  function renderFormModal() {
    const title =
      modalType === 'event'
        ? 'Add New Event'
        : modalType === 'eventEdit'
          ? 'Edit Event'
        : modalType === 'user'
          ? 'Add New User'
          : modalType === 'userEdit'
            ? 'Edit User'
            : modalType === 'eventView'
              ? 'Event Details'
              : modalType === 'participantView'
                ? 'Participant Details'
                : modalType === 'userView'
                  ? 'User Details'
                  : '';

    return (
      <Modal animationType="fade" transparent visible={Boolean(modalType)} onRequestClose={() => setModalType(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>{title}</Text>
                <Text style={styles.modalSubtitle}>Frontend uses only existing backend endpoints.</Text>
              </View>
              <Pressable accessibilityRole="button" onPress={() => setModalType(null)} style={styles.iconButton}>
                <Ionicons name="close" size={21} color={theme.text} />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
              {renderModalContent()}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  }

  function renderAlertModal() {
    const icon =
      alert.type === 'success'
        ? 'check-circle-outline'
        : alert.type === 'error'
          ? 'alert-circle-outline'
          : alert.type === 'warning'
            ? 'alert-outline'
            : 'help-circle-outline';
    const color =
      alert.type === 'success'
        ? theme.success
        : alert.type === 'error'
          ? theme.danger
          : alert.type === 'warning'
            ? theme.warning
            : theme.primary;
    const soft =
      alert.type === 'success'
        ? theme.successSoft
        : alert.type === 'error'
          ? theme.dangerSoft
          : alert.type === 'warning'
            ? theme.warningSoft
            : theme.primarySoft;

    return (
      <Modal animationType="fade" transparent visible={alert.visible} onRequestClose={closeAlert}>
        <View style={styles.modalOverlay}>
          <View style={styles.alertCard}>
            <View style={[styles.alertIcon, { backgroundColor: soft }]}>
              <MaterialCommunityIcons name={icon} size={30} color={color} />
            </View>
            <Text style={styles.alertTitle}>{alert.title}</Text>
            <Text style={styles.alertMessage}>{alert.message}</Text>
            <View style={styles.alertActions}>
              {alert.type === 'confirm' ? (
                <Pressable style={styles.alertCancel} onPress={closeAlert}>
                  <Text style={styles.alertCancelText}>Cancel</Text>
                </Pressable>
              ) : null}
              <Pressable
                style={[styles.alertConfirm, alert.type === 'error' && styles.alertConfirmDanger]}
                onPress={alert.onConfirm || closeAlert}>
                <Text style={styles.alertConfirmText}>{alert.type === 'confirm' ? 'Continue' : 'OK'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} {...panResponder.panHandlers}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable accessibilityRole="button" onPress={openDrawer} style={styles.iconButton}>
            <Ionicons name="menu" size={23} color={theme.text} />
          </Pressable>
          <View>
            <Text style={styles.eyebrow}>Admin Portal</Text>
            <Text style={styles.title}>{tabs.find((tab) => tab.key === activeTab)?.label}</Text>
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => setThemeMode((current) => (current === 'dark' ? 'light' : 'dark'))}
          style={styles.modeButton}>
          <Ionicons name={themeMode === 'dark' ? 'moon' : 'sunny'} size={20} color={theme.primary} />
        </Pressable>
      </View>

      {state.error ? (
        <View style={[styles.banner, styles.errorBanner]}>
          <MaterialCommunityIcons name="alert-circle-outline" size={19} color={theme.danger} />
          <Text style={styles.bannerText}>{state.error}</Text>
          <Pressable style={styles.retryButton} onPress={() => load(activeTab, true)}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : null}
      {state.message ? (
        <View style={[styles.banner, styles.successBanner]}>
          <MaterialCommunityIcons name="check-circle-outline" size={19} color={theme.success} />
          <Text style={styles.bannerText}>{state.message}</Text>
        </View>
      ) : null}

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        refreshControl={<RefreshControl refreshing={state.loading} onRefresh={() => load(activeTab, true)} />}
        showsVerticalScrollIndicator={false}>
        {state.loading && !dashboard && activeTab === 'dashboard' ? (
          <View style={styles.loader}>
            <ActivityIndicator color={theme.primary} />
            <Text style={styles.loaderText}>Loading admin data...</Text>
          </View>
        ) : (
          renderActiveTab()
        )}
      </ScrollView>

      {renderDrawer()}
      {renderFormModal()}
      {renderAlertModal()}
    </SafeAreaView>
  );
}
