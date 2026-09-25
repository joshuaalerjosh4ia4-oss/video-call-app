import jwt from "jsonwebtoken";
import { env } from "../config/env";

export interface JwtPayload {
  userId: string;
  username: string;
}

const TOKEN_EXPIRY = "7d";

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: TOKEN_EXPIRY });
}

export function verifyToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, env.jwtSecret);
  if (
    typeof decoded === "object" &&
    decoded !== null &&
    "userId" in decoded &&
    "username" in decoded
  ) {
    const payload = decoded as JwtPayload;
    return { userId: String(payload.userId), username: String(payload.username) };
  }
  throw new Error("Invalid token payload");
}
