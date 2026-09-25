import {
  RTCPeerConnection,
  RTCSessionDescription,
  RTCIceCandidate,
  MediaStream,
  MediaStreamTrack,
  mediaDevices,
} from "react-native-webrtc";
import { PermissionsAndroid, Platform } from "react-native";
import { RTC_CONFIGURATION, MEDIA_CONSTRAINTS } from "./config";
import { RTCIceCandidateInit, RTCSessionDescriptionInit } from "../types/signaling";

export type RemoteTrackHandler = (stream: MediaStream) => void;
export type IceCandidateHandler = (candidate: RTCIceCandidateInit) => void;
export type ConnectionStateHandler = (state: string) => void;

// WebRTCService wraps a single RTCPeerConnection plus the local media
// stream for the lifetime of one call. A new instance should be created for
// every call and discarded (via close()) when the call ends - it is not
// designed to be reused across calls.
export class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private currentFacingMode: "user" | "environment" = "user";

  private onRemoteTrack: RemoteTrackHandler | null = null;
  private onIceCandidate: IceCandidateHandler | null = null;
  private onConnectionStateChange: ConnectionStateHandler | null = null;

  setOnRemoteTrack(handler: RemoteTrackHandler): void {
    this.onRemoteTrack = handler;
  }

  setOnIceCandidate(handler: IceCandidateHandler): void {
    this.onIceCandidate = handler;
  }

  setOnConnectionStateChange(handler: ConnectionStateHandler): void {
    this.onConnectionStateChange = handler;
  }

  /** Requests camera + microphone permission implicitly via getUserMedia and returns the local stream. */
  async acquireLocalStream(): Promise<MediaStream> {
    if (Platform.OS === "android") {
      const permissions = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.CAMERA,
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      ]);
      const cameraGranted = permissions[PermissionsAndroid.PERMISSIONS.CAMERA] === PermissionsAndroid.RESULTS.GRANTED;
      const microphoneGranted =
        permissions[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED;
      if (!cameraGranted || !microphoneGranted) {
        throw new Error("Camera and microphone permissions were not granted");
      }
    }
    const stream = (await mediaDevices.getUserMedia(MEDIA_CONSTRAINTS)) as unknown as MediaStream;
    stream.getTracks().forEach((track) => {
      track.enabled = true;
    });
    this.localStream = stream;
    return stream;
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  useLocalStream(stream: MediaStream): void {
    this.localStream = stream;
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  /** Creates the RTCPeerConnection and wires up its event handlers. Must be called after acquireLocalStream(). */
  createPeerConnection(): RTCPeerConnection {
    // RTC_CONFIGURATION is intentionally typed loosely (see webrtc/config.ts);
    // react-native-webrtc's own RTCConfiguration type isn't publicly exported,
    // so it can't be referenced directly from application code.
    const pc = new RTCPeerConnection(RTC_CONFIGURATION as ConstructorParameters<typeof RTCPeerConnection>[0]);

    if (this.localStream) {
      this.localStream.getTracks().forEach((track: MediaStreamTrack) => {
        pc.addTrack(track, this.localStream as MediaStream);
      });
    }

    // react-native-webrtc types this event loosely; cast is confined here.
    (pc as unknown as { onicecandidate: (event: { candidate: unknown }) => void }).onicecandidate = (event) => {
      const candidate = event.candidate as
        | { candidate: string; sdpMid: string | null; sdpMLineIndex: number | null }
        | null
        | undefined;
      if (candidate && this.onIceCandidate) {
        this.onIceCandidate({
          candidate: candidate.candidate,
          sdpMid: candidate.sdpMid,
          sdpMLineIndex: candidate.sdpMLineIndex,
        });
      }
    };

    (pc as unknown as { ontrack: (event: { streams: MediaStream[] }) => void }).ontrack = (event) => {
      const [stream] = event.streams;
      if (stream) {
        this.remoteStream = stream;
        this.onRemoteTrack?.(stream);
      }
    };

    (pc as unknown as { onconnectionstatechange: () => void }).onconnectionstatechange = () => {
      const state = (pc as unknown as { connectionState: string }).connectionState;
      this.onConnectionStateChange?.(state);
    };

    this.peerConnection = pc;
    return pc;
  }

  async createOffer(): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) throw new Error("PeerConnection not initialized");
    const offer = await this.peerConnection.createOffer({});
    await this.peerConnection.setLocalDescription(offer);
    return { type: offer.type as RTCSessionDescriptionInit["type"], sdp: offer.sdp ?? "" };
  }

  async createAnswer(): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) throw new Error("PeerConnection not initialized");
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    return { type: answer.type as RTCSessionDescriptionInit["type"], sdp: answer.sdp ?? "" };
  }

  async setRemoteDescription(description: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) throw new Error("PeerConnection not initialized");
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(description));
  }

  async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.peerConnection) throw new Error("PeerConnection not initialized");
    await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  }

  setMicrophoneEnabled(enabled: boolean): void {
    this.localStream?.getAudioTracks().forEach((track: MediaStreamTrack) => {
      track.enabled = enabled;
    });
  }

  setCameraEnabled(enabled: boolean): void {
    this.localStream?.getVideoTracks().forEach((track: MediaStreamTrack) => {
      track.enabled = enabled;
    });
  }

  replaceVideoTrack(track: MediaStreamTrack): void {
    const sender = this.peerConnection
      ?.getSenders()
      .find((currentSender) => currentSender.track?.kind === "video");
    if (sender) {
      void sender.replaceTrack(track);
    }
  }

  async switchCamera(): Promise<void> {
    const videoTrack = this.localStream?.getVideoTracks()[0] as
      | (MediaStreamTrack & { _switchCamera?: () => void })
      | undefined;

    if (videoTrack && typeof videoTrack._switchCamera === "function") {
      videoTrack._switchCamera();
      this.currentFacingMode = this.currentFacingMode === "user" ? "environment" : "user";
    }
  }

  getFacingMode(): "user" | "environment" {
    return this.currentFacingMode;
  }

  /** Stops local tracks, closes the peer connection, and clears references. Idempotent and safe to call multiple times. */
  close(): void {
    this.localStream?.getTracks().forEach((track: MediaStreamTrack) => track.stop());
    this.localStream = null;
    this.remoteStream = null;

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    this.onRemoteTrack = null;
    this.onIceCandidate = null;
    this.onConnectionStateChange = null;
  }
}
