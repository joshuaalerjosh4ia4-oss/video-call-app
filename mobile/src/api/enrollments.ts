import { apiClient } from "./client";
import { Enrollment, SubjectPeopleMember } from "../types/models";

export function fetchEnrollments() {
  return apiClient.get<Enrollment[]>("/api/enrollments");
}

export function enrollInCourse(joinCode: string) {
  return apiClient.post<Enrollment>("/api/enrollments", { joinCode });
}

export function fetchSubjectPeople(subjectId: string) {
  return apiClient.get<SubjectPeopleMember[]>(
    `/api/enrollments/${encodeURIComponent(subjectId)}/people`
  );
}