import { useState } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity } from "react-native";
import { RootStackParamList } from "../navigation/types";
import { useAuthContext } from "../context/AuthContext";
import ErrorMessage from "../components/ErrorMessage";

type Props = NativeStackScreenProps<RootStackParamList, "Register">;

export default function RegisterScreen({ navigation }: Props) {
  const { register, logout, error, clearError } = useAuthContext();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validate(): string | null {
    if (username.trim().length < 3) return "Username must be at least 3 characters";
    if (!email.includes("@")) return "Please enter a valid email address";
    if (password.length < 6) return "Password must be at least 6 characters";
    if (password !== confirmPassword) return "Passwords do not match";
    return null;
  }

  async function handleCreateAccount() {
    clearError();
    const validationMessage = validate();
    setValidationError(validationMessage);
    if (validationMessage) return;

    setIsSubmitting(true);
    try {
      await register(username.trim(), email.trim().toLowerCase(), password);
      await logout();
      navigation.replace("Login", { message: "Registration successful. Please sign in." });
    } catch {
      // error surfaced via context's `error` field
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView className="flex-1 bg-app-bg" behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerClassName="flex-grow justify-center px-6 py-12" keyboardShouldPersistTaps="handled">
        <Text className="mb-6 text-center text-[26px] font-extrabold text-app-text">Create Account</Text>

        <ErrorMessage
          message={validationError ?? error}
          onDismiss={() => {
            setValidationError(null);
            clearError();
          }}
        />

        <TextInput
          className="mb-3 rounded-[10px] bg-app-surface-alt px-4 py-3.5 text-[15px] text-app-text"
          placeholder="Username"
          placeholderTextColor="#968D82"
          autoCapitalize="none"
          value={username}
          onChangeText={setUsername}
        />
        <TextInput
          className="mb-3 rounded-[10px] bg-app-surface-alt px-4 py-3.5 text-[15px] text-app-text"
          placeholder="Email"
          placeholderTextColor="#968D82"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          className="mb-3 rounded-[10px] bg-app-surface-alt px-4 py-3.5 text-[15px] text-app-text"
          placeholder="Password"
          placeholderTextColor="#968D82"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <TextInput
          className="mb-3 rounded-[10px] bg-app-surface-alt px-4 py-3.5 text-[15px] text-app-text"
          placeholder="Confirm Password"
          placeholderTextColor="#968D82"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />

        <TouchableOpacity
          className="mt-3 items-center rounded-[10px] bg-app-primary py-3.5"
          onPress={handleCreateAccount}
          disabled={isSubmitting}
        >
          <Text className="text-base font-bold text-white">{isSubmitting ? "Creating..." : "Create Account"}</Text>
        </TouchableOpacity>

        <TouchableOpacity className="mt-4 items-center" onPress={() => navigation.goBack()}>
          <Text className="text-sm font-semibold text-app-primary-light">Back to Sign In</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
