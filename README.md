# MyClaSSes

A minimal 1-to-1 video calling application built with React Native (Expo
Development Build) and a Node.js/Express/WebSocket signaling backend, using
**pure WebRTC** for peer-to-peer audio/video. No third-party video SDK
(Twilio, Agora, Daily, Stream, ZEGOCLOUD, Firebase, etc.) is used anywhere.

---

## 1. Project Overview

SimpleCall lets two registered users:

- Register and log in
- See a list of other registered users and whether they're online
- Start a 1-to-1 video call
- Receive, accept, or reject an incoming call
- Talk over a real WebRTC peer-to-peer connection (audio + video)
- Mute/unmute the microphone, enable/disable the camera, and switch between
  front and rear cameras during a call
- End the call
- View basic call history stored in PostgreSQL

Group calls are explicitly out of scope for this MVP.

---

## 2. Architecture

```
React Native A                                    React Native B
      |                                                  |
      |---------------- WebRTC (peer-to-peer) -----------|
      |                 audio + video only                |
      |                                                    |
      |            Express (REST) + WebSocket (ws)         |
      |                        |                            |
      |                        |                            |
      |                    PostgreSQL                       |
      |                  (via Prisma ORM)                   |
```

Responsibilities are strictly separated:

- **Express REST API** — authentication, user list, call history records.
- **WebSocket server (`ws`)** — online presence and WebRTC *signaling only*
  (SDP offers/answers, ICE candidates, reject/end/busy events). It never
  sees or forwards audio/video.
- **WebRTC (`react-native-webrtc`)** — the actual peer-to-peer audio/video
  transport, established directly between the two phones (via STUN, and a
  TURN server if you add one later).
- **PostgreSQL (via Prisma)** — persists users, call history, and room
  metadata (meeting ID, passcode, and creation time). Live membership,
  sockets, and WebRTC signaling remain in memory; no media of any kind is
  stored in the database.

---

## 3. Technology Stack & Selected Versions

Versions below were resolved against Expo SDK 57's own bundled compatibility
manifest (the same source `expo install` uses) so every native module is a
version Expo itself considers correct for this SDK — not just "whatever is
newest on npm today," which for a couple of packages (notably
`react-native-webrtc`'s config plugin) would actually be *too* new and
break `expo prebuild`.

| Layer | Technology | Version |
|---|---|---|
| Mobile runtime | Node.js | 20 LTS or newer (22 LTS recommended) |
| Mobile framework | Expo SDK | 57 |
| Mobile framework | React Native | 0.86.3 (bundled with Expo SDK 57) |
| Mobile framework | React | 19.2.3 |
| Mobile language | TypeScript | 5.7.x |
| Mobile styling | NativeWind (Tailwind CSS for React Native) | ^4.2.6 |
| Mobile styling | Tailwind CSS | ^3.4.19 |
| Mobile navigation | React Navigation | 7.x (native-stack) |
| Mobile WebRTC | react-native-webrtc | ^124.0.8 |
| Mobile WebRTC config plugin | @config-plugins/react-native-webrtc | ^15.0.2 (Expo 57 compatible) |
| Mobile dev client | expo-dev-client | ~57.0.19 |
| Mobile animations (NativeWind peer dep) | react-native-reanimated / react-native-worklets | 4.5.1 / 0.10.1 |
| Backend runtime | Node.js | 20 LTS or newer (22 LTS recommended) |
| Backend framework | Express | ^4.21.1 |
| Backend language | TypeScript | ^5.7.2 |
| Backend ORM | Prisma | ^6.1.0 |
| Backend WebSocket | ws | ^8.18.0 |
| Database | PostgreSQL | 16 (via Docker image `postgres:16-alpine`) |

If you upgrade any of these later, the safest approach is:

```bash
cd mobile
npx expo install expo@latest
npx expo install --fix   # realigns every other Expo/community package
```

`react-native-webrtc` and its config plugin track specific Expo SDK
versions independently, so after upgrading Expo, double check
`@config-plugins/react-native-webrtc`'s published `peerDependencies` still
match your new SDK before running `expo prebuild` again.

### Styling: NativeWind (Tailwind CSS)

All screens and components use [NativeWind](https://www.nativewind.dev/)
`className` props instead of `StyleSheet.create`. Key files:

- `tailwind.config.js` — the app's dark color palette (`app-bg`,
  `app-surface`, `app-primary`, `app-danger`, etc.), referenced everywhere
  as `bg-app-bg`, `text-app-text`, and so on instead of raw hex values.
- `global.css` — the three standard `@tailwind` directives, imported once
  in `App.tsx`.
