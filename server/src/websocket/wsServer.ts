import { IncomingMessage } from "http";
import { Server as HttpServer } from "http";
import { WebSocket, WebSocketServer } from "ws";
import { URL } from "url";
import { env } from "../config/env";
import { verifyToken } from "../utils/jwt";
import { registerConnection, removeConnection, getOnlineUserIds } from "./presence";
import { ClientToServerMessage, RoomParticipant, ServerToClientMessage } from "./types";
import { prisma } from "../config/prisma";

interface AuthenticatedSocket extends WebSocket {
  userId?: string;
  username?: string;
  role?: "STUDENT" | "TEACHER" | "ADMIN";
  isAlive?: boolean;
  messageWindowStartedAt?: number;
  messageCount?: number;
}

const MAX_ROOM_PARTICIPANTS = 50;
const MAX_WS_PAYLOAD_BYTES = 128 * 1024;
const MAX_MESSAGES_PER_WINDOW = 80;
const MESSAGE_WINDOW_MS = 10_000;
const MAX_ROOM_ID_LENGTH = 64;
const MAX_PASSCODE_LENGTH = 128;
const MAX_CHAT_LENGTH = 2_000;
const MAX_REACTION_LENGTH = 32;
const rooms = new Map<string, { passcode: string; members: Map<string, { socket: AuthenticatedSocket; username: string }> }>();

function send(socket: WebSocket, message: ServerToClientMessage): void {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message));
  }
}

async function authenticateRequest(req: IncomingMessage): Promise<{ userId: string; username: string; role: AuthenticatedSocket["role"] } | null> {
  try {
    const url = new URL(req.url ?? "", "http://localhost");
    const token = url.searchParams.get("token");
    if (!token) return null;
    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.userId }, select: { username: true, role: true } });
    if (!user) return null;
    return { userId: payload.userId, username: user.username, role: user.role };
  } catch {
    return null;
  }
}

export function attachWebSocketServer(httpServer: HttpServer): WebSocketServer {
  const wss = new WebSocketServer({ server: httpServer, path: env.wsPath, maxPayload: MAX_WS_PAYLOAD_BYTES });

  const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((client) => {
      const socket = client as AuthenticatedSocket;
      if (socket.isAlive === false) {
        socket.terminate();
        return;
      }
      socket.isAlive = false;
      socket.ping();
    });
  }, 30000);

  wss.on("close", () => clearInterval(heartbeatInterval));

  wss.on("connection", async (rawSocket: WebSocket, req: IncomingMessage) => {
    const socket = rawSocket as AuthenticatedSocket;
    const identity = await authenticateRequest(req);

    if (!identity) {
      send(socket, { type: "error", message: "Authentication failed: missing or invalid token" });
      socket.close(4001, "Unauthorized");
      return;
    }

    socket.userId = identity.userId;
    socket.username = identity.username;
    socket.role = identity.role;
    socket.isAlive = true;
    console.log(`[ws] connected ${identity.username} (${identity.userId})`);

    registerConnection(identity.userId, socket);
    getOnlineUserIds().forEach((onlineUserId) => {
      if (onlineUserId !== identity.userId) {
        send(socket, { type: "user-online", userId: onlineUserId });
      }
    });
    broadcastPresence(wss, identity.userId, "user-online");

    socket.on("pong", () => {
      socket.isAlive = true;
    });

    socket.on("message", (raw) => {
      if (!acceptMessage(socket)) return;
      if (Buffer.byteLength(raw.toString(), "utf8") > MAX_WS_PAYLOAD_BYTES) {
        send(socket, { type: "error", message: "Message is too large" });
        socket.close(1009, "Message too large");
        return;
      }
      let parsed: ClientToServerMessage;
      try {
        const candidate: unknown = JSON.parse(raw.toString());
        if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) throw new Error("Message must be an object");
        parsed = candidate as ClientToServerMessage;
      } catch {
        send(socket, { type: "error", message: "Invalid message format: expected JSON" });
        return;
      }

      void handleClientMessage(socket, parsed);
    });

    socket.on("close", () => {
      console.log(`[ws] disconnected ${identity.username} (${identity.userId})`);
      if (removeConnection(identity.userId, socket)) {
        broadcastPresence(wss, identity.userId, "user-offline");
      }
      leaveAllRooms(socket);
    });

    socket.on("error", () => {
      removeConnection(identity.userId, socket);
    });
  });

  return wss;
}

