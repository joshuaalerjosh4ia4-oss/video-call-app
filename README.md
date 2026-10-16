# MyClaSSes

MyClaSSes is a mobile app for course enrollment and scheduled video calls. It
includes a React Native client built with Expo and a TypeScript API server that
uses PostgreSQL. The server provides REST endpoints and WebSocket signaling for
WebRTC calls.

> The app's internal package and server names still use **SimpleCall** in a few
> places.

## Features

- Student, teacher, and administrator accounts, with registration, login,
  email verification, password recovery, and password changes.
- Course sections, subject schedules, student admissions, fee and payment
  status, and teacher assignments.
- Subject enrollment using join codes.
- Scheduled rooms and live audio/video calls using WebRTC.
- Call history, reminders, and account/profile screens.
- Role-aware administrative screens for admissions, teachers, and sections.

## Repository layout

```text
.
├── docker-compose.yml       # PostgreSQL service
├── mobile/                  # Expo React Native application
│   ├── App.tsx
│   └── src/
│       ├── api/              # REST API clients
│       ├── context/          # Authentication, room, and WebSocket state
│       ├── screens/
│       ├── services/         # WebSocket and reminders
│       └── webrtc/           # Peer connection configuration
└── server/                  # Express API and WebSocket signaling server
    ├── prisma/
    │   ├── schema.prisma
    │   └── migrations/
    └── src/
        ├── controllers/
        ├── routes/
        ├── services/
        └── websocket/
```

## Requirements

- Node.js 20 or newer and npm.
- Docker Desktop (or Docker Engine with the Compose plugin).
- Android Studio and an Android device/emulator for Android development.
- Xcode and a Mac for iOS native builds.

This app uses `react-native-webrtc` and an Expo development client. Use a
development build rather than expecting full calling functionality in Expo Go.

## Getting started

Run the database, backend, and mobile app in separate terminals.

### 1. Start PostgreSQL

From the repository root:

```sh
docker compose up -d postgres
```

Compose uses the defaults in `docker-compose.yml` unless overridden by a root
`.env` file: database `videocall_db`, user `videocall`, password
`videocall_password`, and port `5432`. These defaults are for local development,
not production. If you override them, use matching values in the server's
`DATABASE_URL`.

### 2. Configure and start the server

Create `server/.env` from `server/.env.example`. For example, in PowerShell:

```powershell
Copy-Item server/.env.example server/.env
```

Set the required `DATABASE_URL` and `JWT_SECRET` values in `server/.env`. With
the default Compose database, the URL is:

```text
DATABASE_URL="postgresql://videocall:videocall_password@localhost:5432/videocall_db?schema=public"
```

Replace the sample JWT secret with a long, random secret. Configure `SMTP_USER`,
`SMTP_PASSWORD`, and optionally `SMTP_FROM` with an SMTP account/app password
for email verification and password-recovery mail.

Install dependencies, generate the Prisma client, apply the checked-in
migrations, and start the development server:

```sh
cd server
npm ci
npm run prisma:generate
npm run prisma:deploy
npm run dev
```

The API listens on port `3000` by default. Check that it is responding at
`http://localhost:3000/health`.

### 3. Configure and start the mobile app

Create `mobile/.env` from `mobile/.env.example`:

```powershell
Copy-Item mobile/.env.example mobile/.env
```

Set `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_WS_URL` in `mobile/.env` to the
backend's address. For example:

```dotenv
EXPO_PUBLIC_API_URL=http://192.168.1.50:3000
EXPO_PUBLIC_WS_URL=ws://192.168.1.50:3000/ws
```

Replace `192.168.1.50` with the development computer's LAN IP address. A
physical phone cannot use `localhost` to reach a server on your computer; keep
the phone and computer on the same network and allow the backend port through
the computer's firewall.

Then install dependencies and build/run the native development client:

```sh
cd mobile
npm ci
npm run android
```

On macOS, use `npm run ios` for an iOS simulator/device. Once a development
client is installed, `npm start` starts Expo in development-client mode.

### WebRTC network note

The current WebRTC configuration includes public STUN servers but no TURN
server. Calls may fail on restrictive networks or when peers cannot establish
a direct connection. For reliable calls across different NATs/firewalls,
configure and operate a TURN service, then add its credentials to the
client's WebRTC ICE server configuration.

## Useful commands

### Server (`server/`)

| Command | Description |
| --- | --- |
| `npm run dev` | Run the server with file watching |
| `npm run build` | Compile TypeScript into `dist/` |
| `npm start` | Run the compiled server |
| `npm run lint` | Lint server TypeScript |
| `npm run prisma:generate` | Generate the Prisma client |
| `npm run prisma:migrate` | Create/apply a development migration |
| `npm run prisma:deploy` | Apply checked-in migrations |
| `npm run prisma:studio` | Open Prisma Studio |

### Mobile (`mobile/`)

| Command | Description |
| --- | --- |
| `npm start` | Start Expo for a development client |
| `npm run android` | Build/run on Android |
| `npm run ios` | Build/run on iOS (macOS required) |
| `npm run prebuild` | Generate native project files |
| `npm run lint` | Lint application TypeScript |
| `npm run typecheck` | Run the TypeScript type checker |

## API overview

The REST API is served under `/api`; health checks are at `/health`.

| Area | Base path | Examples |
| --- | --- | --- |
| Authentication | `/api/auth` | Register, login, verify email, profile, password flows |
| Users | `/api/users` | User and teacher records |
| Enrollments | `/api/enrollments` | Enrollments and subject participants |
| Admissions | `/api/admissions` | Sections, student applications, and admin actions |
| Rooms | `/api/rooms` | Scheduled rooms |

WebSocket signaling is available at `/ws` by default. The path can be changed
with the server's `WS_PATH` setting; keep the mobile `EXPO_PUBLIC_WS_URL` in
sync.

## Configuration reference

### Server (`server/.env`)

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `JWT_SECRET` | Yes | — | Secret used to sign authentication tokens |
| `PORT` | No | `3000` | HTTP and WebSocket server port |
| `CLIENT_ORIGIN` | No | `*` | Allowed CORS origin(s) |
| `WS_PATH` | No | `/ws` | WebSocket signaling path |
| `SMTP_USER` | No | — | SMTP account used for outgoing mail |
| `SMTP_PASSWORD` | No | — | SMTP account/app password |
| `SMTP_FROM` | No | `SMTP_USER` | Sender address for outgoing mail |

### Mobile (`mobile/.env`)

| Variable | Required | Purpose |
| --- | --- | --- |
| `EXPO_PUBLIC_API_URL` | Yes | Base URL for the REST API |
| `EXPO_PUBLIC_WS_URL` | Yes | WebSocket signaling URL |
| `EXPO_ROUTER_DISABLE_RN_NAVIGATION_CHECK` | No | Existing Expo navigation compatibility setting |

`EXPO_PUBLIC_*` values are embedded in the client bundle and are not secrets.
Never put private keys, passwords, or server credentials in the mobile
environment.

## Security and deployment

- Do not commit `server/.env`, `mobile/.env`, or any file containing credentials.
- Change the local database password and use strong secrets and managed
  infrastructure for any shared or production deployment.
- Restrict `CLIENT_ORIGIN` appropriately instead of using `*` in a deployed
  environment.
- Use HTTPS/WSS and secure production database/network configuration.
- Configure a TURN service if calls must work reliably on the public internet.
- The included Compose file starts PostgreSQL only; it does not containerize
  the API or mobile app.

## License

No license file is currently included. Unless a license is added, all rights
remain with the copyright holder.
