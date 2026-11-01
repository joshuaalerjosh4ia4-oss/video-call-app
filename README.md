<<<<<<< HEAD
﻿# MyClaSSes

MyClaSSes is a role-based learning and live classroom platform built around a React Native mobile client and a TypeScript API server backed by PostgreSQL. It supports student enrollment, subject scheduling, live classroom rooms, and role-aware admin and teacher workflows.

> The project still uses the older internal naming from SimpleCall in a few package and code references, but the current product experience is centered on MyClaSSes.

## Overview

This repository brings together the core product stack for a school or training environment:

- Student-facing mobile app for registration, admissions, enrollment, and classroom participation
- Teacher portal flow for managing assigned subjects and creating scheduled class rooms
- Admin VCA workflow for section creation, teacher assignment, admissions management, and fee status tracking
- API and WebSocket backend for authentication, enrollment, scheduling, and live WebRTC signaling

The app is designed for a campus-style learning environment where administrators create course sections, teachers host classes, and students join scheduled learning rooms.

## Product modules

### Student mobile experience

The mobile app lets learners:

- Register and sign in with role-based accounts
- Reset or change their password
- Submit or review admissions for course sections
- Select subject schedules and enroll through the academic flow
- Join scheduled class rooms during active windows
- View room history and account details

### Admin VCA

The admin VCA workflow is the operational control layer for academic setup and student management. In this codebase, the admin experience is represented by the admin screens for admissions, section creation, section assignments, and teacher management. Admin responsibilities include:

- Creating course sections and subjects
- Assigning teachers to sections
- Reviewing applications and admission records
- Updating payment status and finalizing admissions
- Managing section-specific academic setup

This is the operational backbone for the institution's scheduling and enrollment workflow.

### Teacher portal

The teacher portal is the teaching-side workspace for instructors. It supports:

- Viewing the subjects and sections assigned to the teacher
- Scheduling one-time class rooms for a subject
- Creating room sessions for enrolled students
- Joining a class room at the scheduled time
- Running a live classroom session over WebRTC audio/video

This role is built around the teacher screens and room scheduling flows in the mobile client.

## Architecture

```text
.
├── docker-compose.yml         # Local PostgreSQL database
├── mobile/                    # Expo React Native client
│   ├── App.tsx
│   ├── app.json
│   ├── package.json
│   └── src/
│       ├── api/               # REST API clients for auth, users, rooms, admissions
│       ├── components/        # Shared UI components
│       ├── context/           # Auth, room, and socket state
│       ├── hooks/
│       ├── navigation/        # App screens and route setup
│       ├── screens/           # Student, admin, teacher, and room screens
│       ├── services/          # Background/reminder support
│       ├── types/
│       ├── utils/
│       └── webrtc/            # WebRTC config and signaling helpers
├── server/                    # Express API + Prisma + WebSocket server
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   └── src/
│       ├── app.ts
│       ├── server.ts
│       ├── config/
│       ├── controllers/
│       ├── middleware/
│       ├── prisma/
│       ├── routes/
│       ├── services/
│       ├── types/
│       ├── utils/
│       └── websocket/
└── README.md
```

## Key features

- Role-based authentication and profile management
- Student admissions and subject enrollment flows
- Course section and subject creation
- Teacher assignment management
- Room scheduling and class join workflows
- Real-time video/audio calls using WebRTC
- WebSocket-based signaling and room coordination
- Email verification and password recovery flows
- Ledger and fee/payment status tracking
- Call history and reminder support

## Technology stack

- React Native + Expo for the mobile app
- TypeScript for both the client and server
- Express.js for the REST API
- PostgreSQL for persistent data storage
- Prisma ORM for schema management and database access
- WebSockets for real-time signaling
- WebRTC for live video meetings
- Docker Compose for local database startup

## Requirements

Before running the project locally, install:

