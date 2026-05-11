# Coolify Frontend Deployment

Deploy this React web frontend as its own Coolify service. Do not attach it to the backend container or PostgreSQL service.

## Service Settings

```txt
Build Pack: Nixpacks
Root Directory: frontend
Build Command: npm install && npm run build
Publish Directory: dist
Domain: https://digitalinvitationmanagementsystem.it.com
```

## Environment Variables

```env
VITE_API_BASE_URL=https://api.digitalinvitationmanagementsystem.it.com/api/v1
```

## DNS

```txt
A  @    SERVER_IP
A  api  SERVER_IP
```

## Safety Notes

- Do not recreate the backend service.
- Do not recreate PostgreSQL.
- Do not delete or reset Docker volumes.
- Keep the mobile app backend URL unchanged unless publishing a new APK.
- Backend CORS must allow `https://digitalinvitationmanagementsystem.it.com`.
