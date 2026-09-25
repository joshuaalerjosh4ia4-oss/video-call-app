import { WebSocket } from "ws";

// In-memory mapping of userId -> active WebSocket connection.
// This is intentionally not persisted: presence is transient by nature and
// resets whenever the server restarts, which is the desired behavior.
const connections = new Map<string, WebSocket>();

export function registerConnection(userId: string, socket: WebSocket): void {
  const existing = connections.get(userId);
  if (existing && existing !== socket && existing.readyState === WebSocket.OPEN) {
    // Close any stale prior connection for this user (e.g. app was killed
    // without a clean disconnect and then reopened).
    existing.close(4001, "Replaced by new connection");
  }
  connections.set(userId, socket);
}

export function removeConnection(userId: string, socket: WebSocket): boolean {
  const existing = connections.get(userId);
  if (existing === socket) {
    connections.delete(userId);
    return true;
  }
  return false;
}

export function getConnection(userId: string): WebSocket | undefined {
  return connections.get(userId);
}

export function isUserOnline(userId: string): boolean {
  const socket = connections.get(userId);
  return !!socket && socket.readyState === WebSocket.OPEN;
}

export function getOnlineUserIds(): string[] {
  return Array.from(connections.keys()).filter((userId) => isUserOnline(userId));
}
