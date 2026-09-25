// Centralized WebRTC configuration. A TURN server can be added later purely
// through configuration - no code changes required elsewhere - by pushing
// additional entries into iceServers, e.g. from environment variables or a
// remote config endpoint.
//
// Typed loosely (rather than against react-native-webrtc's internal,
// unexported RTCConfiguration type) since that type isn't part of the
// package's public type exports.
interface IceServerConfig {
  urls: string;
  username?: string;
  credential?: string;
}

export const RTC_CONFIGURATION: { iceServers: IceServerConfig[]; iceCandidatePoolSize?: number } = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    // Example of where a TURN server would go once you have one:
    // {
    //   urls: "turn:your-turn-server.example.com:3478",
    //   username: process.env.EXPO_PUBLIC_TURN_USERNAME,
    //   credential: process.env.EXPO_PUBLIC_TURN_CREDENTIAL,
    // },
  ],
  iceCandidatePoolSize: 4,
};

export const MEDIA_CONSTRAINTS = {
  audio: true,
  video: {
    facingMode: "user",
    width: { ideal: 640 },
    height: { ideal: 480 },
    frameRate: { ideal: 24, max: 30 },
  },
};
