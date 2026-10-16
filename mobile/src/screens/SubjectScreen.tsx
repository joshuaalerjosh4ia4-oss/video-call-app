import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Admission, EnrolledSubject, SubjectPeopleMember } from "../types/models";
import { enrollInCourse, fetchEnrollments, fetchSubjectPeople } from "../api/enrollments";
import { fetchMyAdmission } from "../api/admissions";
import { useAuthContext } from "../context/AuthContext";
import { scheduleClassReminders } from "../services/ClassReminderService";

type ClassroomTab = "Stream" | "Classwork" | "People";
const bannerColors = ["#563B68", "#28745A", "#C17A28", "#A45162"];

export default function SubjectScreen() {
  const { user } = useAuthContext();
  const [subjects, setSubjects] = useState<EnrolledSubject[]>([]);
  const [admission, setAdmission] = useState<Admission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<EnrolledSubject | null>(null);
  const [activeClassroomTab, setActiveClassroomTab] = useState<ClassroomTab>("Stream");
  const [classPeople, setClassPeople] = useState<SubjectPeopleMember[]>([]);
  const [isLoadingPeople, setIsLoadingPeople] = useState(false);
  const [peopleError, setPeopleError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectCode, setSubjectCode] = useState("");

  useEffect(() => {
    if (user?.role !== "STUDENT") {
      setSubjects([]);
      setIsLoading(false);
      return;
    }

    void loadSubjects();
  }, [user?.role]);

  async function loadSubjects(refresh = false) {
    if (refresh) setIsRefreshing(true); else setIsLoading(true);
    try {
      const [enrollments, currentAdmission] = await Promise.all([fetchEnrollments(), fetchMyAdmission()]);
      setSubjects(enrollments.map((enrollment) => ({
        id: enrollment.id,
        code: enrollment.courseCode,
        subjectId: enrollment.subject?.id,
        title: enrollment.subject?.title,
        course: enrollment.subject?.section.course,
        sectionCode: enrollment.subject?.section.code,
        dayOfWeek: enrollment.subject?.dayOfWeek,
        startTime: enrollment.subject?.startTime,
        endTime: enrollment.subject?.endTime,
      })));
      setAdmission(currentAdmission);
      await scheduleClassReminders(currentAdmission);
    } catch { setSubjects([]); setAdmission(null); }
    finally { setIsLoading(false); setIsRefreshing(false); }
  }

  async function handleAddSubject() {
    const code = subjectCode.trim();
    if (!/^\d{6}$/.test(code)) {
      Alert.alert("6-digit code required", "Enter the personal 6-digit code shown in your admission.");
      return;
    }

    try {
      const enrollment = await enrollInCourse(code);
      const subject = {
        id: enrollment.id,
        code: enrollment.courseCode,
        subjectId: enrollment.subject?.id,
        title: enrollment.subject?.title,
        course: enrollment.subject?.section.course,
        sectionCode: enrollment.subject?.section.code,
        dayOfWeek: enrollment.subject?.dayOfWeek,
        startTime: enrollment.subject?.startTime,
        endTime: enrollment.subject?.endTime,
      };
      setSubjects((current) => [subject, ...current]);
      setSubjectCode("");
      setIsAddModalVisible(false);
    } catch (error) {
      Alert.alert("Could not enroll", error instanceof Error ? error.message : "Please try again.");
    }
  }

  useEffect(() => {
    if (activeClassroomTab !== "People" || !selectedSubject?.subjectId) {
      setClassPeople([]);
      setIsLoadingPeople(false);
      setPeopleError(null);
      return;
    }

    let isCurrentRequest = true;
    setIsLoadingPeople(true);
    setPeopleError(null);
    void fetchSubjectPeople(selectedSubject.subjectId)
      .then((people) => {
        if (isCurrentRequest) setClassPeople(people);
      })
      .catch((error: unknown) => {
        if (isCurrentRequest) {
          setPeopleError(error instanceof Error ? error.message : "Could not load class members.");
        }
      })
      .finally(() => {
        if (isCurrentRequest) setIsLoadingPeople(false);
      });

    return () => {
      isCurrentRequest = false;
    };
  }, [activeClassroomTab, selectedSubject?.subjectId]);

  function getClassTitle(subject: EnrolledSubject) {
    if (subject.title) return subject.title;
    return admission?.subjects?.find(
      (item) => item.subject.joinCode === subject.code || item.subject.code === subject.code
    )?.subject.title ?? "Enrolled subject";
  }

  function getClassSubtitle(subject?: EnrolledSubject) {
    if (subject?.course && subject.sectionCode) return `${subject.course} · ${subject.sectionCode}`;
    return admission?.section ? `${admission.section.course} · ${admission.section.code}` : "Enrolled subject";
  }

  function getClassSchedule(subject: EnrolledSubject) {
    const admissionSubject = admission?.subjects?.find(
      (item) => item.subject.joinCode === subject.code || item.subject.code === subject.code
    )?.subject;
    const dayOfWeek = subject.dayOfWeek ?? admissionSubject?.dayOfWeek;
    const startTime = subject.startTime ?? admissionSubject?.startTime;
    const endTime = subject.endTime ?? admissionSubject?.endTime;
    if (!dayOfWeek || !startTime || !endTime) return "Schedule pending";
    const day = ["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][dayOfWeek];
    return `${day} · ${startTime}-${endTime}`;
  }

  const filteredSubjects = subjects.filter((subject) => subject.code.toLowerCase().includes(searchQuery.trim().toLowerCase()));

  return (
    <View className="flex-1 bg-app-bg pt-14">
      <View className="px-4">
        <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-3xl font-bold text-app-text">Classroom</Text>
          <Text className="mt-1 text-sm text-app-muted-2">Your classes and course updates</Text>
        </View>
          {user?.role === "STUDENT" ? (
            <TouchableOpacity
              accessibilityLabel="Enroll in subject"
              accessibilityRole="button"
              className="h-11 w-11 items-center justify-center rounded-full bg-app-primary"
              onPress={() => setIsAddModalVisible(true)}
            >
              <Ionicons name="add" size={26} color="#FFFFFF" />
            </TouchableOpacity>
          ) : null}
        </View>
        {subjects.length > 0 ? <View className="mt-5 flex-row items-center rounded-xl border border-app-border bg-app-surface px-3">
          <Ionicons name="search-outline" size={19} color="#968D82" />
          <TextInput className="ml-2 flex-1 py-3 text-app-text" placeholder="Search your classes" placeholderTextColor="#968D82" value={searchQuery} onChangeText={setSearchQuery} />
        </View> : null}
      </View>

      <FlatList
        className="mt-5"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        data={filteredSubjects}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => void loadSubjects(true)} tintColor="#563B68" />}
        renderItem={({ item }) => (
          <TouchableOpacity className="mb-4 overflow-hidden rounded-2xl border border-app-border bg-app-surface" onPress={() => { setSelectedSubject(item); setActiveClassroomTab("Stream"); }}>
            <View className="h-24 justify-end p-4" style={{ backgroundColor: bannerColors[subjects.findIndex((subject) => subject.id === item.id) % bannerColors.length] }}>
              <Text className="text-xl font-bold text-white" numberOfLines={1}>{getClassTitle(item)}</Text>
              <Text className="mt-1 text-sm text-blue-100">{getClassSubtitle(item)} · {getClassSchedule(item)}</Text>
            </View>
            <View className="p-4"><View className="flex-row items-center justify-end"><Ionicons name="chevron-forward" size={19} color="#563B68" /></View><Text className="mt-2 text-sm text-app-muted-2">No upcoming work</Text></View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View className="mt-8 items-center rounded-2xl border border-app-border bg-app-surface p-6">
            <Ionicons name={isLoading ? "sync-outline" : "school-outline"} size={40} color="#563B68" />
            <Text className="mt-4 text-lg font-bold text-app-text">{isLoading ? "Loading classes..." : "No classes yet"}</Text>
            <Text className="mt-1 text-sm text-app-muted-2">
              {user?.role === "STUDENT" ? "Join a class with the + button to see it here." : "Subject enrollment is available for students."}
            </Text>
          </View>
        }
      />

      <Modal animationType="slide" visible={selectedSubject !== null} onRequestClose={() => setSelectedSubject(null)}>
        <View className="flex-1 bg-app-bg pt-14"><View className="flex-row items-center justify-between px-4 pb-4"><TouchableOpacity onPress={() => setSelectedSubject(null)}><Ionicons name="arrow-back" size={24} color="#563B68" /></TouchableOpacity><Text className="text-lg font-bold text-app-text">Classroom</Text><View className="w-6" /></View>
          {selectedSubject ? <><View className="mx-4 rounded-2xl p-5" style={{ backgroundColor: bannerColors[subjects.findIndex((subject) => subject.id === selectedSubject.id) % bannerColors.length] }}><Text className="text-2xl font-bold text-white">{getClassTitle(selectedSubject)}</Text><Text className="mt-2 text-blue-100">{getClassSubtitle(selectedSubject)} · {getClassSchedule(selectedSubject)}</Text></View>
            <View className="mt-4 flex-row border-b border-app-border px-4">{(["Stream", "Classwork", "People"] as ClassroomTab[]).map((tab) => <TouchableOpacity key={tab} className={`mr-6 pb-3 ${activeClassroomTab === tab ? "border-b-2 border-app-primary" : ""}`} onPress={() => setActiveClassroomTab(tab)}><Text className={`font-semibold ${activeClassroomTab === tab ? "text-app-primary-light" : "text-app-muted-2"}`}>{tab}</Text></TouchableOpacity>)}</View>
            {activeClassroomTab === "People" ? (
              <View className="mx-4 mt-5 rounded-2xl border border-app-border bg-app-surface p-5">
                <Text className="text-base font-bold text-app-text">Class members</Text>
                {isLoadingPeople ? (
                  <Text className="mt-3 text-sm text-app-muted-2">Loading classmates...</Text>
                ) : peopleError ? (
                  <Text className="mt-3 text-sm text-red-600">{peopleError}</Text>
                ) : classPeople.length > 0 ? (
                  classPeople.map((person) => (
                    <View key={person.id} className="mt-4 flex-row items-center">
                      <View className="h-10 w-10 items-center justify-center rounded-full bg-app-bg">
                        <Ionicons name="person-outline" size={20} color="#563B68" />
                      </View>
                      <Text className="ml-3 font-medium text-app-text">
                        {person.username}{person.id === user?.id ? " (You)" : ""}
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text className="mt-3 text-sm text-app-muted-2">
                    {selectedSubject.subjectId
                      ? "No students are enrolled in this subject yet."
                      : "The enrolled subject details are unavailable, so class members cannot be loaded."}
                  </Text>
                )}
              </View>
            ) : (
              <View className="mx-4 mt-5 rounded-2xl border border-app-border bg-app-surface p-5">
                <Ionicons name={activeClassroomTab === "Stream" ? "chatbubble-ellipses-outline" : "document-text-outline"} size={30} color="#563B68" />
                <Text className="mt-3 text-base font-bold text-app-text">
                  {activeClassroomTab === "Stream" ? "No announcements yet" : "No classwork yet"}
                </Text>
                <Text className="mt-2 text-sm leading-5 text-app-muted-2">Your teacher has not posted anything here yet.</Text>
              </View>
            )}
          </> : null}
        </View>
      </Modal>

      <Modal animationType="fade" transparent visible={isAddModalVisible} onRequestClose={() => setIsAddModalVisible(false)}>
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View className="flex-1 justify-end bg-black/60">
            <View className="rounded-t-3xl bg-app-surface p-5">
              <View className="flex-row items-center justify-between">
                <Text className="text-lg font-bold text-app-text">Enroll in a subject</Text>
                <TouchableOpacity accessibilityLabel="Close" onPress={() => setIsAddModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
              <TextInput
                autoFocus
                keyboardType="number-pad"
                maxLength={6}
                className="mt-5 rounded-xl border border-app-border bg-app-bg px-4 py-3 text-app-text"
                placeholder="Your personal 6-digit code"
                placeholderTextColor="#968D82"
                value={subjectCode}
                onChangeText={setSubjectCode}
                onSubmitEditing={handleAddSubject}
                returnKeyType="done"
              />
              <TouchableOpacity className="mt-4 items-center rounded-xl bg-app-primary py-3" onPress={handleAddSubject}>
                <Text className="font-bold text-white">Enroll</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}