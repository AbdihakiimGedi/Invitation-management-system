# Production Database and API Debug Checklist

Base URL:

```text
http://kk0g84k04ow0cgs8owsckgwg.38.242.148.212.sslip.io
```

The backend mounts versioned routes under `/api/v1`, so API checks should use `/api/v1/...`.

## 1. Server Health

```http
GET /health
```

Expected: `200 OK` with `Digital Invitation System Backend is running.`

If this fails, inspect the backend container logs before testing the database.

## 2. Auth

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "username": "test@example.com",
  "password": "1234"
}
```

Expected: token, user, role, and redirect path.

If you only have an email, confirm whether that value is also stored in `users.username`; the login endpoint validates `username`, not `email`.

## 3. Users

```http
GET /api/v1/users
Authorization: Bearer {{token}}
```

Expected: users from the live PostgreSQL database.

If it returns old users, compare the response with the container query in step 8.

## 4. Events

```http
GET /api/v1/events
Authorization: Bearer {{token}}
```

Expected: current event list from PostgreSQL.

## 5. Participants

Use the actual routes exposed by this backend:

```http
GET /api/v1/participant-lists/events
GET /api/v1/participant-lists/events/{{event_id}}
GET /api/v1/participant-directories/types/graduate/events/{{event_id}}/participants
GET /api/v1/participant-directories/types/guest/events/{{event_id}}/participants
Authorization: Bearer {{token}}
```

Expected: participants assigned to the selected event.

## 6. Invitations

```http
GET /api/v1/invitations/management/events
GET /api/v1/invitations/management/events/{{event_id}}/sent-participants
GET /api/v1/invitations/batches/{{event_id}}
Authorization: Bearer {{token}}
```

Expected: invitation management records for the selected event.

## 7. Create Test Data

Create a small timestamped record, then immediately read it back.

```http
POST /api/v1/events
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "event_name": "DB Sync Test {{$timestamp}}",
  "description": "Temporary production sync verification",
  "event_date": "2026-06-01T09:00:00.000Z",
  "event_end_date": "2026-06-01T11:00:00.000Z",
  "location": "Postman",
  "status": "active",
  "max_capacity": 10
}
```

Then:

```http
GET /api/v1/events
Authorization: Bearer {{token}}
```

Expected: the new timestamped event appears.

## 8. PostgreSQL Container Cross-Check

Inside the production PostgreSQL container:

```bash
psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"
```

Run:

```sql
\dt
SELECT id, username, role, created_at FROM users ORDER BY created_at DESC LIMIT 20;
SELECT id, event_name, created_at, updated_at FROM events ORDER BY created_at DESC LIMIT 20;
SELECT eventparticipant_id, event_id, user_id, status FROM event_participants ORDER BY eventparticipant_id DESC LIMIT 20;
SELECT id, event_id, status, created_at FROM invitations ORDER BY created_at DESC LIMIT 20;
```

Expected: the rows returned by Postman match the rows in PostgreSQL.

If Postman shows data that is not in this container, the backend is connected to another database. Check `DATABASE_URL`, `DB_HOST`, `DB_USER`, `DB_NAME`, `PGHOST`, `PGUSER`, `PGDATABASE`, and `PGPASSWORD` in the backend container environment.

## 9. Persistence Test

1. Create the timestamped event in Postman.
2. Restart only the backend container.
3. Confirm the event still appears from `GET /api/v1/events`.
4. Restart the PostgreSQL container.
5. Confirm the event still appears in both Postman and `psql`.
6. Redeploy without deleting volumes.
7. Confirm the event still appears again.

If the row disappears after PostgreSQL restart or redeploy, the Postgres data volume is not persistent or Coolify recreated it.

## 10. Coolify/Docker Storage Check

Confirm the PostgreSQL service has persistent storage mounted to:

```text
/var/lib/postgresql
```

For this compose file, the named volume is stable:

```text
digital_invitation_postgres_data
```

Do not delete or recreate this volume during deployment. The bundled `dataabse.sql` only runs when PostgreSQL initializes an empty data directory; if the volume is lost, old dump data can be imported again and look like a rollback.

## 11. Frontend or Emulator Cache Check

If Postman and `psql` agree but the web or emulator still shows old data:

1. Confirm the built web app uses `VITE_API_BASE_URL={{base_url}}/api/v1`.
2. Confirm the mobile app was built with `EXPO_PUBLIC_API_BASE_URL={{base_url}}`.
3. Clear browser storage or mobile app storage.
4. Log out and log in again to refresh the token.
5. Retest the exact GET endpoint in Postman and compare the response with the app screen.
