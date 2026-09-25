import { useState } from "react";
import { Alert, Text, TextInput, TouchableOpacity, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { createCourseSection } from "../api/admissions";
import { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "AdminSectionCreate">;

export default function AdminSectionCreateScreen({ navigation }: Props) {
  const [course, setCourse] = useState("");
  const [code, setCode] = useState("");
  const [yearLevel, setYearLevel] = useState("1");
  const semester = "1st Semester";
  const [subjectText, setSubjectText] = useState("");

  function parseSubjects() {
    const dayNames: Record<string, number> = { mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, sun: 7 };
    return subjectText.split(",").map((value) => value.trim()).filter(Boolean).map((value) => {
      const [subjectCode, day, startTime, endTime] = value.split("|").map((part) => part.trim());
      return { code: subjectCode, title: subjectCode, units: 3, dayOfWeek: dayNames[day?.toLowerCase()], startTime, endTime };
    });
  }

  async function handleCreate() {
    const subjects = parseSubjects();
    if (!course.trim() || !code.trim() || !subjects.length || subjects.some((subject) => !subject.code || !subject.dayOfWeek || !/^([01]\d|2[0-3]):[0-5]\d$/.test(subject.startTime) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(subject.endTime) || subject.startTime >= subject.endTime)) { Alert.alert("Incomplete schedule", "Use CODE|DAY|START|END for every subject, for example MATH|Mon|08:00|10:00."); return; }
    try { await createCourseSection({ course: course.trim(), code: code.trim().toUpperCase(), yearLevel: Number(yearLevel), semester, subjects }); Alert.alert("Section created", "Students can now select this section."); navigation.goBack(); } catch (error) { Alert.alert("Could not create section", error instanceof Error ? error.message : "Please try again."); }
  }
  return <View className="flex-1 bg-app-bg px-4 pt-14"><TouchableOpacity onPress={() => navigation.goBack()}><Text className="text-app-primary-light">Back</Text></TouchableOpacity><Text className="mt-5 text-2xl font-bold text-app-text">Create Course Section</Text><TextInput className="mt-6 rounded-xl bg-app-surface px-4 py-3 text-app-text" placeholder="Course (e.g. BSIT)" placeholderTextColor="#968D82" value={course} onChangeText={setCourse} /><TextInput className="mt-3 rounded-xl bg-app-surface px-4 py-3 text-app-text" placeholder="Section code (e.g. BSIT-1A)" placeholderTextColor="#968D82" value={code} onChangeText={setCode} /><TextInput className="mt-3 rounded-xl bg-app-surface px-4 py-3 text-app-text" placeholder="Year level" placeholderTextColor="#968D82" keyboardType="number-pad" value={yearLevel} onChangeText={setYearLevel} /><Text className="mt-4 text-sm text-app-muted-2">Subject format: CODE|DAY|START|END, separated by commas</Text><TextInput className="mt-2 rounded-xl bg-app-surface px-4 py-3 text-app-text" placeholder="MATH|Mon|08:00|10:00, ENG|Wed|10:00|12:00" placeholderTextColor="#968D82" value={subjectText} onChangeText={setSubjectText} /><TouchableOpacity className="mt-5 items-center rounded-xl bg-app-primary py-3" onPress={handleCreate}><Text className="font-bold text-white">Create Section</Text></TouchableOpacity></View>;
}