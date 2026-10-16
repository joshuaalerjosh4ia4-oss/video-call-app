import { apiClient } from "./client";
import { TeacherAccount } from "../types/models";

export function createTeacher(input: { username: string; email: string }) {
  return apiClient.post<{ id: string; username: string; email: string }>("/api/users/teachers", input);
}

export function fetchTeachers() {
  return apiClient.get<TeacherAccount[]>("/api/users/teachers");
}
