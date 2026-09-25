import { apiClient } from "./client";
import { Enrollment } from "../types/models";

export function fetchEnrollments() {
  return apiClient.get<Enrollment[]>("/api/enrollments");
}

export function enrollInCourse(courseCode: string) {
  return apiClient.post<Enrollment>("/api/enrollments", { courseCode });
}