import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { MediaStream, mediaDevices } from "react-native-webrtc";
import { useWebSocketContext } from "./WebSocketContext";
import { RoomParticipant, IncomingSignal } from "../types/signaling";
import { WebRTCService } from "../webrtc/WebRTCService";
import { saveMeetingRecord } from "../utils/storage";
import { useAuthContext } from "./AuthContext";

interface RoomPeer {
  participant: RoomParticipant;
  webrtc: WebRTCService;
}

interface RoomContextValue {
  roomId: string | null;
  participants: RoomParticipant[];
  participantCount: number;
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  error: string | null;
  createRoom: (startsAt: string, endsAt: string) => { roomId: string; passcode: string };
  joinRoom: (roomId: string, passcode: string) => void;
  leaveRoom: () => void;
  clearError: () => void;
  microphoneEnabled: boolean;
  cameraEnabled: boolean;
  remoteMediaStates: Map<string, { microphoneEnabled: boolean; cameraEnabled: boolean }>;
  toggleMicrophone: () => void;
  toggleCamera: () => void;
  messages: Array<{ id: string; username: string; text: string }>;
  sendChat: (text: string) => void;
  sendReaction: (emoji: string) => void;
  screenSharing: boolean;
  toggleScreenSharing: () => Promise<void>;
}

const RoomContext = createContext<RoomContextValue | undefined>(undefined);

function makeRoomId(): string {
  return String(Math.floor(100000000 + Math.random() * 900000000));
}