- `babel.config.js` — adds the `nativewind/babel` preset and sets
  `jsxImportSource: "nativewind"` so `className` works on core RN
  components (`View`, `Text`, `TouchableOpacity`, `ScrollView`, etc.)
  without any wrapper components.
- `metro.config.js` — wraps Expo's default Metro config with
  `withNativeWind` so Tailwind classes are compiled from `global.css`.

`react-native-webrtc`'s `RTCView` is a native video surface rather than a
standard styleable RN primitive, so it keeps a small inline `style` prop
(just `flex`/`objectFit`) — NativeWind's `className` transform only applies
to components it has registered, and `RTCView` isn't one of them.



---

## 4. Requirements

- Node.js 20+ (22 LTS recommended) and npm
- Docker and Docker Compose (or a local PostgreSQL 16 install)
- For Android native builds: Android Studio + an Android SDK (works on
  Windows, macOS, or Linux)
- For iOS native builds: a Mac with Xcode (iOS development is **not**
  possible on Windows or Linux)
- A physical Android or iOS device, or an emulator/simulator, on the **same
  Wi-Fi network** as your development machine
- **Expo Go cannot be used** — `react-native-webrtc` requires native code,
  so you must build and run an Expo Development Build.

---

## 5. Installation (from an empty directory)

```bash
git clone <your-repo-url> video-call-app
cd video-call-app

# Backend dependencies
cd server
npm install
cd ..

# Mobile dependencies
cd mobile
npm install
cd ..
```

---

## 6. Database Setup

### 6.1 Start PostgreSQL with Docker

```bash
# from the project root
cp .env.example .env      # adjust POSTGRES_USER/PASSWORD/DB if you like
docker compose up -d
docker compose ps          # confirm the "postgres" service is healthy
```

To stop it later:

```bash
docker compose down
```

(Add `-v` to also delete the persisted database volume.)

### 6.2 Configure and run Prisma migrations

```bash
cd server
cp .env.example .env
```

Edit `server/.env` and make sure `DATABASE_URL` matches the credentials you
used for Docker, e.g.:

```
DATABASE_URL="postgresql://videocall:videocall_password@localhost:5432/videocall_db?schema=public"
JWT_SECRET="generate-a-long-random-string-here"
PORT=3000
CLIENT_ORIGIN="*"
WS_PATH="/ws"
```

Generate a strong `JWT_SECRET`, for example:

```bash
openssl rand -base64 48
```

Then create the database schema:

```bash
npx prisma migrate dev --name init
npx prisma generate
```

`prisma migrate dev` both creates the migration SQL (in
`server/prisma/migrations/`) and applies it to your running PostgreSQL
container. `prisma generate` produces the typed Prisma Client the backend
code imports from `@prisma/client`.

The repository includes a migration for the `rooms` table. Apply all
committed migrations on an existing database with:

```bash
npx prisma migrate deploy
```

Room records make meeting IDs survive WebSocket reconnects and server
restarts. The server still keeps only active room members and signaling
connections in memory.

You can inspect the database visually at any time with:

```bash
npx prisma studio
```

---

## 7. Backend Setup & Running

```bash
cd server
npm install          # if you haven't already
npm run dev          # starts the API + WebSocket server with hot reload
```

You should see:

```
SimpleCall server listening on http://0.0.0.0:3000
WebSocket signaling available at ws://0.0.0.0:3000/ws
```

For a production-style run:

```bash
npm run build
npm start
```

Health check: `GET http://localhost:3000/health` → `{"success":true,"data":{"status":"ok"}}`

---

## 8. Mobile Setup

### 8.1 Environment variables

```bash
cd mobile
cp .env.example .env
```

Find your computer's LAN IP address:

- **macOS**: `ipconfig getifaddr en0`
- **Linux**: `hostname -I`
- **Windows**: `ipconfig` (look for "IPv4 Address" under your active adapter)

Edit `mobile/.env`:

```
EXPO_PUBLIC_API_URL=http://192.168.1.100:3000
EXPO_PUBLIC_WS_URL=ws://192.168.1.100:3000/ws
```

**Never use `localhost` here when testing on a physical phone** — the
phone would try to connect to itself, not your computer. `localhost` only
happens to work from an **iOS Simulator** (it shares your Mac's network
stack). On an **Android emulator**, use `10.0.2.2` instead of `localhost`
to reach your host machine (e.g. `http://10.0.2.2:3000`). On a real device
(the common case for testing WebRTC), always use your computer's real LAN
IP, and make sure the phone and computer are on the same Wi-Fi network with
no client-isolation/firewall blocking port 3000 between them.

### 8.2 Install dependencies and generate native projects

```bash
npm install
npx expo prebuild
```

`expo prebuild` generates the native `android/` and `ios/` folders based on
`app.json`'s plugins (including the WebRTC config plugin), applying the
camera/microphone permission strings automatically.

