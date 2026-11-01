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
type TokenFailureHandler = (error: unknown) => void;

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
  private tokenProvider: (() => Promise<string>) | null = null;
  private messageHandlers = new Set<MessageHandler>();
  private openHandlers = new Set<ConnectionHandler>();
  private closeHandlers = new Set<ConnectionHandler>();
  private tokenFailureHandlers = new Set<TokenFailureHandler>();
  private pendingMessages: OutgoingSignal[] = [];
  private bufferedIncomingMessages: BufferedIncomingMessage[] = [];
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private manuallyClosed = false;
  private connectionGeneration = 0;
  private tokenRequestInProgress = false;

  connect(tokenProvider: () => Promise<string>): void {
    this.tokenProvider = tokenProvider;
    this.manuallyClosed = false;
    this.connectionGeneration += 1;
    this.tokenRequestInProgress = false;
    console.log("[signaling] connecting", WS_URL ?? "missing WebSocket URL");
    this.openSocket();
  }

  private openSocket(): void {
    const tokenProvider = this.tokenProvider;
    if (!tokenProvider || !WS_URL || this.tokenRequestInProgress) return;

    // Avoid creating a second connection if one is already open/connecting.
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const generation = this.connectionGeneration;
    this.tokenRequestInProgress = true;
    void tokenProvider().then((token) => {
      if (generation !== this.connectionGeneration || this.manuallyClosed) return;
      if (!token) throw new Error("The WebSocket token endpoint returned an empty token");

      const socket = new WebSocket(WS_URL, ["myclasses-ws", token]);
      this.socket = socket;

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
          if (parsed.type === "error" && parsed.message.toLowerCase().includes("authentication failed")) {
            socket.close(4001, "Unauthorized");
          }
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
    }).catch((error: unknown) => {
      if (generation !== this.connectionGeneration || this.manuallyClosed) return;
      console.warn("[signaling] could not get a fresh WebSocket token");
      this.tokenFailureHandlers.forEach((handler) => handler(error));
      this.scheduleReconnect();
    }).finally(() => {
      if (generation === this.connectionGeneration) {
        this.tokenRequestInProgress = false;
      }
    });
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

  onTokenFailure(handler: TokenFailureHandler): () => void {
    this.tokenFailureHandlers.add(handler);
    return () => this.tokenFailureHandlers.delete(handler);
  }

  disconnect(): void {
    this.manuallyClosed = true;
    this.connectionGeneration += 1;
    this.tokenProvider = null;
    this.tokenRequestInProgress = false;
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
