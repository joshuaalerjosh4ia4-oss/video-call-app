import { apiClient } from "./client";
import { ScheduledRoom } from "../types/models";

export function fetchScheduledRooms() {
  return apiClient.get<ScheduledRoom[]>("/api/rooms");
}

export function scheduleRoom(input: { subjectId: string; startsAt: string; endsAt: string }) {
  return apiClient.post<ScheduledRoom>("/api/rooms", input);
}
