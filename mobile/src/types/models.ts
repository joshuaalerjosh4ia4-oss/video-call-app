export interface User {
  id: string;
  username: string;
  email: string;
  role: "STUDENT" | "TEACHER" | "ADMIN";
  createdAt?: string;
  online?: boolean;
}

export interface MeetingRecord {
  id: string;
  roomId: string;
  type: "created" | "joined";
  createdAt: string;
}

export interface SavedRoom {
  roomId: string;
  passcode: string;
}

export interface EnrolledSubject {
  id: string;
  code: string;
}

export interface Enrollment {
  id: string;
  courseCode: string;
  createdAt?: string;
}

export interface AdmissionSubject {
  id: string;
  code: string;
  title: string;
  units: number;
  schedule?: "morning" | "afternoon" | "evening";
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface CourseSection {
  id: string;
  code: string;
  course: string;
  yearLevel: number;
  semester: string;
  subjects: AdmissionSubject[];
}

export interface Admission {
  id: string;
  status: "DRAFT" | "SUBMITTED" | "FINALIZED" | "REJECTED";
  paymentStatus: "UNPAID" | "PAID";
  enrollmentFee: number;
  subjectFees: number;
  otherFees: number;
  totalFees: number;
  section: CourseSection;
  subjects?: { subject: AdmissionSubject; schedule?: "morning" | "afternoon" | "evening" }[];
  student?: { username: string; email: string };
}

export interface AuthResult {
  token: string;
  user: User;
}
