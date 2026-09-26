import { apiClient } from "./client";
import { AuthResult, User } from "../types/models";

export interface RegistrationInput {
  username: string;
  email: string;
  password: string;
  mobilePhone: string;
  age: number;
  sex: "FEMALE" | "MALE" | "OTHER";
  blk: string;
  lot: string;
  street: string;
  villagePurok: string;
  barangay: string;
  municipality: string;
  region: string;
}

export function registerRequest(input: RegistrationInput) {
  return apiClient.post<{ email: string; verificationRequired: true }>("/api/auth/register", input, false);
}

export function verifyEmailRequest(input: { email: string; code: string }) {
  return apiClient.post<{ verified: true }>("/api/auth/verify-email/confirm", input, false);
}

export function resendVerificationRequest(input: { email: string }) {
  return apiClient.post<{ message: string }>("/api/auth/verify-email/resend", input, false);
}

export function loginRequest(input: { email: string; password: string }) {
  return apiClient.post<AuthResult>("/api/auth/login", input, false);
}

export function forgotPasswordRequest(input: { email: string }) {
  return apiClient.post<{ message: string }>("/api/auth/forgot-password", input, false);
}

export function changePasswordRequest(input: { newPassword: string }) {
  return apiClient.post<{ changed: true }>("/api/auth/change-password", input);
}

export function fetchCurrentUser() {
  return apiClient.get<User>("/api/auth/me");
}
