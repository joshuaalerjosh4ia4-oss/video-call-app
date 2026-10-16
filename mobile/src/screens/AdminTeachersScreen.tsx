import { useState } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Alert, Text, TextInput, TouchableOpacity, View } from "react-native";
import { createTeacher } from "../api/teachers";
import { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "AdminTeachers">;

export default function AdminTeachersScreen({ navigation }: Props) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleCreateTeacher() {
    if (username.trim().length < 3 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      Alert.alert("Check teacher details", "Enter a username with at least 3 characters and a valid email.");
      return;
    }

    setIsSubmitting(true);
    try {
      const teacher = await createTeacher({ username: username.trim(), email: email.trim() });
      Alert.alert(
        "Teacher account created",
        `A temporary password was emailed to ${teacher.email}. The teacher must change it after signing in.`,
        [{ text: "Done", onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert("Could not create teacher", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View className="flex-1 bg-app-bg px-4 pt-14">
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text className="text-app-primary-light">Back</Text>
      </TouchableOpacity>
      <Text className="mt-5 text-2xl font-bold text-app-text">Create Teacher Account</Text>
      <Text className="mt-2 text-sm leading-5 text-app-muted-2">
        A one-time temporary password will be sent by Gmail. The teacher must change it at first sign-in.
      </Text>
      <TextInput
        autoCapitalize="none"
        className="mt-6 rounded-xl bg-app-surface px-4 py-3 text-app-text"
        placeholder="Teacher username"
        placeholderTextColor="#968D82"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        autoCapitalize="none"
        keyboardType="email-address"
        className="mt-3 rounded-xl bg-app-surface px-4 py-3 text-app-text"
        placeholder="Teacher email"
        placeholderTextColor="#968D82"
        value={email}
        onChangeText={setEmail}
      />
      <TouchableOpacity
        disabled={isSubmitting}
        className="mt-5 items-center rounded-xl bg-app-primary py-3"
        onPress={() => void handleCreateTeacher()}
      >
        <Text className="font-bold text-white">{isSubmitting ? "Creating..." : "Create and email access"}</Text>
      </TouchableOpacity>
    </View>
  );
}
