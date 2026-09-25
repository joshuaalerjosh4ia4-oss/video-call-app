// Mirrors server/src/websocket/types.ts - kept in sync manually since the
// mobile app and server are separate npm packages in this MVP.

export interface RTCSessionDescriptionInit {
  type: "offer" | "answer" | "pranswer" | "rollback";
  sdp: string;
}

export interface RTCIceCandidateInit {
  candidate: string;
  sdpMid: string | null;
  sdpMLineIndex: number | null;
}

export interface RoomParticipant {
  userId: string;
  username: string;
}

export interface RoomCreateMessage {
  type: "room-create";
  roomId: string;
  passcode: string;
  startsAt: string;
  endsAt: string;
}
export interface RoomJoinMessage { type: "room-join"; roomId: string; passcode: string }
export interface RoomLeaveMessage { type: "room-leave"; roomId: string }
export interface RoomOfferMessage {
  type: "room-offer"; roomId: string; targetUserId: string; offer: RTCSessionDescriptionInit
}
export interface RoomAnswerMessage {
  type: "room-answer"; roomId: string; targetUserId: string; answer: RTCSessionDescriptionInit
}
export interface RoomIceCandidateMessage {
  type: "room-ice-candidate"; roomId: string; targetUserId: string; candidate: RTCIceCandidateInit
}
export interface RoomMediaStateMessage {
  type: "room-media-state"; roomId: string; microphoneEnabled: boolean; cameraEnabled: boolean
}
export interface RoomChatMessage {
  type: "room-chat"; roomId: string; text: string
}
export interface RoomReactionMessage {
  type: "room-reaction"; roomId: string; emoji: string
}

export type OutgoingSignal =
  | RoomCreateMessage
  | RoomJoinMessage
  | RoomLeaveMessage
  | RoomOfferMessage
  | RoomAnswerMessage
  | RoomIceCandidateMessage
  | RoomMediaStateMessage
  | RoomChatMessage
  | RoomReactionMessage;

export type IncomingSignal =
  | (RoomOfferMessage & { fromUserId: string; fromUsername: string })
  | (RoomAnswerMessage & { fromUserId: string })
  | (RoomIceCandidateMessage & { fromUserId: string })
  | (RoomMediaStateMessage & { fromUserId: string; fromUsername: string })
  | (RoomChatMessage & { fromUserId: string; fromUsername: string; sentAt: string })
  | (RoomReactionMessage & { fromUserId: string; fromUsername: string; sentAt: string })
  | { type: "room-created"; roomId: string; participants: RoomParticipant[]; participantCount: number }
  | { type: "room-joined"; roomId: string; participants: RoomParticipant[]; participantCount: number }
  | { type: "room-user-joined"; roomId: string; participant: RoomParticipant; participantCount: number }
  | { type: "room-user-left"; roomId: string; userId: string; participantCount: number }
  | { type: "user-online"; userId: string }
  | { type: "user-offline"; userId: string }
  | { type: "error"; message: string };
