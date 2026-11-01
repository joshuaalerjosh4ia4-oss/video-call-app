import { apiClient } from "./client";
import { ClassroomPost, Enrollment, SubjectPeopleMember, UpcomingWork } from "../types/models";

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

export function fetchSubjectPosts(subjectId: string) {
  return apiClient.get<ClassroomPost[]>(
    `/api/enrollments/${encodeURIComponent(subjectId)}/posts`
  );
}

export function fetchUpcomingWork() {
  return apiClient.get<UpcomingWork[]>("/api/enrollments/upcoming-work");
}