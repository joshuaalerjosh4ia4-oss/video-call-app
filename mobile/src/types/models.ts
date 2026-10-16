export interface User {
  id: string;
  username: string;
  email: string;
  role: "STUDENT" | "TEACHER" | "ADMIN";
  mustChangePassword?: boolean;
  mobilePhone?: string | null;
  age?: number | null;
  sex?: "FEMALE" | "MALE" | "OTHER" | null;
  blk?: string | null;
  lot?: string | null;
  street?: string | null;
  villagePurok?: string | null;
  barangay?: string | null;
  municipality?: string | null;
  region?: string | null;
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

export interface ScheduledRoom {
  id: string;
  passcode: string;
  startsAt: string;
  endsAt: string;
  subject: {
    id: string;
    code: string;
    title: string;
    section: { course: string; code: string };
  };
}

export interface EnrolledSubject {
  id: string;
  code: string;
  subjectId?: string;
  title?: string;
  course?: string;
  sectionCode?: string;
  dayOfWeek?: number;
  startTime?: string;
  endTime?: string;
}

export interface SubjectPeopleMember {
  id: string;
  username: string;
}

export interface Enrollment {
  id: string;
  courseCode: string;
  createdAt?: string;
  subject?: {
    id: string;
    code: string;
    joinCode?: string;
    title: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    section: { course: string; code: string };
  } | null;
}

export interface AdmissionSubject {
  id: string;
  code: string;
  joinCode?: string;
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
  teacherId?: string | null;
  teacher?: { id: string; username: string } | null;
  subjects: AdmissionSubject[];
}

export interface TeacherAccount {
  id: string;
  username: string;
  email: string;
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