### 8.3 Build and run

Android (Windows, macOS, or Linux with Android Studio installed):

```bash
npx expo run:android
```

iOS (macOS with Xcode only):

```bash
npx expo run:ios
```

Both commands compile a native Development Build and install it on your
connected device/emulator, then start Metro. On subsequent runs, once the
Development Build is installed, you can just run:

```bash
npx expo start --dev-client
```

and open the app already installed on your device — you only need to
`run:android` / `run:ios` again after changing native configuration (e.g.
`app.json` permissions or plugins).

> **Important:** any time you add a native module or change native
> configuration (permissions, plugins, `app.json` native fields), you must
> rebuild with `expo prebuild` + `expo run:android` / `expo run:ios` again.
> A plain Metro/JS reload is not enough for native changes to take effect.

---

## 9. WebRTC Signaling Flow

**Caller:**

1. Selects another (online) user on `HomeScreen` and taps **Call**.
2. App creates a `Call` record via `POST /api/calls` (status `RINGING`).
3. App acquires the local camera/microphone stream and creates an
   `RTCPeerConnection`.
4. App creates a WebRTC offer, sets it as the local description, and sends
   it to the receiver as a `call-offer` WebSocket message (which includes
   the SDP).
5. App exchanges ICE candidates with the receiver as they're discovered.
6. On receiving `call-answer`, sets the remote description and transitions
   to `CONNECTED` once media starts flowing.

**Receiver:**

1. Receives `call-offer` over the WebSocket; if already in a call, replies
   with `call-busy` instead of ringing.
2. Otherwise shows `IncomingCallScreen` with the caller's username.
3. On **Accept**: acquires local media, creates its own
   `RTCPeerConnection`, sets the caller's offer as the remote description,
   creates an answer, sets it as the local description, and sends
   `call-answer` back over the WebSocket. Updates the `Call` record to
   `ACCEPTED` via `PATCH /api/calls/:id`.
4. On **Reject**: sends `call-reject` and updates the `Call` record to
   `REJECTED`.
5. ICE candidates are exchanged continuously in both directions via
   `ice-candidate` messages.

**Ending a call (either side):**

1. Sends `call-end` to the other party.
2. Closes the `RTCPeerConnection` and stops all local media tracks.
3. Updates the `Call` record to `ENDED`.
4. Navigates back to `HomeScreen`.

The WebSocket server (`server/src/websocket/wsServer.ts`) does nothing more
than authenticate each connection with the user's JWT, track an in-memory
`userId -> WebSocket` map, and forward these messages to the correct
recipient — it never inspects or stores their contents.

---

## 10. Running Everything Together

1. `docker compose up -d` (from project root)
2. `cd server && npm run dev`
3. `cd mobile && npx expo start --dev-client` (after an initial
   `expo run:android` / `expo run:ios`)

---

## 11. Testing a Call Between Two Users

You'll need two devices (two physical phones, or one physical phone + one
emulator/simulator — real devices give a much more reliable WebRTC test).

1. On **Device A**, register as `alice@example.com` / `alice`.
2. On **Device B**, register as `bob@example.com` / `bob`.
3. Both should now see each other in the user list on `HomeScreen`, marked
   **Online** (this comes from the WebSocket presence system, not a
   database flag).
4. On Device A, tap **Call** next to Bob.
5. Device A shows `CallingScreen` with its own camera preview.
6. Device B shows `IncomingCallScreen` with "Incoming video call — alice".
7. On Device B, tap **Accept**.
8. Both devices should transition to `VideoCallScreen`, showing:
   - The other person's camera as the large remote view
   - Their own camera as a small floating preview
9. Test the controls on both devices:
   - **Mute** — the other party should stop hearing you
   - **Camera Off** — the other party should see your video freeze/stop
   - **Flip** — your own preview should switch between front/rear camera
10. On either device, tap **End** — both devices should return to
    `HomeScreen`.
11. Open **History** — the completed call should appear with status
    `ENDED` and a computed duration.

Also try:
- Calling a user who is offline (their **Call** button should be disabled).
- Rejecting an incoming call — the caller's screen should return to
  `HomeScreen` and history should show `REJECTED`.
- Calling a user while they're already in a call — they should not ring,
  and history should show `MISSED` on your side (call-busy).

---

