import jwt from "jsonwebtoken";
import { env } from "../config/env";

export type TokenType = "auth" | "ws";

export interface JwtPayload {
  userId: string;
  username: string;
  type?: TokenType;
}

const TOKEN_EXPIRY = "7d";
const SIGNED_IN_WS_TOKEN_EXPIRY = "60s";

export function signToken(payload: JwtPayload, expiresIn: string = TOKEN_EXPIRY): string {
  const options: jwt.SignOptions = { expiresIn: expiresIn as jwt.SignOptions["expiresIn"] };
  return jwt.sign({ ...payload, type: payload.type ?? "auth" }, env.jwtSecret, options);
}

export function signWebSocketToken(payload: JwtPayload): string {
  return signToken({ ...payload, type: "ws" }, SIGNED_IN_WS_TOKEN_EXPIRY);
}

export function verifyToken(token: string, expectedType?: TokenType): JwtPayload {
  const decoded = jwt.verify(token, env.jwtSecret);
  if (
    typeof decoded === "object" &&
    decoded !== null &&
    "userId" in decoded &&
    "username" in decoded
  ) {
    const payload = decoded as JwtPayload;
    const type = payload.type ?? "auth";
    if (expectedType && type !== expectedType) {
      throw new Error(`Invalid token type: expected ${expectedType}`);
    }
    return { userId: String(payload.userId), username: String(payload.username), type };
  }
  throw new Error("Invalid token payload");
}
