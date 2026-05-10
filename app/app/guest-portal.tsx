import { ParticipantPortal } from '@/components/participant-portal';

export default function GuestPortalScreen() {
  return (
    <ParticipantPortal
      kind="guest"
      title="Guest Portal"
      accent="#0f766e"
      icon="account-multiple-outline"
    />
  );
}
