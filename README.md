# MyClaSSes

MyClaSSes is a React Native Expo application for scheduled classes and video
meetings. It includes student enrollment, admin-managed course sections,
PostgreSQL-backed admissions, WebRTC video calls, and weekly class reminders.

## Features

- Student registration and login with JWT authentication
- Email-based temporary password reset with required password change
- Student, teacher, and admin roles
- Course sections and subject enrollment
- Exact subject schedules: weekday, start time, and end time
- Local phone notifications 10 minutes before weekly classes
- Notifications can appear while the app is closed after permission is granted
- WebRTC audio and video rooms for up to 50 participants
- WebSocket signaling and online presence
- Microphone, camera, camera-switching, chat, reactions, and screen sharing
- PostgreSQL persistence through Prisma
- Light paper, plum, and clay visual theme matching the MyClaSSes logo

## Architecture

```
Expo React Native app
        | HTTPS / WSS
        v
Node.js + Express + WebSocket server
        |
        v
PostgreSQL via Prisma
```

WebRTC carries audio and video directly between participants. The server only
handles authentication, REST data, presence, room membership, and signaling.
Media is not stored in PostgreSQL. Rooms accept up to 50 participants, but the
current implementation uses peer-to-peer mesh WebRTC: each participant creates
a connection with every other participant. This makes small classes practical,
while larger classes may need an SFU/media server for reliable performance.

## Requirements

- Node.js 20 or newer
- npm
- Docker Desktop and Docker Compose, or PostgreSQL 16
- Android Studio and an Android SDK for Android builds
- macOS and Xcode for iOS builds
- A physical device or emulator

Expo Go is not supported because `react-native-webrtc` requires native code.
Use an Expo Development Build.

## Local Setup

Install backend dependencies:

```bash
cd server
npm install
```

Install mobile dependencies:

```bash
cd ../mobile
npm install
```

### PostgreSQL with Docker

From the project root:

```bash
docker compose up -d
docker compose ps
```

The database runs on `localhost:5432` and persists data in the
`postgres_data` volume. Stop it with:

```bash
docker compose down
```

Copy the example environment files:

```bash
copy .env.example .env
copy server\.env.example server\.env
copy mobile\.env.example mobile\.env
```

For macOS/Linux, use `cp` instead of `copy`.

Configure `server/.env`:
Email verification requires SMTP access. Add your provider's settings to
`server/.env` so the backend can send 6-digit codes:

```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-username
SMTP_PASSWORD=your-smtp-password
SMTP_FROM="MyClaSSes <no-reply@example.com>"
```

Use port `465` with `SMTP_SECURE=true` when required by your provider. New
accounts must verify the code sent to their email before they can sign in.

Render Free services block outbound SMTP. For Render Free, use Resend over
HTTPS instead by setting `RESEND_API_KEY` and `RESEND_FROM` on the web service.
Verify the sender domain with Resend before using it as `RESEND_FROM`. When
`RESEND_API_KEY` is present, it is used instead of SMTP.



Generate a strong secret with:

```bash
openssl rand -base64 64
```

Apply the Prisma migrations:

```bash
cd server
npx prisma migrate deploy
npx prisma generate
```

Run the backend:

```bash
npm run dev
```

The health endpoint is `http://localhost:3000/health`.

## Mobile Environment

Configure `mobile/.env` with a URL reachable from the phone:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.100:3000
EXPO_PUBLIC_WS_URL=ws://192.168.1.100:3000/ws
```

Do not use `localhost` on a physical phone. Use the computer's LAN IP and
ensure both devices are on the same network.

Build the development app:

```bash
cd mobile
npx expo prebuild
npx expo run:android
```

For iOS, use `npx expo run:ios` on macOS with Xcode.

After native dependencies or `app.json` plugins change, rebuild the native
app. A Metro reload alone is not enough.

## Subject Schedules and Reminders

Administrators define subjects with this format:

```text
CODE|DAY|START|END
```

Example:

```text
MATH|Mon|08:00|10:00, ENG|Wed|10:00|12:00
```

Days are `Mon`, `Tue`, `Wed`, `Thu`, `Fri`, `Sat`, or `Sun`. Times use 24-hour
`HH:mm` format. The mobile app requests notification permission and schedules
weekly local notifications 10 minutes before each subject. The student must
open the app and grant permission at least once so reminders can be registered.

## Security

The backend includes:

- Helmet security headers
- Zod request validation
- bcrypt password hashing
- JWT authentication with 7-day expiry
- Authentication rate limiting
- General API rate limiting
- 32 KB JSON request limit
- WebSocket payload and message-rate limits
- Room, passcode, chat, and reaction length limits

For production, also use HTTPS/WSS, a managed PostgreSQL database, a strong
production-only `JWT_SECRET`, a WAF/CDN such as Cloudflare, and a TURN server
for WebRTC reliability. Never commit `.env` files or production credentials.

## Production Deployment

Recommended architecture:

```text
Expo mobile build
        |
        v
Render Node.js Web Service
        |
        v
Render PostgreSQL
```

Deploy the `server` directory to Render with:

```bash
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
```

Start command:

```bash
npm start
```

Set these Render environment variables:

```env
DATABASE_URL=your-render-postgresql-url
JWT_SECRET=your-production-secret
PORT=10000
CLIENT_ORIGIN=your-allowed-origin
WS_PATH=/ws
```

Update `mobile/.env` before building:

```env
EXPO_PUBLIC_API_URL=https://your-service.onrender.com
EXPO_PUBLIC_WS_URL=wss://your-service.onrender.com/ws
```

Build the Android app with EAS:

```bash
cd mobile
npx eas login
npx eas init
npx eas build --platform android --profile preview
```

Use the `production` profile for a Google Play `.aab` build. iOS distribution
requires an Apple Developer account.

## Useful Commands

```bash
# Mobile
cd mobile
npm run typecheck
npm run lint

# Server
cd server
npm run build
npm run lint
npx prisma studio
```

## Project Structure

```text
mobile/   Expo React Native client
server/   Express, WebSocket, Prisma, and PostgreSQL backend
docker-compose.yml  Local PostgreSQL service
```
