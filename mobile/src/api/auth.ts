import { apiClient } from "./client";
import { AuthResult, User } from "../types/models";

export function registerRequest(input: { username: string; email: string; password: string }) {
  return apiClient.post<AuthResult>("/api/auth/register", input, false);
}

export function loginRequest(input: { email: string; password: string }) {
  return apiClient.post<AuthResult>("/api/auth/login", input, false);
}

export function fetchCurrentUser() {
  return apiClient.get<User>("/api/auth/me");
}