- Node.js 20 or newer
- npm
- Docker Desktop or Docker Engine with the Compose plugin
- Android Studio and an Android emulator/device for Android testing
- Xcode and a Mac for iOS development builds

The mobile app uses `react-native-webrtc` with an Expo development client, so a standard Expo Go session is not sufficient for full calling functionality.

## Local setup

Run the database, API, and mobile app in separate terminals.

### 1. Start PostgreSQL

Create a `.env` file in the repository root (it is ignored by Git) with a unique, strong database password:

```dotenv
POSTGRES_USER=videocall
POSTGRES_PASSWORD=replace-with-a-unique-strong-password
POSTGRES_DB=videocall_db
POSTGRES_PORT=5432
```

The database port is bound to localhost only. Keep these values consistent with the server's `DATABASE_URL`, URL-encoding special characters in the password. From the repository root, start PostgreSQL:

```bash
docker compose up -d postgres
```

An existing `postgres_data` volume retains the password it was initialized with. For an existing database, set `POSTGRES_PASSWORD` to that password or update the database role deliberately; do not remove the volume to change credentials.

### 2. Configure and start the backend

Create a `server/.env` file in the server folder (or copy the local example if one is provided in your environment). Configure at least:

Set `DATABASE_URL` to use the same credentials as the root `.env` file, for example `postgresql://videocall:<password>@localhost:5432/videocall_db?schema=public`.

```dotenv
DATABASE_URL="postgresql://videocall:videocall_password@localhost:5432/videocall_db?schema=public"
JWT_SECRET="replace-with-a-long-random-secret"
```

Optional mail settings for verification and recovery email flows:

```dotenv
SMTP_USER="your-smtp-user"
SMTP_PASSWORD="your-smtp-app-password"
SMTP_FROM="noreply@example.com"
```

Then install dependencies and start the server:

```bash
cd server
npm install
npx prisma generate
npx prisma migrate deploy
npm run dev
```

The API runs on port `3000` by default. Confirm it is responding at:

```text
http://localhost:3000/health
```

### 3. Configure and start the mobile app

Create a `mobile/.env` file and set the API and WebSocket endpoints:
=======
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
>>>>>>> origin/main

```dotenv
EXPO_PUBLIC_API_URL=http://192.168.1.50:3000
EXPO_PUBLIC_WS_URL=ws://192.168.1.50:3000/ws
```

<<<<<<< HEAD
Use your local machine's LAN IP address instead of `localhost` when testing on a physical phone. The mobile device and the backend must be on the same network, and the backend port may need to be opened in the firewall.

Then install and run the app:

```bash
cd mobile
npm install
npm run android
```

On macOS, use:

```bash
npm run ios
```

After the native development client is installed, `npm start` can also be used for Expo in development-client mode.
=======
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
>>>>>>> origin/main

## Useful commands

### Server (`server/`)

| Command | Description |
| --- | --- |
<<<<<<< HEAD
| `npm run dev` | Run the backend with file watching |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Start the compiled server |
| `npm run lint` | Lint server TypeScript |
| `npm run prisma:generate` | Generate the Prisma client |
| `npm run prisma:migrate` | Create or apply a development migration |
=======
| `npm run dev` | Run the server with file watching |
| `npm run build` | Compile TypeScript into `dist/` |
| `npm start` | Run the compiled server |
| `npm run lint` | Lint server TypeScript |
| `npm run prisma:generate` | Generate the Prisma client |
| `npm run prisma:migrate` | Create/apply a development migration |
>>>>>>> origin/main
| `npm run prisma:deploy` | Apply checked-in migrations |
| `npm run prisma:studio` | Open Prisma Studio |

### Mobile (`mobile/`)

| Command | Description |
| --- | --- |
<<<<<<< HEAD
| `npm start` | Start Expo in development-client mode |
| `npm run android` | Run the app on Android |
| `npm run ios` | Run the app on iOS (macOS only) |
| `npm run prebuild` | Generate native project files |
| `npm run lint` | Lint application TypeScript |
| `npm run typecheck` | Run the TypeScript checker |

