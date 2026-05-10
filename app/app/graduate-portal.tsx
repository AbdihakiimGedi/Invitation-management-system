import { ParticipantPortal } from '@/components/participant-portal';

export default function GraduatePortalScreen() {
  return (
    <ParticipantPortal
      kind="graduate"
      title="Graduate Portal"
      accent="#1f6feb"
      icon="school-outline"
      canRequestMore
    />
  );
}
