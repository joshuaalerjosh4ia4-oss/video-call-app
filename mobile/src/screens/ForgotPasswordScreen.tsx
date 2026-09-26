import { useState } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity } from "react-native";
import { ApiRequestError } from "../api/client";
import { forgotPasswordRequest } from "../api/auth";
import ErrorMessage from "../components/ErrorMessage";
import { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "ForgotPassword">;

export default function ForgotPasswordScreen({ navigation }: Props) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleRequestPassword() {
    setError(null);
    setMessage(null);
    if (!email.trim() || !email.includes("@")) {
      setError("Enter a valid email address");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await forgotPasswordRequest({ email: email.trim().toLowerCase() });
      setMessage(result.message);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Unable to request a temporary password.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 justify-center bg-app-bg px-6"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Text className="mb-2 text-center text-[26px] font-extrabold text-app-text">Forgot Password</Text>
      <Text className="mb-6 text-center text-sm text-app-muted">Enter your verified account email.</Text>
      <ErrorMessage message={error} onDismiss={() => setError(null)} />
      {message ? (
        <Text className="mb-3 rounded-lg bg-green-900/40 p-3 text-center text-[13px] text-green-300">{message}</Text>
      ) : null}
      <TextInput
        className="mb-3 rounded-[10px] bg-app-surface-alt px-4 py-3.5 text-[15px] text-app-text"
        placeholder="Email"
        placeholderTextColor="#968D82"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TouchableOpacity
        className="mt-3 items-center rounded-[10px] bg-app-primary py-3.5"
        onPress={handleRequestPassword}
        disabled={isSubmitting}
      >
        <Text className="text-base font-bold text-white">{isSubmitting ? "Sending..." : "Send Temporary Password"}</Text>
      </TouchableOpacity>
      <TouchableOpacity className="mt-4 items-center" onPress={() => navigation.goBack()}>
        <Text className="text-sm font-semibold text-app-primary-light">Back to Sign In</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}