function acceptMessage(socket: AuthenticatedSocket): boolean {
  const now = Date.now();
  if (!socket.messageWindowStartedAt || now - socket.messageWindowStartedAt >= MESSAGE_WINDOW_MS) {
    socket.messageWindowStartedAt = now;
    socket.messageCount = 0;
  }
  socket.messageCount = (socket.messageCount ?? 0) + 1;
  if (socket.messageCount > MAX_MESSAGES_PER_WINDOW) {
    send(socket, { type: "error", message: "Too many messages. Please slow down." });
    return false;
  }
  return true;
}

function broadcastPresence(wss: WebSocketServer, userId: string, type: "user-online" | "user-offline"): void {
  wss.clients.forEach((client) => {
    const socket = client as AuthenticatedSocket;
    if (socket.userId && socket.userId !== userId) {
      send(socket, { type, userId });
    }
  });
}

async function handleClientMessage(socket: AuthenticatedSocket, message: ClientToServerMessage): Promise<void> {
  if (!socket.userId || !socket.username || !socket.role) return;

  if (message.type === "room-create" || message.type === "room-join") {
    await joinRoom(
      socket,
      message.roomId,
      message.passcode,
      message.type === "room-create",
      message.type === "room-create" ? message.startsAt : undefined,
      message.type === "room-create" ? message.endsAt : undefined
    );
    return;
  }
  if (message.type === "room-leave") {
    void leaveRoom(socket, message.roomId);
    return;
  }
  if (
    message.type === "room-offer" ||
    message.type === "room-answer" ||
    message.type === "room-ice-candidate"
  ) {
    const room = rooms.get(message.roomId);
    const target = room?.members.get(message.targetUserId)?.socket;
    if (!target || !room?.members.has(socket.userId)) {
      send(socket, { type: "error", message: "You are not a member of that room" });
      return;
    }
    send(target, {
      ...message,
      fromUserId: socket.userId,
      ...(message.type === "room-offer" ? { fromUsername: socket.username } : {}),
    } as ServerToClientMessage);
    return;
  }
  if (
    message.type === "room-media-state" ||
    message.type === "room-chat" ||
    message.type === "room-reaction"
  ) {
    if (message.type === "room-chat" && message.text.length > MAX_CHAT_LENGTH) {
      send(socket, { type: "error", message: "Chat message is too long" });
      return;
    }
    if (message.type === "room-reaction" && message.emoji.length > MAX_REACTION_LENGTH) {
      send(socket, { type: "error", message: "Reaction is too long" });
      return;
    }
    const room = rooms.get(message.roomId);
    if (!room?.members.has(socket.userId)) {
      send(socket, { type: "error", message: "You are not a member of that room" });
      return;
    }
    const sentAt = new Date().toISOString();
    room.members.forEach((member, userId) => {
      if (userId !== socket.userId) {
        send(member.socket, {
          ...message,
          fromUserId: socket.userId!,
          fromUsername: socket.username!,
          ...(message.type === "room-chat" || message.type === "room-reaction" ? { sentAt } : {}),
        } as ServerToClientMessage);
      }
    });
    return;
  }

  send(socket, { type: "error", message: "Unknown message type" });
}

function participants(room: Map<string, { socket: AuthenticatedSocket; username: string }>): RoomParticipant[] {
  return Array.from(room.entries()).map(([userId, member]) => ({
    userId,
    username: member.username ?? "",
  }));
}

