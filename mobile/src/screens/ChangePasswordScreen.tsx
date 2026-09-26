import { useState } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity } from "react-native";
import { useAuthContext } from "../context/AuthContext";
import ErrorMessage from "../components/ErrorMessage";
import { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "ChangePassword">;

export default function ChangePasswordScreen({ navigation }: Props) {
  const { changePassword, error, clearError } = useAuthContext();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleChangePassword() {
    clearError();
    setValidationError(null);
    if (newPassword.length < 12) {
      setValidationError("Password must be at least 12 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setValidationError("Passwords do not match");
      return;
    }

    setIsSubmitting(true);
    try {
      await changePassword(newPassword);
      navigation.replace("Main");
    } catch {
      // Error is surfaced through the auth context.
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 justify-center bg-app-bg px-6"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Text className="mb-2 text-center text-[26px] font-extrabold text-app-text">Change Your Password</Text>
      <Text className="mb-6 text-center text-sm text-app-muted">Your temporary password must be replaced to continue.</Text>
      <ErrorMessage
        message={validationError ?? error}
        onDismiss={() => {
          setValidationError(null);
          clearError();
        }}
      />
      <TextInput
        className="mb-3 rounded-[10px] bg-app-surface-alt px-4 py-3.5 text-[15px] text-app-text"
        placeholder="New password"
        placeholderTextColor="#968D82"
        secureTextEntry
        value={newPassword}
        onChangeText={setNewPassword}
      />
      <TextInput
        className="mb-3 rounded-[10px] bg-app-surface-alt px-4 py-3.5 text-[15px] text-app-text"
        placeholder="Confirm new password"
        placeholderTextColor="#968D82"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />
      <TouchableOpacity
        className="mt-3 items-center rounded-[10px] bg-app-primary py-3.5"
        onPress={handleChangePassword}
        disabled={isSubmitting}
      >
        <Text className="text-base font-bold text-white">{isSubmitting ? "Updating..." : "Change Password"}</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}