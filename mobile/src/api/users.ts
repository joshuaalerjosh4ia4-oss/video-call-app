import { apiClient } from "./client";
import { User } from "../types/models";

export function fetchUsers() {
  return apiClient.get<User[]>("/api/users");
}

export function fetchUserById(id: string) {
  return apiClient.get<User>(`/api/users/${id}`);
}
