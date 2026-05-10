#!/bin/bash
# =============================================================================
#  restore.sh — Safe PostgreSQL Database Restore
#  Project : Invitation Management System
#  Usage   : ./restore.sh [backup_file]
#  Example : ./restore.sh digital_invitation_backup.sql
#            ./restore.sh /backups/digital_invitation_backup.dump
# =============================================================================

set -euo pipefail

# ─── Colours ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'
YEL='\033[1;33m'
GRN='\033[0;32m'
BLU='\033[0;34m'
NC='\033[0m' # No Colour

# ─── Helpers ──────────────────────────────────────────────────────────────────
info()    { echo -e "${BLU}[INFO]${NC}  $*"; }
success() { echo -e "${GRN}[OK]${NC}    $*"; }
warn()    { echo -e "${YEL}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*" >&2; }
die()     { error "$*"; exit 1; }

# ─── Banner ───────────────────────────────────────────────────────────────────
echo ""
echo -e "${BLU}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLU}║   Invitation Management System — DB Restore Tool        ║${NC}"
echo -e "${BLU}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# ─── Step 1: Resolve backup file ─────────────────────────────────────────────
BACKUP_FILE="${1:-}"

if [[ -z "$BACKUP_FILE" ]]; then
  # Auto-detect common backup names in the current directory
  for candidate in \
      digital_invitation_backup.sql \
      digital_invitation_backup.dump \
      dataabse.sql \
      database.sql \
      backup.sql; do
    if [[ -f "$candidate" ]]; then
      BACKUP_FILE="$candidate"
      info "Auto-detected backup file: $BACKUP_FILE"
      break
    fi
  done
fi

[[ -z "$BACKUP_FILE" ]] && \
  die "No backup file specified and none auto-detected.\nUsage: $0 <backup_file>"

[[ -f "$BACKUP_FILE" ]] || \
  die "Backup file not found: $BACKUP_FILE"

# Determine format: .dump → pg_restore, everything else → psql
EXT="${BACKUP_FILE##*.}"
if [[ "$EXT" == "dump" ]]; then
  RESTORE_MODE="pg_restore"
else
  RESTORE_MODE="psql"
fi

info "Backup file  : $BACKUP_FILE"
info "Restore mode : $RESTORE_MODE"
echo ""

# ─── Step 2: Resolve connection parameters ───────────────────────────────────
DB_HOST="${DB_HOST:-postgres}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-Digital Invitation & Attendance Management}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-}"

# Export password so psql/pg_restore pick it up without a prompt
export PGPASSWORD="$DB_PASSWORD"

info "Target server : $DB_HOST:$DB_PORT"
info "Target DB     : $DB_NAME"
info "DB user       : $DB_USER"
echo ""

# ─── Step 3: Safety — confirm correct database ───────────────────────────────
warn "╔══════════════════════════════════════════════════════════╗"
warn "║  ⚠  DESTRUCTIVE OPERATION — READ CAREFULLY              ║"
warn "╠══════════════════════════════════════════════════════════╣"
warn "║  This will DROP and RECREATE the public schema in:      ║"
warn "║                                                          ║"
warn "║  Database : $DB_NAME"
warn "║  Host     : $DB_HOST:$DB_PORT"
warn "║                                                          ║"
warn "║  All existing data in THIS database will be ERASED.     ║"
warn "║  Other Coolify projects / databases are NOT affected.   ║"
warn "╚══════════════════════════════════════════════════════════╝"
echo ""

read -r -p "  Type  YES  to proceed (anything else aborts): " CONFIRM
echo ""

if [[ "$CONFIRM" != "YES" ]]; then
  info "Restore aborted by user."
  exit 0
fi

# ─── Step 4: Verify DB connection ────────────────────────────────────────────
info "Verifying database connection..."

psql \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  -c "SELECT version();" \
  --no-password \
  -q \
  > /dev/null 2>&1 \
  || die "Cannot connect to database '$DB_NAME' on $DB_HOST:$DB_PORT as $DB_USER.\nCheck DB_HOST / DB_PORT / DB_USER / DB_PASSWORD / DB_NAME."

success "Database connection verified."
echo ""

# ─── Step 5: Show current state before drop ──────────────────────────────────
info "Current table count before restore:"
psql \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  --no-password \
  -t \
  -c "SELECT COUNT(*) || ' table(s) found in public schema'
      FROM information_schema.tables
      WHERE table_schema = 'public';"
