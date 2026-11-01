import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { EnrolledSubject, MeetingRecord } from "../types/models";

// Auth tokens are sensitive, so they're persisted with expo-secure-store
// (Keychain on iOS, EncryptedSharedPreferences on Android) rather than
// AsyncStorage, which is unencrypted.
const TOKEN_KEY = "simplecall_auth_token";
const USER_KEY = "simplecall_auth_user";
const MEETING_HISTORY_KEY = "simplecall_meeting_history";
const ENROLLED_SUBJECTS_KEY = "simplecall_enrolled_subjects";

export async function saveAuthToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function getAuthToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function saveStoredUser(userJson: string): Promise<void> {
  await SecureStore.setItemAsync(USER_KEY, userJson);
}

export async function getStoredUser(): Promise<string | null> {
  return SecureStore.getItemAsync(USER_KEY);
}

export async function clearAuthStorage(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(USER_KEY);
}

export async function saveMeetingRecord(record: MeetingRecord): Promise<void> {
  const existing = await getMeetingHistory();
  await AsyncStorage.setItem(MEETING_HISTORY_KEY, JSON.stringify([record, ...existing]));
}

export async function getMeetingHistory(): Promise<MeetingRecord[]> {
  const stored = await AsyncStorage.getItem(MEETING_HISTORY_KEY);
  if (!stored) return [];

  try {
    const records = JSON.parse(stored) as unknown;
    return Array.isArray(records) ? (records as MeetingRecord[]) : [];
  } catch {
    return [];
  }
}

export async function saveEnrolledSubject(subject: EnrolledSubject): Promise<void> {
  const existing = await getEnrolledSubjects();
  await AsyncStorage.setItem(ENROLLED_SUBJECTS_KEY, JSON.stringify([subject, ...existing]));
}

export async function getEnrolledSubjects(): Promise<EnrolledSubject[]> {
  const stored = await AsyncStorage.getItem(ENROLLED_SUBJECTS_KEY);
  if (!stored) return [];

  try {
    const subjects = JSON.parse(stored) as unknown;
    if (!Array.isArray(subjects)) return [];

    return subjects.flatMap((subject) => {
      if (!subject || typeof subject !== "object") return [];

      const storedSubject = subject as { id?: unknown; code?: unknown; name?: unknown };
      const code = typeof storedSubject.code === "string" ? storedSubject.code : storedSubject.name;
      if (typeof storedSubject.id !== "string" || typeof code !== "string") return [];

      return [{ id: storedSubject.id, code }];
    });
  } catch {
    return [];
  }
}
