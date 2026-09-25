import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { fetchCourseSections, fetchMyAdmission, submitAdmission } from "../api/admissions";
import { Admission, CourseSection } from "../types/models";
import { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Enrollment">;

export default function EnrollmentScreen({ navigation }: Props) {
  const [sections, setSections] = useState<CourseSection[]>([]);
  const [selectedSection, setSelectedSection] = useState<CourseSection | null>(null);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [schedules, setSchedules] = useState<Record<string, "morning" | "afternoon" | "evening">>({});
  const [admission, setAdmission] = useState<Admission | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([fetchCourseSections(), fetchMyAdmission()])
      .then(([availableSections, currentAdmission]) => {
        setSections(availableSections);
        setAdmission(currentAdmission);
        if (currentAdmission) {
          setSelectedSection(currentAdmission.section);
          setSelectedSubjects(currentAdmission.subjects?.map((item) => item.subject.id) ?? []);
          setSchedules(Object.fromEntries((currentAdmission.subjects ?? []).map((item) => [item.subject.id, item.schedule ?? "morning"])));
        }
      })
      .catch(() => Alert.alert("Could not load enrollment", "Please try again."));
  }, []);

  function chooseSection(section: CourseSection) {
    if (admission && admission.section.id !== section.id) return;
    setSelectedSection(section);
    setSelectedSubjects([]);
  }

  function toggleSubject(subjectId: string) {
    setSelectedSubjects((current) => {
      if (current.includes(subjectId)) return current.filter((id) => id !== subjectId);
      setSchedules((existing) => ({ ...existing, [subjectId]: "morning" }));
      return [...current, subjectId];
    });
  }

  function setSchedule(subjectId: string, schedule: "morning" | "afternoon" | "evening") {
    setSchedules((current) => ({ ...current, [subjectId]: schedule }));
  }

  async function handleSubmit() {
    if (!selectedSection || !selectedSubjects.length) {
      Alert.alert("Incomplete enrollment", "Choose one course section and at least one subject.");
      return;
    }
    setIsSubmitting(true);
    try {
      setAdmission(await submitAdmission(selectedSection.id, selectedSubjects.map((subjectId) => ({ subjectId, schedule: schedules[subjectId] ?? "morning" }))));
      Alert.alert("Enrollment submitted", "Your application was sent to the admin for payment verification.");
      navigation.navigate("Ledger");
    } catch (error) {
      Alert.alert("Could not submit", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View className="flex-1 bg-app-bg">
      <View className="flex-row items-center justify-between px-4 pb-4 pt-14">
        <TouchableOpacity accessibilityLabel="Go back" onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#563B68" /></TouchableOpacity>
        <Text className="text-lg font-bold text-app-text">Enrollment / Admission</Text><View className="w-6" />
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {admission ? <View className="mt-8 rounded-2xl bg-app-surface p-6">
          <View className="items-center">
            <Ionicons name="time-outline" size={42} color="#563B68" />
            <Text className="mt-4 text-xl font-bold text-app-text">Your admission is ongoing</Text>
            <Text className="mt-2 text-center text-sm text-app-muted-2">Your application is being reviewed by the admin. Course and subject selection is locked until the review is complete.</Text>
          </View>
          <View className="mt-5 border-t border-app-border pt-4">
            <Text className="font-bold text-app-text">{admission.section.course} · {admission.section.code}</Text>
            <Text className="mt-1 text-sm text-app-muted-2">{admission.section.semester} · Admission: {admission.status}</Text>
          </View>
          <TouchableOpacity className="mt-5 items-center rounded-xl bg-app-primary py-3" onPress={() => navigation.navigate("Ledger")}>
            <Text className="font-bold text-white">View Ledger</Text>
          </TouchableOpacity>
        </View> : <>
        <Text className="text-sm font-semibold uppercase text-app-muted-2">Choose one course and section</Text>
        {sections.map((section) => {
          const selected = selectedSection?.id === section.id;
          return <TouchableOpacity key={section.id} className={`mt-3 rounded-xl border p-4 ${selected ? "border-app-primary bg-app-primary" : "border-app-border bg-app-surface"}`} onPress={() => chooseSection(section)}>
            <Text className={`font-bold ${selected ? "text-white" : "text-app-text"}`}>{section.course} · {section.code}</Text>
            <Text className={`mt-1 text-sm ${selected ? "text-blue-100" : "text-app-muted-2"}`}>Year {section.yearLevel} · {section.semester}</Text>
          </TouchableOpacity>;
        })}
        {selectedSection ? <>
          <Text className="mt-6 text-sm font-semibold uppercase text-app-muted-2">Select subjects</Text>
          {selectedSection.subjects.map((subject) => {
            const selected = selectedSubjects.includes(subject.id);
            return <View key={subject.id} className="mt-3 rounded-xl bg-app-surface p-4">
              <TouchableOpacity className="flex-row items-center" onPress={() => toggleSubject(subject.id)}>
                <Ionicons name={selected ? "checkbox" : "square-outline"} size={24} color={selected ? "#563B68" : "#968D82"} />
                <View className="ml-3 flex-1"><Text className="font-bold text-app-text">{subject.code}</Text><Text className="mt-1 text-sm text-app-muted-2">{subject.title} · {subject.units} units</Text><Text className="mt-1 text-xs font-semibold text-app-primary">{["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][subject.dayOfWeek]} · {subject.startTime}-{subject.endTime}</Text></View>
              </TouchableOpacity>
              {selected ? <View className="mt-3 border-t border-app-border pt-3"><Text className="mb-2 text-xs font-semibold text-app-muted-2">Schedule for {subject.code}</Text><View className="flex-row">{["morning", "afternoon", "evening"].map((schedule) => <TouchableOpacity key={schedule} className={`mr-2 rounded px-2 py-1 ${schedules[subject.id] === schedule ? "bg-app-primary" : "bg-app-surface-alt"}`} onPress={() => setSchedule(subject.id, schedule as "morning" | "afternoon" | "evening")}><Text className="text-[10px] font-semibold text-white">{schedule}</Text></TouchableOpacity>)}</View></View> : null}
            </View>;
          })}
          <TouchableOpacity disabled={isSubmitting} className="mt-5 items-center rounded-xl bg-app-primary py-3" onPress={handleSubmit}><Text className="font-bold text-white">{isSubmitting ? "Submitting..." : "Proceed to Admin"}</Text></TouchableOpacity>
        </> : <Text className="mt-6 text-sm text-app-muted-2">No course sections are available yet. Please contact the admin.</Text>}
        </>}
      </ScrollView>
    </View>
  );
}