echo ""

# ─── Step 6: Drop and recreate schema (ONLY this project's DB) ───────────────
info "Dropping public schema in '$DB_NAME' (isolated to this DB only)..."

psql \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  --no-password \
  -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;" \
  || die "Failed to reset schema."

success "Schema reset complete."
echo ""

# ─── Step 7: Restore from backup ─────────────────────────────────────────────
info "Restoring from '$BACKUP_FILE' using $RESTORE_MODE..."
echo ""

if [[ "$RESTORE_MODE" == "pg_restore" ]]; then
  pg_restore \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --no-password \
    --verbose \
    --no-owner \
    --no-acl \
    --exit-on-error \
    "$BACKUP_FILE" \
    || die "pg_restore failed. Database may be in partial state. Re-run restore."
else
  # psql — suppress individual NOTICE messages, show errors only
  psql \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --no-password \
    -v ON_ERROR_STOP=1 \
    -f "$BACKUP_FILE" \
    || die "psql restore failed. Database may be in partial state. Re-run restore."
fi

success "Restore command completed."
echo ""

# ─── Step 8: Verify restoration ──────────────────────────────────────────────
info "Verifying restored schema..."
echo ""

VERIFY_SQL="
SELECT
  t.table_name                                              AS \"Table\",
  c.constraint_count::TEXT || ' constraint(s)'             AS \"Constraints\",
  i.index_count::TEXT    || ' index(es)'                   AS \"Indexes\",
  COALESCE(r.row_count::TEXT, '0') || ' row(s)'            AS \"Rows\"
FROM information_schema.tables t
LEFT JOIN (
  SELECT table_name, COUNT(*) AS constraint_count
  FROM information_schema.table_constraints
  WHERE table_schema = 'public'
  GROUP BY table_name
) c ON c.table_name = t.table_name
LEFT JOIN (
  SELECT tablename AS table_name, COUNT(*) AS index_count
  FROM pg_indexes
  WHERE schemaname = 'public'
  GROUP BY tablename
) i ON i.table_name = t.table_name
LEFT JOIN (
  SELECT relname AS table_name, reltuples::BIGINT AS row_count
  FROM pg_class
  WHERE relkind = 'r' AND relnamespace = 'public'::regnamespace
) r ON r.table_name = t.table_name
WHERE t.table_schema = 'public'
ORDER BY t.table_name;
"

psql \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  --no-password \
  -c "$VERIFY_SQL"

echo ""

# ─── Step 9: Critical table checklist ────────────────────────────────────────
info "Checking critical tables..."

CRITICAL_TABLES=(
  users
  events
  people_types
  students
  guests
  event_participants
  invitation_batches
  invitations
  invitation_deliveries
  invitation_requests
  invitation_scans
  invitation_templates
  attendance_records
  seats
  seat_groups
  seat_assignments
  qrcodes
  system_roles
  system_activity_logs
)

ALL_OK=true
for TABLE in "${CRITICAL_TABLES[@]}"; do
  EXISTS=$(psql \
    -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    --no-password -t \
    -c "SELECT 1 FROM information_schema.tables
        WHERE table_schema='public' AND table_name='$TABLE';" \
    | tr -d '[:space:]')

  if [[ "$EXISTS" == "1" ]]; then
    success "  ✔  $TABLE"
  else
    error   "  ✘  $TABLE — MISSING"
    ALL_OK=false
  fi
done

echo ""

# ─── Step 10: Final result ────────────────────────────────────────────────────
if [[ "$ALL_OK" == "true" ]]; then
  echo -e "${GRN}╔══════════════════════════════════════════════════════════╗${NC}"
  echo -e "${GRN}║  ✅  Restore completed successfully!                     ║${NC}"
  echo -e "${GRN}║  All critical tables verified.                           ║${NC}"
  echo -e "${GRN}║  Backend can now start without schema errors.            ║${NC}"
  echo -e "${GRN}╚══════════════════════════════════════════════════════════╝${NC}"
else
  echo -e "${RED}╔══════════════════════════════════════════════════════════╗${NC}"
  echo -e "${RED}║  ⚠   Restore finished but some tables are MISSING.      ║${NC}"
  echo -e "${RED}║  Check the backup file and re-run if necessary.         ║${NC}"
  echo -e "${RED}╚══════════════════════════════════════════════════════════╝${NC}"
  exit 1
fi

echo ""
unset PGPASSWORD
