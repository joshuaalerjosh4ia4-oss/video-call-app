import { useEffect, useState } from "react";
import { AntDesign } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Modal, Text, TextInput, TouchableOpacity, View } from "react-native";
import { RootStackParamList } from "../navigation/types";
import { useAuthContext } from "../context/AuthContext";
import ErrorMessage from "../components/ErrorMessage";
import { useRoomContext } from "../context/RoomContext";
import { getSavedRooms, saveRoom } from "../utils/storage";
import { SavedRoom } from "../types/models";

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, "Main"> };

function timeToToday(value: string): Date | null {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  const meridiem = match[3].toUpperCase();
  if (hour < 1 || hour > 12 || minute > 59) return null;

  const date = new Date();
  date.setHours((hour % 12) + (meridiem === "PM" ? 12 : 0), minute, 0, 0);
  return date;
}

export default function HomeScreen({ navigation }: Props) {
  const { user } = useAuthContext();
  const { createRoom, joinRoom, error: roomError, clearError: clearRoomError } = useRoomContext();
  const [savedRooms, setSavedRooms] = useState<SavedRoom[]>([]);
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [meetingId, setMeetingId] = useState("");
  const [passcode, setPasscode] = useState("");
  const [startTime, setStartTime] = useState("7:30 PM");
  const [endTime, setEndTime] = useState("9:30 PM");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    void getSavedRooms().then(setSavedRooms);
  }, []);

  function openRoom(room: SavedRoom) {
    joinRoom(room.roomId, room.passcode);
    navigation.navigate("Room", { roomId: room.roomId, passcode: room.passcode });
  }

  function handleCreateRoom() {
    const startsAt = timeToToday(startTime);
    const endsAt = timeToToday(endTime);
    if (!startsAt || !endsAt || startsAt >= endsAt) {
      setFormError("Use valid times, and make sure the end time is after the start time.");
      return;
    }

    const room = createRoom(startsAt.toISOString(), endsAt.toISOString());
    navigation.navigate("Room", room);
  }

  async function handleSaveStudentRoom() {
    const roomId = meetingId.trim().toUpperCase();
    const code = passcode.trim();
    if (!roomId || !code) {
      setFormError("Enter the meeting ID and passcode.");
      return;
    }

    const room = { roomId, passcode: code };
    await saveRoom(room);
    setSavedRooms((rooms) => [room, ...rooms.filter((savedRoom) => savedRoom.roomId !== roomId)]);
    setMeetingId("");
    setPasscode("");
    setFormError(null);
    setShowStudentForm(false);
  }

  const isTeacher = user?.role === "TEACHER";

  return (
    <View className="flex-1 bg-app-bg px-4 pt-14">
      <View className="mb-5 flex-row items-center justify-between">
        <View>
          <Text className="text-2xl font-bold text-app-text">Rooms</Text>
          <Text className="mt-1 text-sm text-app-muted-2">{isTeacher ? "Host a scheduled class" : "Join your saved classes"}</Text>
        </View>
        {!isTeacher ? (
          <TouchableOpacity
            accessibilityLabel="Add room"
            className="h-12 w-12 items-center justify-center rounded-full bg-white"
            onPress={() => {
              setFormError(null);
              setShowStudentForm(true);
            }}
          >
            <AntDesign name="plus-circle" color="#000" size={24} />
          </TouchableOpacity>
        ) : null}
      </View>

      <ErrorMessage message={roomError ?? formError} onDismiss={() => { clearRoomError(); setFormError(null); }} />

      {isTeacher ? (
        <View className="rounded-2xl bg-app-surface p-5">
          <Text className="text-lg font-bold text-app-text">Create a class room</Text>
          <Text className="mt-1 text-sm text-app-muted-2">Students can join only during this time window.</Text>
          <Text className="mb-1 mt-5 text-xs font-semibold uppercase text-app-muted">Starts</Text>
          <TextInput
            value={startTime}
            onChangeText={setStartTime}
            placeholder="7:30 PM"
            placeholderTextColor="#64748B"
            className="rounded-xl bg-app-surface-alt px-3 py-3 text-app-text"
          />
          <Text className="mb-1 mt-3 text-xs font-semibold uppercase text-app-muted">Ends</Text>
          <TextInput
            value={endTime}
            onChangeText={setEndTime}
            placeholder="9:30 PM"
            placeholderTextColor="#64748B"
            className="rounded-xl bg-app-surface-alt px-3 py-3 text-app-text"
          />
          <TouchableOpacity className="mt-5 items-center rounded-xl bg-app-primary py-3" onPress={handleCreateRoom}>
            <Text className="font-bold text-white">Create room</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View>
          {savedRooms.length === 0 ? (
            <View className="rounded-2xl border border-dashed border-app-border bg-app-surface p-6">
              <Text className="text-center text-base font-bold text-app-text">No saved rooms</Text>
              <Text className="mt-1 text-center text-sm text-app-muted-2">Use the plus button to save a teacher's room.</Text>
            </View>
          ) : (
            savedRooms.map((room) => (
              <View key={room.roomId} className="mb-3 rounded-2xl bg-app-surface p-4">
                <Text className="text-base font-bold text-app-text">Room {room.roomId}</Text>
                <Text className="mt-1 text-sm text-app-muted-2">The teacher's joining window controls access.</Text>
                <TouchableOpacity className="mt-3 items-center rounded-xl bg-app-primary py-3" onPress={() => openRoom(room)}>
                  <Text className="font-bold text-white">Join room</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      )}

      <Modal visible={showStudentForm} transparent animationType="slide" onRequestClose={() => setShowStudentForm(false)}>
        <View className="flex-1 justify-end bg-black/60">
          <View className="rounded-t-3xl bg-app-surface px-5 pb-8 pt-5">
            <View className="mb-5 flex-row items-center justify-between">
              <Text className="text-xl font-bold text-app-text">Save a room</Text>
              <TouchableOpacity onPress={() => setShowStudentForm(false)}>
                <AntDesign name="close" color="#F9FAFB" size={22} />
              </TouchableOpacity>
            </View>
            <TextInput
              value={meetingId}
              onChangeText={setMeetingId}
              keyboardType="number-pad"
              placeholder="Meeting ID"
              placeholderTextColor="#64748B"
              className="mb-3 rounded-xl bg-app-surface-alt px-3 py-3 text-app-text"
            />
            <TextInput
              value={passcode}
              onChangeText={setPasscode}
              keyboardType="number-pad"
              secureTextEntry
              placeholder="Passcode"
              placeholderTextColor="#64748B"
              className="rounded-xl bg-app-surface-alt px-3 py-3 text-app-text"
            />
            <TouchableOpacity className="mt-5 items-center rounded-xl bg-app-primary py-3" onPress={handleSaveStudentRoom}>
              <Text className="font-bold text-white">Save room</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