function makePasscode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function RoomProvider({ children }: { children: React.ReactNode }) {
  const { service } = useWebSocketContext();
  const { user } = useAuthContext();
  const [roomId, setRoomId] = useState<string | null>(null);
  const [participants, setParticipants] = useState<RoomParticipant[]>([]);
  const [participantCount, setParticipantCount] = useState(0);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const [microphoneEnabled, setMicrophoneEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [remoteMediaStates, setRemoteMediaStates] = useState(
    new Map<string, { microphoneEnabled: boolean; cameraEnabled: boolean }>()
  );
  const [messages, setMessages] = useState<Array<{ id: string; username: string; text: string }>>([]);
  const [screenSharing, setScreenSharing] = useState(false);
  const peers = useRef(new Map<string, RoomPeer>());
  const localStreamRef = useRef<MediaStream | null>(null);
  const localStreamRequestRef = useRef<Promise<MediaStream> | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const roomRef = useRef(roomId);
  roomRef.current = roomId;

  const closePeers = useCallback(() => {
    peers.current.forEach(({ webrtc }) => webrtc.close());
    peers.current.clear();
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    screenStreamRef.current = null;
    cameraStreamRef.current = null;
    setLocalStream(null);
    localStreamRef.current = null;
    setRemoteStreams(new Map());
    setParticipants([]);
    setParticipantCount(0);
    setRemoteMediaStates(new Map());
    setMessages([]);
    setMicrophoneEnabled(true);
    setCameraEnabled(true);
    setScreenSharing(false);
  }, []);

  const createPeer = useCallback(
    async (participant: RoomParticipant, shouldOffer: boolean) => {
      if (!roomRef.current || peers.current.has(participant.userId)) return;
      const webrtc = new WebRTCService();
      peers.current.set(participant.userId, { participant, webrtc });
      if (localStreamRef.current) webrtc.useLocalStream(localStreamRef.current);
      webrtc.setOnRemoteTrack((stream) => {
        setRemoteStreams((current) => new Map(current).set(participant.userId, stream));
      });
      webrtc.setOnIceCandidate((candidate) => {
        if (roomRef.current) {
          service.send({
            type: "room-ice-candidate",
            roomId: roomRef.current,
            targetUserId: participant.userId,
            candidate,
          });
        }
      });
      webrtc.createPeerConnection();
      if (shouldOffer) {
        const offer = await webrtc.createOffer();
        service.send({ type: "room-offer", roomId: roomRef.current, targetUserId: participant.userId, offer });
      }
    },
    [service]
  );

  const prepareLocalStream = useCallback(async () => {
    if (localStreamRef.current) return localStreamRef.current;
    if (localStreamRequestRef.current) return localStreamRequestRef.current;

    const request = new WebRTCService()
      .acquireLocalStream()
      .then((stream) => {
        localStreamRef.current = stream;
        cameraStreamRef.current = stream;
        setLocalStream(stream);
        return stream;
      })
      .finally(() => {
        localStreamRequestRef.current = null;
      });
    localStreamRequestRef.current = request;
    return request;
  }, []);

  const createRoom = useCallback((startsAt: string, endsAt: string) => {
    const id = makeRoomId();
    const code = makePasscode();
    closePeers();
    setRoomId(id);
    roomRef.current = id;
    service.send({ type: "room-create", roomId: id, passcode: code, startsAt, endsAt });
    void prepareLocalStream().catch(() => setError("Camera and microphone access is required to join a room."));
    void saveMeetingRecord({
      id: `${id}-${Date.now()}`,
      roomId: id,
      type: "created",
      createdAt: new Date().toISOString(),
    });
    return { roomId: id, passcode: code };
  }, [closePeers, prepareLocalStream, service]);

  const joinRoom = useCallback(
    (id: string, code: string) => {
      const normalized = id.trim().toUpperCase();
      if (!normalized || !code.trim()) {
        setError("Enter a meeting ID and passcode to join.");
        return;
      }
      closePeers();
      setRoomId(normalized);
      roomRef.current = normalized;
      service.send({ type: "room-join", roomId: normalized, passcode: code.trim() });
      void prepareLocalStream().catch(() => setError("Camera and microphone access is required to join a room."));
      void saveMeetingRecord({
        id: `${normalized}-${Date.now()}`,
        roomId: normalized,
        type: "joined",
        createdAt: new Date().toISOString(),
      });
    },
    [closePeers, prepareLocalStream, service]
  );

  const leaveRoom = useCallback(() => {
    if (roomRef.current) service.send({ type: "room-leave", roomId: roomRef.current });
    closePeers();
    setRoomId(null);
    roomRef.current = null;
  }, [closePeers, service]);

  const toggleMicrophone = useCallback(() => {
    const next = !microphoneEnabled;
    localStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = next;
    });
    setMicrophoneEnabled(next);
    if (roomRef.current) {
      service.send({ type: "room-media-state", roomId: roomRef.current, microphoneEnabled: next, cameraEnabled });
    }
  }, [cameraEnabled, microphoneEnabled, service]);

  const toggleCamera = useCallback(() => {
    const next = !cameraEnabled;
    localStreamRef.current?.getVideoTracks().forEach((track) => {
      track.enabled = next;
    });
    setCameraEnabled(next);
    if (roomRef.current) {
      service.send({ type: "room-media-state", roomId: roomRef.current, microphoneEnabled, cameraEnabled: next });
    }
  }, [cameraEnabled, microphoneEnabled, service]);

  const sendChat = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (trimmed && roomRef.current) {
        service.send({ type: "room-chat", roomId: roomRef.current, text: trimmed });
        setMessages((current) => [...current.slice(-99), { id: `${Date.now()}-local`, username: user?.username ?? "You", text: trimmed }]);
      }
    },
    [service, user?.username]
  );

  const sendReaction = useCallback(
    (emoji: string) => {
      if (roomRef.current) {
        service.send({ type: "room-reaction", roomId: roomRef.current, emoji });
        setMessages((current) => [
          ...current.slice(-99),
          { id: `${Date.now()}-local`, username: user?.username ?? "You", text: `${emoji} reacted` },
        ]);
      }
    },
    [service, user?.username]
  );

  const toggleScreenSharing = useCallback(async () => {
    if (screenSharing) {
      screenStreamRef.current?.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
      const cameraStream = cameraStreamRef.current;
      if (!cameraStream) return;
      localStreamRef.current = cameraStream;
      setLocalStream(cameraStream);
      peers.current.forEach(({ webrtc }) => {
        const [track] = cameraStream.getVideoTracks();
        if (track) webrtc.replaceVideoTrack(track);
      });
      setScreenSharing(false);
      return;
    }

    let screenStream: MediaStream;
    try {
      screenStream = await mediaDevices.getDisplayMedia({});
    } catch {
      setError("Screen sharing was cancelled or is unavailable on this device.");
      return;
    }
    const [track] = screenStream.getVideoTracks();
    if (!track) return;
    screenStreamRef.current = screenStream;
    localStreamRef.current = screenStream;
    setLocalStream(screenStream);
    peers.current.forEach(({ webrtc }) => webrtc.replaceVideoTrack(track));
    setScreenSharing(true);
    track.onended = () => {
      void toggleScreenSharing();
    };
  }, [screenSharing]);

  useEffect(() => {
    const unsubscribe = service.onMessage((message: IncomingSignal) => {
      if (message.type === "error") {
        setError(message.message);
        return;
      }
      if (message.type === "room-created" || message.type === "room-joined") {
        if (message.roomId !== roomRef.current) return;
        setParticipantCount(message.participantCount);
        prepareLocalStream()
          .then(() => {
            setParticipants(message.participants);
            message.participants.forEach((participant) => {
              void createPeer(participant, true);
            });
          })
          .catch(() => setError("Camera and microphone access is required to join a room."));
        return;
      }
      if (message.type === "room-user-joined") {
        if (message.roomId !== roomRef.current) return;
        setParticipants((current) => [...current.filter((p) => p.userId !== message.participant.userId), message.participant]);
        setParticipantCount(message.participantCount);
        return;
      }
      if (message.type === "room-user-left") {
        if (message.roomId !== roomRef.current) return;
        peers.current.get(message.userId)?.webrtc.close();
        peers.current.delete(message.userId);
        setParticipants((current) => current.filter((p) => p.userId !== message.userId));
        setParticipantCount(message.participantCount);
        setRemoteStreams((current) => {
          const next = new Map(current);
          next.delete(message.userId);
          return next;
        });
        return;
      }
      if (message.type === "room-media-state" && message.roomId === roomRef.current) {
        setRemoteMediaStates((current) =>
          new Map(current).set(message.fromUserId, {
            microphoneEnabled: message.microphoneEnabled,
            cameraEnabled: message.cameraEnabled,
          })
        );
        return;
      }
      if (message.type === "room-chat" && message.roomId === roomRef.current) {
        setMessages((current) => [
          ...current.slice(-99),
          { id: `${message.sentAt}-${message.fromUserId}`, username: message.fromUsername, text: message.text },
        ]);
        return;
      }
      if (message.type === "room-reaction" && message.roomId === roomRef.current) {
        setMessages((current) => [
          ...current.slice(-99),
          { id: `${message.sentAt}-${message.fromUserId}`, username: message.fromUsername, text: `${message.emoji} reacted` },
        ]);
        return;
      }
      if (message.type === "room-offer" && message.roomId === roomRef.current) {
        void (async () => {
          const participant = { userId: message.fromUserId, username: message.fromUsername };
          await prepareLocalStream();
          await createPeer(participant, false);
          const peer = peers.current.get(message.fromUserId);
          if (!peer || !roomRef.current) return;
          await peer.webrtc.setRemoteDescription(message.offer);
          const answer = await peer.webrtc.createAnswer();
          service.send({ type: "room-answer", roomId: roomRef.current, targetUserId: message.fromUserId, answer });
        })().catch(() => setError("Could not connect to a room participant."));
        return;
      }
      if (message.type === "room-answer" && message.roomId === roomRef.current) {
        void peers.current.get(message.fromUserId)?.webrtc.setRemoteDescription(message.answer);
        return;
      }
      if (message.type === "room-ice-candidate" && message.roomId === roomRef.current) {
        void peers.current.get(message.fromUserId)?.webrtc.addIceCandidate(message.candidate);
      }
    });
    return unsubscribe;
  }, [createPeer, prepareLocalStream, service]);

  useEffect(() => () => closePeers(), [closePeers]);

  return (
    <RoomContext.Provider
      value={{
        roomId,
        participants,
        participantCount,
        localStream,
        remoteStreams,
        error,
        createRoom,
        joinRoom,
        leaveRoom,
        clearError: () => setError(null),
        microphoneEnabled,
        cameraEnabled,
        remoteMediaStates,
        toggleMicrophone,
        toggleCamera,
        messages,
        sendChat,
        sendReaction,
        screenSharing,
        toggleScreenSharing,
      }}
    >
      {children}
    </RoomContext.Provider>
  );
}

export function useRoomContext(): RoomContextValue {
  const context = useContext(RoomContext);
  if (!context) throw new Error("useRoomContext must be used within a RoomProvider");
  return context;
}
