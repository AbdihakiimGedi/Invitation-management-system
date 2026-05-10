# Event Invitation & Attendance Management System

Production-ready event invitation, participant, seating, QR attendance, reporting, and portal system.

## Project Structure

- `backend/` - Node.js and Express API.
- `frontend/` - React web admin/client frontend.
- `app/` - React Native Expo mobile app.
- `docker-compose.yml` - Production Docker deployment.
- `docker-compose.dev.yml` - Local Docker development helper.
- `dataabse.sql` - Existing SQL dump export.

## Backend Setup

```bash
cd backend
npm install
cp .env.example .env
npm start
```

Required backend environment variables:

```env
HOST=0.0.0.0
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME="Digital Invitation & Attendance Management"
JWT_SECRET=replace_with_at_least_32_random_characters
JWT_EXPIRES_IN=8h
CORS_ORIGIN=http://localhost:5173
```

The backend must bind to `0.0.0.0` in Docker/Coolify so traffic can reach the container.

## Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Frontend environment:

```env
VITE_API_BASE_URL=http://localhost:5001/api/v1
```

## Mobile App Setup

```bash
cd app
npm install
cp .env.example .env
npm start
```

Mobile environment:

```env
EXPO_PUBLIC_API_BASE_URL=http://YOUR_LAN_OR_PRODUCTION_BACKEND:5001
```

For a real device, do not use `localhost`; use a LAN IP or production backend domain.

## Database Backup and Restore

The production SQL backup should be generated as:

```text
digital_invitation_backup.sql
```

### Export with pgAdmin

1. Open pgAdmin.
2. Right-click the database `Digital Invitation & Attendance Management`.
3. Choose `Backup...`.
4. Select format `Plain` for `.sql` restore portability, or `Custom` for `.backup`.
5. Enable schema and data export.
6. Include tables, constraints, indexes, triggers, functions, and data.
7. Save as `digital_invitation_backup.sql`.

### Restore Plain SQL

```bash
psql -h HOST -U USER -d "Digital Invitation & Attendance Management" -f digital_invitation_backup.sql
```

### Restore Custom Backup

```bash
pg_restore -h HOST -U USER -d "Digital Invitation & Attendance Management" --clean --if-exists backup_file.backup
```

## Docker Production Deployment

Copy `.env.example` to `.env` and set strong production values.

```bash
docker compose up -d --build
```

Default direct VPS ports:

- Frontend: `8080:80`
- Backend: `5001:5000`
- PostgreSQL: internal only

Port `5000` remains the backend container's internal port. The host uses `5001` by default to avoid conflicts with other live projects.

## Coolify Deployment

Recommended Coolify setup:

1. Connect the GitHub repository.
2. Use Docker Compose deployment.
3. Set environment variables from `.env.example`. Coolify will generate `SERVICE_BASE64_64_JWT_SECRET` from the compose file and pass it to the backend as `JWT_SECRET`.
4. Route frontend domain to the `frontend` service on port `80`.
5. Route backend/API domain to the `backend` service on port `5000`.
6. Set `CORS_ORIGIN` to the production frontend URL.
7. Set `VITE_API_BASE_URL` to `https://your-backend-domain/api/v1`.
8. Set `EXPO_PUBLIC_API_BASE_URL` to `https://your-backend-domain` before building the mobile app.

### HTTPS for Mobile APKs

Android production builds require a trusted HTTPS certificate. In Coolify, the backend domain must be configured with a real Let's Encrypt certificate, not Traefik's default certificate.

For the backend service:

1. Open the `backend` service in Coolify.
2. Set the public domain to `https://kk0g84k04ow0cgs8owsckgwg.38.242.148.212.sslip.io`.
3. Set the exposed service port to `5000`.
4. Enable automatic HTTPS / Let's Encrypt.
5. Enable HTTP to HTTPS redirect.
6. Redeploy the application.

After redeploy, `https://kk0g84k04ow0cgs8owsckgwg.38.242.148.212.sslip.io/health` must open with a trusted browser lock icon before rebuilding the APK.

## GitHub Hygiene

Do not commit:

- `.env` files.
- `node_modules`.
- `backend/uploads`.
- local database backups containing real data.
- temporary spreadsheets or generated office lock files.

Use `.env.example` files for deployment documentation.