async function joinRoom(
  socket: AuthenticatedSocket,
  roomId: string,
  passcode: string,
  creating: boolean,
  startsAt?: string,
  endsAt?: string
): Promise<void> {
  const normalizedRoomId = roomId.trim().toUpperCase();
  const normalizedPasscode = passcode.trim();
  if (
    !socket.userId ||
    !socket.username ||
    !normalizedRoomId ||
    !normalizedPasscode ||
    normalizedRoomId.length > MAX_ROOM_ID_LENGTH ||
    normalizedPasscode.length > MAX_PASSCODE_LENGTH
  ) {
    send(socket, { type: "error", message: "Meeting ID and passcode are required" });
    return;
  }

  try {
    let room = rooms.get(normalizedRoomId);
    const storedRoom = await prisma.room.findUnique({ where: { id: normalizedRoomId } });

    if (creating) {
      if (room || storedRoom) {
        send(socket, { type: "error", message: "That room already exists" });
        return;
      }
      const parsedStartsAt = startsAt ? new Date(startsAt) : null;
      const parsedEndsAt = endsAt ? new Date(endsAt) : null;
      if (
        !parsedStartsAt ||
        !parsedEndsAt ||
        Number.isNaN(parsedStartsAt.getTime()) ||
        Number.isNaN(parsedEndsAt.getTime()) ||
        parsedStartsAt >= parsedEndsAt
      ) {
        send(socket, { type: "error", message: "A valid room start and end time are required" });
        return;
      }
      await prisma.room.create({
        data: {
          id: normalizedRoomId,
          passcode: normalizedPasscode,
          ownerId: socket.userId,
          startsAt: parsedStartsAt,
          endsAt: parsedEndsAt,
        },
      });
      room = { passcode: normalizedPasscode, members: new Map() };
      rooms.set(normalizedRoomId, room);
    } else {
      if (storedRoom && storedRoom.passcode !== normalizedPasscode) {
        send(socket, { type: "error", message: "Incorrect meeting passcode" });
        return;
      }
      if (!storedRoom) {
        send(socket, { type: "error", message: "Room not found. Check the room code and try again." });
        return;
      }
      const now = new Date();
      if (storedRoom.startsAt && now < storedRoom.startsAt) {
        send(socket, { type: "error", message: `This room opens at ${storedRoom.startsAt.toLocaleTimeString()}` });
        return;
      }
      if (storedRoom.endsAt && now > storedRoom.endsAt) {
        send(socket, { type: "error", message: "This room's joining window has ended" });
        return;
      }
      if (!room) {
        room = { passcode: storedRoom.passcode, members: new Map() };
        rooms.set(normalizedRoomId, room);
      }
    }

    if (room.passcode !== normalizedPasscode) {
      send(socket, { type: "error", message: "Incorrect meeting passcode" });
      return;
    }

    if (room.members.has(socket.userId)) {
      send(socket, { type: "error", message: "You are already in that room" });
      return;
    }
    if (room.members.size >= MAX_ROOM_PARTICIPANTS) {
      send(socket, { type: "error", message: "This room is full (maximum 50 participants)" });
      return;
    }
    room.members.set(socket.userId, { socket, username: socket.username });
    const participantCount = room.members.size;
    send(socket, {
      type: creating ? "room-created" : "room-joined",
      roomId: normalizedRoomId,
      participants: participants(room.members).filter((participant) => participant.userId !== socket.userId),
      participantCount,
    });
    room.members.forEach((member, userId) => {
      if (userId !== socket.userId) {
        send(member.socket, {
          type: "room-user-joined",
          roomId: normalizedRoomId,
          participant: { userId: socket.userId!, username: socket.username! },
          participantCount,
        });
      }
    });
  } catch (error) {
    console.error(`[ws] failed to ${creating ? "create" : "join"} room ${normalizedRoomId}`, error);
    send(socket, { type: "error", message: "Could not access the meeting. Please try again." });
  }
}

async function leaveRoom(socket: AuthenticatedSocket, roomId: string): Promise<void> {
  if (!socket.userId) return;
  const room = rooms.get(roomId);
  const member = room?.members.get(socket.userId);
  if (!room || !member) return;
  room.members.delete(socket.userId);
  const participantCount = room.members.size;
  room.members.forEach((member) =>
    send(member.socket, { type: "room-user-left", roomId, userId: socket.userId!, participantCount })
  );
  if (room.members.size === 0) rooms.delete(roomId);
}

async function leaveAllRooms(socket: AuthenticatedSocket): Promise<void> {
  await Promise.all(Array.from(rooms.keys()).map((roomId) => leaveRoom(socket, roomId)));
}

export { getOnlineUserIds };