## API and signaling overview

The server exposes the REST API under `/api` and health checks at `/health`.

| Area | Base path | Purpose |
| --- | --- | --- |
| Authentication | `/api/auth` | Login, registration, password reset, profile access |
| Users | `/api/users` | Teacher and user management |
| Admissions | `/api/admissions` | Sections, admissions, payment state, admin actions |
| Enrollments | `/api/enrollments` | Enrollment and class-related records |
| Rooms | `/api/rooms` | Scheduled room management |

WebSocket signaling is served at `/ws` by default. The path is configurable via the server's `WS_PATH` setting, and the mobile client must keep `EXPO_PUBLIC_WS_URL` in sync with it.

## Environment reference

### Server variables
=======
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
>>>>>>> origin/main

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
<<<<<<< HEAD
| `JWT_SECRET` | Yes | — | Secret used to sign auth tokens |
| `PORT` | No | `3000` | HTTP and WebSocket server port |
| `CLIENT_ORIGIN` | No | `*` | Allowed CORS origin(s) |
| `WS_PATH` | No | `/ws` | WebSocket signaling path |
| `SMTP_USER` | No | — | SMTP username for outgoing mail |
| `SMTP_PASSWORD` | No | — | SMTP app password |
| `SMTP_FROM` | No | `SMTP_USER` | Sending email address |

### Mobile variables
=======
| `JWT_SECRET` | Yes | — | Secret used to sign authentication tokens |
| `PORT` | No | `3000` | HTTP and WebSocket server port |
| `CLIENT_ORIGIN` | No | `*` | Allowed CORS origin(s) |
| `WS_PATH` | No | `/ws` | WebSocket signaling path |
| `SMTP_USER` | No | — | SMTP account used for outgoing mail |
| `SMTP_PASSWORD` | No | — | SMTP account/app password |
| `SMTP_FROM` | No | `SMTP_USER` | Sender address for outgoing mail |

### Mobile (`mobile/.env`)
>>>>>>> origin/main

| Variable | Required | Purpose |
| --- | --- | --- |
| `EXPO_PUBLIC_API_URL` | Yes | Base URL for the REST API |
<<<<<<< HEAD
| `EXPO_PUBLIC_WS_URL` | Yes | WebSocket signaling endpoint |

`EXPO_PUBLIC_*` values are bundled into the client and should not be treated as secrets.

## Role flow summary

### Administrator flow

1. Create course sections and subjects
2. Assign teachers to each section
3. Review pending admissions
4. Finalize payment and enrollment status
5. Manage academic setup and classroom access

### Teacher flow

1. Log in with a teacher account
2. Open assigned subjects and sections
3. Schedule a class room for a subject
4. Invite students to the room session
5. Join the live WebRTC room when it opens

### Student flow

1. Register and verify access
2. Submit admission for a section
3. Select subject schedule and confirm enrollment
4. Join the scheduled room when the course is active
5. Participate in the live class session

## WebRTC and networking notes

The current WebRTC setup includes public STUN servers but no TURN service. In restricted or NAT-heavy network conditions, direct peer-to-peer calling may fail. For production or public deployment, use a TURN relay service and add the credentials to the client configuration to improve call reliability.

## Security and deployment

- Do not commit `server/.env`, `mobile/.env`, or any credential-bearing file
- Use strong secrets and managed infrastructure in shared or production environments
- Restrict `CLIENT_ORIGIN` instead of leaving it wide open in production
- Use HTTPS/WSS for deployed traffic
- Keep the database, API, and signaling services secured behind proper network controls
- Use a TURN service if video calls must succeed reliably over the public internet

## License

There is currently no license file in the repository. Unless a license is added, all rights remain with the copyright holder.
#   v i d e o - c a l l - a p p s  
 
=======
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
>>>>>>> origin/main
