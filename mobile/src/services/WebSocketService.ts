import { OutgoingSignal, IncomingSignal } from "../types/signaling";

declare const process: {
  env: Record<string, string | undefined>;
};

const WS_URL = process.env.EXPO_PUBLIC_WS_URL;

if (!WS_URL) {
  console.warn(
    "EXPO_PUBLIC_WS_URL is not set. Create mobile/.env from .env.example and set it to your machine's LAN IP."
  );
}

type MessageHandler = (message: IncomingSignal) => void;
type ConnectionHandler = () => void;

const RECONNECT_DELAY_MS = 2000;
const MAX_RECONNECT_DELAY_MS = 15000;
const INCOMING_MESSAGE_TTL_MS = 10000;

interface BufferedIncomingMessage {
  message: IncomingSignal;
  receivedAt: number;
}

// A single, app-wide WebSocket connection responsible for WebRTC signaling
// and presence. Deliberately implemented as a small class rather than a
// singleton module export so tests could instantiate multiple copies if
// ever needed, but WebSocketContext ensures only one instance is created
// for the whole app lifecycle.
export class WebSocketService {
  private socket: WebSocket | null = null;
  private token: string | null = null;
  private messageHandlers = new Set<MessageHandler>();
  private openHandlers = new Set<ConnectionHandler>();
  private closeHandlers = new Set<ConnectionHandler>();
  private pendingMessages: OutgoingSignal[] = [];
  private bufferedIncomingMessages: BufferedIncomingMessage[] = [];
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private manuallyClosed = false;

  connect(token: string): void {
    this.token = token;
    this.manuallyClosed = false;
    console.log("[signaling] connecting", WS_URL ?? "missing WebSocket URL");
    this.openSocket();
  }

  private openSocket(): void {
    if (!this.token || !WS_URL) return;

    // Avoid creating a second connection if one is already open/connecting.
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const url = `${WS_URL}?token=${encodeURIComponent(this.token)}`;
    const socket = new WebSocket(url);

    socket.onopen = () => {
      this.reconnectAttempt = 0;
      console.log("[signaling] connected");
      this.openHandlers.forEach((handler) => handler());
      this.pendingMessages.splice(0).forEach((message) => {
        socket.send(JSON.stringify(message));
      });
    };

    socket.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data) as IncomingSignal;
        const now = Date.now();
        this.bufferedIncomingMessages = this.bufferedIncomingMessages.filter(
          ({ receivedAt }) => now - receivedAt < INCOMING_MESSAGE_TTL_MS
        );
        this.bufferedIncomingMessages.push({ message: parsed, receivedAt: now });
        console.log("[signaling] received", parsed.type);
        this.messageHandlers.forEach((handler) => handler(parsed));
      } catch {
        console.warn("Received malformed WebSocket message");
      }
    };

    socket.onclose = () => {
      console.warn("[signaling] disconnected");
      this.closeHandlers.forEach((handler) => handler());
      if (!this.manuallyClosed) {
        this.scheduleReconnect();
      }
    };

    socket.onerror = () => {
      console.warn("[signaling] connection error");
      // onclose fires right after onerror for browser/RN WebSocket, so
      // reconnection is handled there.
    };

    this.socket = socket;
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;

    const delay = Math.min(RECONNECT_DELAY_MS * 2 ** this.reconnectAttempt, MAX_RECONNECT_DELAY_MS);
    this.reconnectAttempt += 1;

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (!this.manuallyClosed) {
        this.openSocket();
      }
    }, delay);
  }

  send(message: OutgoingSignal): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      this.pendingMessages.push(message);
    }
  }

  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    const now = Date.now();
    this.bufferedIncomingMessages
      .filter(({ receivedAt }) => now - receivedAt < INCOMING_MESSAGE_TTL_MS)
      .forEach(({ message }) => handler(message));
    return () => this.messageHandlers.delete(handler);
  }

  onOpen(handler: ConnectionHandler): () => void {
    this.openHandlers.add(handler);
    return () => this.openHandlers.delete(handler);
  }

  onClose(handler: ConnectionHandler): () => void {
    this.closeHandlers.add(handler);
    return () => this.closeHandlers.delete(handler);
  }

  disconnect(): void {
    this.manuallyClosed = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.socket?.close();
    this.socket = null;
    this.pendingMessages = [];
    this.bufferedIncomingMessages = [];
  }
}

export const webSocketService = new WebSocketService();
