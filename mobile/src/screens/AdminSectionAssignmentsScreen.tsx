import { useEffect, useState } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { assignTeacherToSection, fetchCourseSections } from "../api/admissions";
import { fetchTeachers } from "../api/teachers";
import { CourseSection, TeacherAccount } from "../types/models";
import { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "AdminSectionAssignments">;

export default function AdminSectionAssignmentsScreen({ navigation }: Props) {
  const [sections, setSections] = useState<CourseSection[]>([]);
  const [teachers, setTeachers] = useState<TeacherAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingSectionId, setSavingSectionId] = useState<string | null>(null);

  useEffect(() => {
    void Promise.all([fetchCourseSections(), fetchTeachers()])
      .then(([courseSections, teacherAccounts]) => {
        setSections(courseSections);
        setTeachers(teacherAccounts);
      })
      .catch((error: unknown) => {
        Alert.alert("Could not load assignments", error instanceof Error ? error.message : "Please try again.");
      })
      .finally(() => setIsLoading(false));
  }, []);

  async function assignTeacher(section: CourseSection, teacherId: string | null) {
    setSavingSectionId(section.id);
    try {
      const updated = await assignTeacherToSection(section.id, teacherId);
      setSections((current) => current.map((item) => item.id === section.id
        ? {
            ...item,
            teacherId: updated.teacherId,
            teacher: updated.teacher,
          }
        : item
      ));
    } catch (error) {
      Alert.alert("Could not assign teacher", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setSavingSectionId(null);
    }
  }

  return (
    <View className="flex-1 bg-app-bg px-4 pt-14">
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text className="text-app-primary-light">Back</Text>
      </TouchableOpacity>
      <Text className="mt-5 text-2xl font-bold text-app-text">Assign Teachers</Text>
      <Text className="mt-2 text-sm leading-5 text-app-muted-2">
        Teachers can schedule rooms only for the sections assigned to them.
      </Text>
      {isLoading ? (
        <Text className="mt-6 text-app-muted-2">Loading course sections...</Text>
      ) : teachers.length === 0 ? (
        <Text className="mt-6 text-sm text-app-muted-2">Create a teacher account before assigning sections.</Text>
      ) : sections.length === 0 ? (
        <Text className="mt-6 text-sm text-app-muted-2">No course sections are available.</Text>
      ) : (
        <ScrollView className="mt-4" contentContainerStyle={{ paddingBottom: 28 }}>
          {sections.map((section) => (
            <View key={section.id} className="mb-4 rounded-2xl bg-app-surface p-4">
              <Text className="text-base font-bold text-app-text">{section.course} · {section.code}</Text>
              <Text className="mt-1 text-sm text-app-muted-2">
                {section.subjects.length} subjects · {section.teacher ? `Assigned to ${section.teacher.username}` : "No teacher assigned"}
              </Text>
              {teachers.map((teacher) => (
                <TouchableOpacity
                  key={teacher.id}
                  disabled={savingSectionId === section.id || section.teacherId === teacher.id}
                  className={`mt-3 rounded-xl px-3 py-3 ${section.teacherId === teacher.id ? "bg-app-primary" : "bg-app-surface-alt"}`}
                  onPress={() => void assignTeacher(section, teacher.id)}
                >
                  <Text className="font-semibold text-white">
                    {section.teacherId === teacher.id
                      ? `Assigned: ${teacher.username}`
                      : `Assign ${teacher.username}`}
                  </Text>
                </TouchableOpacity>
              ))}
              {section.teacherId ? (
                <TouchableOpacity
                  disabled={savingSectionId === section.id}
                  className="mt-3 items-center rounded-xl border border-app-border py-3"
                  onPress={() => void assignTeacher(section, null)}
                >
                  <Text className="font-semibold text-app-text">
                    {savingSectionId === section.id ? "Saving..." : "Unassign teacher"}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
