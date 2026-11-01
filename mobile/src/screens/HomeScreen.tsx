import { useEffect, useMemo, useState } from "react";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { RootStackParamList } from "../navigation/types";
import { useAuthContext } from "../context/AuthContext";
import ErrorMessage from "../components/ErrorMessage";
import { useRoomContext } from "../context/RoomContext";
import { CourseSection, ScheduledRoom } from "../types/models";
import { fetchCourseSections } from "../api/admissions";
import { fetchScheduledRooms, scheduleRoom } from "../api/rooms";

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, "Main"> };

function todayDateInput(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseLocalDateTime(dateValue: string, timeValue: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(timeValue)) return null;
  const [year, month, day] = dateValue.split("-").map(Number);
  const [hour, minute] = timeValue.split(":").map(Number);
  const date = new Date(year, month - 1, day, hour, minute, 0, 0);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) return null;
  return date;
}

export default function HomeScreen({ navigation }: Props) {
  const { user } = useAuthContext();
  const { joinRoom, error: roomError, clearError: clearRoomError } = useRoomContext();
  const [courseSections, setCourseSections] = useState<CourseSection[]>([]);
  const [scheduledRooms, setScheduledRooms] = useState<ScheduledRoom[]>([]);
  const [now, setNow] = useState(Date.now());
  const [scheduledDate, setScheduledDate] = useState(todayDateInput);
  const [startTime, setStartTime] = useState("19:30");
  const [endTime, setEndTime] = useState("21:30");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [isScheduling, setIsScheduling] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const userId = user?.id;
  const userRole = user?.role;

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!userId || !userRole) return;
    void Promise.all([
      fetchScheduledRooms(),
      userRole === "TEACHER" ? fetchCourseSections() : Promise.resolve([]),
    ]).then(([rooms, sections]) => {
      setScheduledRooms(rooms);
      setCourseSections(sections);
    }).catch((error: unknown) => {
      setFormError(error instanceof Error ? error.message : "Could not load scheduled rooms.");
    });
  }, [userId, userRole]);

  async function handleCreateRoom() {
    const startsAt = parseLocalDateTime(scheduledDate, startTime);
    const endsAt = parseLocalDateTime(scheduledDate, endTime);
    if (!selectedSubjectId) {
      setFormError("Choose the subject for this room.");
      return;
    }
    if (!startsAt || !endsAt || startsAt <= new Date() || endsAt <= startsAt) {
      setFormError("Enter a valid date and times in 24-hour format. The start must be in the future.");
      return;
    }

    setIsScheduling(true);
    setFormError(null);
    try {
      const room = await scheduleRoom({
        subjectId: selectedSubjectId,
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
      });
      setScheduledRooms((rooms) => [...rooms.filter(({ id }) => id !== room.id), room].sort(
        (first, second) => new Date(first.startsAt).getTime() - new Date(second.startsAt).getTime()
      ));
      setSelectedSubjectId("");
      Alert.alert("Room scheduled", "Students enrolled in this subject can join during the scheduled time.");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Could not schedule the room.");
    } finally {
      setIsScheduling(false);
    }
  }

  const isTeacher = user?.role === "TEACHER";
  const schedulableSubjects = useMemo(
    () => courseSections.flatMap((section) => section.subjects.map((subject) => ({
      ...subject,
      section,
    }))),
    [courseSections]
  );
  function joinScheduledRoom(room: ScheduledRoom) {
    joinRoom(room.id, room.passcode);
    navigation.navigate("Room", { roomId: room.id, passcode: room.passcode });
  }

  function roomJoinLabel(room: ScheduledRoom) {
    if (now < new Date(room.startsAt).getTime()) return "Opens at scheduled time";
    if (now > new Date(room.endsAt).getTime()) return "Meeting ended";
    return "Join room";
  }

  function renderScheduledRooms() {
    if (scheduledRooms.length === 0) {
      return (
        <View className="mt-5 rounded-2xl border border-dashed border-app-border bg-app-surface p-5">
          <Text className="text-center text-sm text-app-muted-2">
            {isTeacher ? "No upcoming scheduled rooms." : "No upcoming class rooms for your enrolled subjects."}
          </Text>
        </View>
      );
    }

    return scheduledRooms.map((room) => {
      const canJoin = now >= new Date(room.startsAt).getTime() &&
        now <= new Date(room.endsAt).getTime();
      return (
        <View key={room.id} className="mt-3 rounded-2xl bg-app-surface p-4">
          <Text className="text-base font-bold text-app-text">{room.subject.title}</Text>
          <Text className="mt-1 text-sm text-app-muted-2">
            {room.subject.section.course} · {room.subject.section.code} · {new Date(room.startsAt).toLocaleString()}
          </Text>
          <Text className="mt-2 text-xs text-app-muted-2">Meeting ID: {room.id} · Passcode: {room.passcode}</Text>
          <TouchableOpacity
            disabled={!canJoin}
            className={`mt-3 items-center rounded-xl py-3 ${canJoin ? "bg-app-primary" : "bg-app-surface-alt"}`}
            onPress={() => joinScheduledRoom(room)}
          >
            <Text className="font-bold text-white">{roomJoinLabel(room)}</Text>
          </TouchableOpacity>
        </View>
      );
    });
  }

  return (
    <View className="flex-1 bg-app-bg">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 56, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
      <View className="mb-5 flex-row items-center justify-between">
        <View>
          <Text className="text-2xl font-bold text-app-text">Rooms</Text>
          <Text className="mt-1 text-sm text-app-muted-2">{isTeacher ? "Host a scheduled class" : "Join your classes"}</Text>
        </View>
      </View>

      <ErrorMessage message={roomError ?? formError} onDismiss={() => { clearRoomError(); setFormError(null); }} />

      {isTeacher ? (
        <>
          <View className="rounded-2xl bg-app-surface p-5">
          <Text className="text-lg font-bold text-app-text">Create a class room</Text>
          <Text className="mt-1 text-sm text-app-muted-2">Schedule a one-time room for a subject. Enrolled students can join during its time window.</Text>
          <Text className="mb-1 mt-5 text-xs font-semibold uppercase text-app-muted">Subject</Text>
          <ScrollView className="max-h-36" nestedScrollEnabled>
            {schedulableSubjects.map((subject) => (
              <TouchableOpacity
                key={subject.id}
                className={`mb-2 rounded-xl px-3 py-3 ${selectedSubjectId === subject.id ? "bg-app-primary" : "bg-app-surface-alt"}`}
                onPress={() => setSelectedSubjectId(subject.id)}
              >
                <Text className="font-semibold text-white">{subject.title}</Text>
                <Text className="mt-1 text-xs text-blue-100">{subject.section.course} · {subject.section.code}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {schedulableSubjects.length === 0 ? (
            <Text className="mt-2 text-sm text-app-muted-2">No subjects are available yet. Ask an admin to create a course section.</Text>
          ) : null}
          <Text className="mb-1 mt-3 text-xs font-semibold uppercase text-app-muted">Date (YYYY-MM-DD)</Text>
          <TextInput
            value={scheduledDate}
            onChangeText={setScheduledDate}
            placeholder="2026-10-20"
            placeholderTextColor="#64748B"
            className="rounded-xl bg-app-surface-alt px-3 py-3 text-app-text"
          />
          <Text className="mb-1 mt-3 text-xs font-semibold uppercase text-app-muted">Starts (24-hour time)</Text>
          <TextInput
            value={startTime}
            onChangeText={setStartTime}
            placeholder="19:30"
            placeholderTextColor="#64748B"
            className="rounded-xl bg-app-surface-alt px-3 py-3 text-app-text"
          />
          <Text className="mb-1 mt-3 text-xs font-semibold uppercase text-app-muted">Ends (24-hour time)</Text>
          <TextInput
            value={endTime}
            onChangeText={setEndTime}
            placeholder="21:30"
            placeholderTextColor="#64748B"
            className="rounded-xl bg-app-surface-alt px-3 py-3 text-app-text"
          />
          <TouchableOpacity disabled={isScheduling || schedulableSubjects.length === 0} className="mt-5 items-center rounded-xl bg-app-primary py-3" onPress={() => void handleCreateRoom()}>
            <Text className="font-bold text-white">{isScheduling ? "Scheduling..." : "Schedule room"}</Text>
          </TouchableOpacity>
          </View>
          <Text className="mt-6 text-lg font-bold text-app-text">Your upcoming rooms</Text>
          {renderScheduledRooms()}
        </>
      ) : (
        <View>
          <Text className="text-lg font-bold text-app-text">Upcoming class rooms</Text>
          {renderScheduledRooms()}
        </View>
      )}
      </ScrollView>
    </View>
  );
}