## 12. Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| Black camera / no local video | Camera permission denied — check device Settings and that you rebuilt the app after adding `expo-camera`/webrtc plugins. |
| No microphone / other person can't hear you | Microphone permission denied, or you left **Mute** on. |
| Remote video never appears | Usually an ICE/NAT traversal failure. Confirm both devices have real internet access (not a captive portal Wi-Fi), and that STUN traffic (UDP) isn't blocked by a restrictive network/VPN. See "ICE failure" below. |
| WebSocket keeps disconnecting | Check `EXPO_PUBLIC_WS_URL` matches your computer's current LAN IP (it changes if you reconnect to Wi-Fi) and that `WS_PATH` matches on both client and server. |
| ICE connection failure / calls connect on same Wi-Fi but not otherwise | Public STUN alone cannot traverse all NAT types (especially symmetric NATs, common on cellular/corporate networks). You will need to add a TURN server — see `mobile/src/webrtc/config.ts`, which has a commented-out example of where to add one. |
| Android permissions not prompting | You likely ran `expo start` without a prior `expo prebuild` + `expo run:android`, so the native permission declarations were never compiled in. Re-run the full build. |
| iOS permissions not prompting | Same as above but for `expo run:ios`; also confirm `NSCameraUsageDescription` / `NSMicrophoneUsageDescription` are present in `app.json` (they are, by default, in this project). |
| Physical device can't reach the backend at all | Double-check `EXPO_PUBLIC_API_URL`/`EXPO_PUBLIC_WS_URL` don't say `localhost`, that the phone and computer are on the same Wi-Fi network (not a "guest" network with client isolation), and that your OS firewall allows inbound connections to port 3000. |
| `npx prisma generate` fails with a network/checksum error | Prisma needs to download a query-engine binary the first time; make sure your machine has outbound internet access (this is unrelated to your app's own networking). |

---

## 13. Production Considerations

This project is intentionally an MVP. Before shipping to real users,
consider:

- **TURN server** — public STUN alone will fail for a meaningful fraction
  of real-world networks (symmetric NAT, restrictive corporate/cellular
  networks). Deploy a TURN server (e.g. coturn) and add its credentials to
  `RTC_CONFIGURATION` in `mobile/src/webrtc/config.ts`.
- **HTTPS/WSS** — this project uses plain `http://`/`ws://` for local
  development. In production, terminate TLS (e.g. behind nginx or a load
  balancer) and use `https://`/`wss://` end to end; browsers and OSes
  increasingly require secure contexts for camera/microphone access.
- **JWT rotation/expiry** — tokens currently last 30 days with no refresh
  mechanism; add refresh tokens or shorter-lived access tokens for
  production.
- **Push notifications** — incoming calls only ring if the app is in the
  foreground with an open WebSocket. For real usage you'd add push
  notifications (e.g. via Expo push or native VoIP push) to wake the app
  when a call arrives while backgrounded/killed.
- **Rate limiting & abuse prevention** on the REST API and WebSocket
  connections.
- **Horizontal scaling** — the presence map in `websocket/presence.ts` is
  in-memory and per-process; a multi-instance deployment needs a shared
  store (e.g. Redis pub/sub) so signaling messages reach a user connected
  to a different server instance.
- **Automated tests** — this MVP has none; add unit tests for the call
  state machine and integration tests for the signaling flow before
  relying on this in production.

---

## 14. Project Structure

```
video-call-app/
├── mobile/                  Expo Development Build app (React Native + TypeScript)
│   ├── app/                 Reserved (this project uses React Navigation, not Expo Router)
│   ├── src/
│   │   ├── api/             REST client (auth, users, calls)
│   │   ├── components/      Reusable UI (video views, controls, list items, etc.)
│   │   ├── context/         AuthContext, WebSocketContext, CallContext
│   │   ├── hooks/           Thin convenience hooks over the contexts
│   │   ├── navigation/      React Navigation stack + a navigation ref
│   │   ├── screens/         The 8 required screens
│   │   ├── services/        WebSocketService (signaling transport)
│   │   ├── types/           Shared TS types (models, signaling messages)
│   │   ├── utils/           Secure token storage
│   │   └── webrtc/          WebRTCService + STUN/TURN configuration
│   ├── App.tsx
│   ├── app.json / eas.json
│   ├── babel.config.js / metro.config.js
│   ├── tailwind.config.js / global.css / nativewind-env.d.ts
│   └── package.json
│
├── server/                  Express + WebSocket + Prisma backend (TypeScript)
│   ├── prisma/schema.prisma
│   └── src/
│       ├── config/          Env loading, Prisma client singleton
│       ├── controllers/     Request handlers (thin, delegate to services)
│       ├── middleware/      JWT auth, Zod validation, error handling
│       ├── routes/          Express routers
│       ├── services/        Business logic (auth, users, calls)
│       ├── websocket/       Signaling server + in-memory presence map
│       ├── app.ts           Express app factory
│       └── server.ts        HTTP + WebSocket server entry point
│
├── docker-compose.yml        PostgreSQL 16 container
├── .env.example              Docker Compose variables
└── README.md
```
#   v i d e o - c a l l - a p p  
 