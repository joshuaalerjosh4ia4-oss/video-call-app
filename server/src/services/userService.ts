import { prisma } from "../config/prisma";
import { HttpError } from "../middleware/errorHandler";
import { isUserOnline } from "../websocket/presence";

export async function listUsersExcept(currentUserId: string) {
  const users = await prisma.user.findMany({
    where: { id: { not: currentUserId } },
    select: { id: true, username: true, email: true, role: true, createdAt: true },
    orderBy: { username: "asc" },
  });

  return users.map((user) => ({
    ...user,
    online: isUserOnline(user.id),
  }));
}

export async function getUserById(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true, email: true, role: true, createdAt: true },
  });

  if (!user) {
    throw new HttpError(404, "User not found");
  }

  return { ...user, online: isUserOnline(user.id) };
}
