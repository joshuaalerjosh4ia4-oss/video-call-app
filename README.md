# MyClaSSes

MyClaSSes is a role-based learning and live classroom app. It includes an Expo
React Native mobile client and a TypeScript API server backed by PostgreSQL.
The server provides REST endpoints and WebSocket signaling for WebRTC calls.
Some internal package and project names still use **SimpleCall**.

## Features

- Student, teacher, and administrator accounts
- Admissions, subject enrollment, schedules, and teacher assignments
- Administrative workflows for sections, admissions, and payment status
- Scheduled classrooms with live audio and video calls
- Email verification, password recovery, account management, and call history

## Repository layout

```text
.
├── docker-compose.yml       # Local PostgreSQL service
├── mobile/                  # Expo React Native app
│   └── src/
│       ├── api/
│       ├── components/
│       ├── context/
│       ├── screens/
│       ├── services/
│       └── webrtc/
└── server/                  # Express API and WebSocket server
    ├── prisma/               # Prisma schema and migrations
    └── src/
        ├── controllers/
        ├── routes/
        ├── services/
        └── websocket/
```

## Requirements

- Node.js 20 or newer and npm
- Docker Desktop or Docker Engine with the Compose plugin
- Android Studio and an Android device/emulator for Android development
- A Mac with Xcode for iOS native builds

The app uses `react-native-webrtc` and an Expo development client; Expo Go alone
does not provide the native calling functionality.

## Local setup

Run PostgreSQL, the server, and the mobile app in separate terminals.

### 1. Start PostgreSQL

Create a `.env` file in the repository root:

```dotenv
POSTGRES_USER=database-user
POSTGRES_PASSWORD=replace-with-a-strong-password
POSTGRES_DB=database_db
POSTGRES_PORT=PORT //3233
```

Start the database from the repository root:

```sh
docker compose up -d postgres
```

The database port is bound to localhost. Compose requires `POSTGRES_PASSWORD`;
the other values above are its defaults. The `postgres_data` volume retains the
password used when the database was first initialized.

### 2. Configure and start the server

Create `server/.env` with the database connection details and other required
server settings:

```dotenv
DATABASE_URL="database_url"
JWT_SECRET="generate-jwt"
```

Use the same database credentials as the root `.env` file and URL-encode
special characters in the database password. Set all required server
environment values in this file. For email verification and password recovery,
optionally configure SMTP:

```dotenv
SMTP_USER="your-smtp-user"
SMTP_PASSWORD="your-smtp-app-password"
SMTP_FROM="noreply@example.com"
```

Install dependencies, generate the Prisma client, apply migrations, and start
the development server:

```sh
cd server
npm ci
npm run prisma:generate
npm run prisma:deploy
npm run dev
```

The API listens on port `3000` by default. Check
`http://localhost:3000/health` to verify it is responding.

### 3. Configure and start the mobile app

Create `mobile/.env` and set the API and WebSocket URLs. Replace the sample IP
with the development computer's LAN IP address:

```dotenv
EXPO_PUBLIC_API_URL=http://IPADDRESS:PORT
EXPO_PUBLIC_WS_URL=ws://IPADDRESS:PORT/ws
```

A physical phone cannot use `localhost` to reach a server on your computer.
Keep the phone and computer on the same network and allow the server port
through the computer's firewall.

Install dependencies and build/run the native development client:

```sh
cd mobile
npm ci
npm run android
```

On macOS, use `npm run ios` for an iOS simulator or device. Once the development
client is installed, `npm start` starts Expo in development-client mode.

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
| `npm start` | Start Expo in development-client mode |
| `npm run android` | Build/run on Android |
| `npm run ios` | Build/run on iOS (macOS required) |
| `npm run prebuild` | Generate native project files |
| `npm run lint` | Lint application TypeScript |
| `npm run typecheck` | Run the TypeScript type checker |

## API and signaling

The REST API is served under `/api`; health checks are at `/health`.

| Area | Base path | Purpose |
| --- | --- | --- |
| Authentication | `/api/auth` | Registration, login, verification, and password flows |
| Users | `/api/users` | User and teacher records |
| Admissions | `/api/admissions` | Sections, applications, and administrative actions |
| Enrollments | `/api/enrollments` | Enrollments and subject participation |
| Rooms | `/api/rooms` | Scheduled classroom sessions |

WebSocket signaling is available at `/ws` by default. The path can be changed
with the server's `WS_PATH` setting; keep `EXPO_PUBLIC_WS_URL` in sync.

## Environment variables

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `PORT` | No | `3000` | HTTP and WebSocket server port |
| `CLIENT_ORIGIN` | No | `*` | Allowed CORS origin(s) |
| `WS_PATH` | No | `/ws` | WebSocket signaling path |
| `SMTP_USER` | No | — | SMTP account used for outgoing mail |
| `SMTP_PASSWORD` | No | — | SMTP account/app password |
| `SMTP_FROM` | No | `SMTP_USER` | Sender address for outgoing mail |
| `EXPO_PUBLIC_API_URL` | Yes | — | Mobile app's REST API base URL |
| `EXPO_PUBLIC_WS_URL` | Yes | — | Mobile app's WebSocket URL |

`EXPO_PUBLIC_*` values are embedded in the mobile client bundle. Do not put
passwords, private keys, or other secrets in them.

## Deployment notes

- Use strong secrets and restrict `CLIENT_ORIGIN` in deployed environments.
- Use HTTPS/WSS and secure database/network configuration in production.
- The current WebRTC configuration includes public STUN servers but no TURN
  service. Calls may fail on restrictive networks; configure a TURN relay for
  reliable connections across NATs and firewalls.
- Docker Compose starts PostgreSQL only; it does not containerize the API or
  mobile app.

## License

No license file is currently included. All rights remain with the copyright
holder unless a license is added.
