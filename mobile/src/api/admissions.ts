import { apiClient } from "./client";
import { Admission, CourseSection } from "../types/models";

function normalizeAdmission(admission: Admission): Admission {
  return {
    ...admission,
    enrollmentFee: Number(admission.enrollmentFee),
    subjectFees: Number(admission.subjectFees),
    otherFees: Number(admission.otherFees),
    totalFees: Number(admission.totalFees),
  };
}

export function fetchCourseSections() {
  return apiClient.get<CourseSection[]>("/api/admissions/sections");
}

export function fetchMyAdmission() {
  return apiClient.get<Admission | null>("/api/admissions/mine").then((admission) => admission ? normalizeAdmission(admission) : null);
}

export function submitAdmission(sectionId: string, subjectSelections: { subjectId: string; schedule: "morning" | "afternoon" | "evening" }[]) {
  return apiClient.post<Admission>("/api/admissions/submit", { sectionId, subjectSelections }).then(normalizeAdmission);
}

export function fetchAdminAdmissions() {
  return apiClient.get<Admission[]>("/api/admissions/admin").then((admissions) => admissions.map(normalizeAdmission));
}

export function updateAdminAdmission(id: string, paymentStatus: "UNPAID" | "PAID", finalize: boolean) {
  return apiClient.patch<Admission>(`/api/admissions/admin/${id}`, { paymentStatus, finalize }).then(normalizeAdmission);
}

export function createCourseSection(input: { code: string; course: string; yearLevel: number; semester: string; subjects: { code: string; title: string; units: number; dayOfWeek: number; startTime: string; endTime: string }[] }) {
  return apiClient.post<CourseSection>("/api/admissions/sections", input);
}