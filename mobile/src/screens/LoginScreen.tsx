import { useState } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity } from "react-native";
import { RootStackParamList } from "../navigation/types";
import { useAuthContext } from "../context/AuthContext";
import ErrorMessage from "../components/ErrorMessage";

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

export default function LoginScreen({ navigation, route }: Props) {
  const { login, error, clearError } = useAuthContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSignIn() {
    setValidationError(null);
    clearError();

    if (!email.trim() || !password) {
      setValidationError("Please enter both email and password");
      return;
    }

    setIsSubmitting(true);
    try {
      const mustChangePassword = await login(email.trim().toLowerCase(), password);
      navigation.replace(mustChangePassword ? "ChangePassword" : "Main");
    } catch {
      // error is surfaced via context's `error` field
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 justify-center bg-app-bg px-6"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Text className="text-center text-[32px] font-extrabold text-app-text">MyClaSSes</Text>
      <Text className="mb-6 mt-2 text-center text-sm text-app-muted">Sign in to continue</Text>

      {route.params?.message ? (
        <Text className="mb-2 rounded-lg bg-green-900/40 p-3 text-center text-[13px] text-green-300">
          {route.params.message}
        </Text>
      ) : null}

      <ErrorMessage message={validationError ?? error} onDismiss={() => { setValidationError(null); clearError(); }} />

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

      <TouchableOpacity
        className="mt-3 items-center rounded-[10px] bg-app-primary py-3.5"
        onPress={handleSignIn}
        disabled={isSubmitting}
      >
        <Text className="text-base font-bold text-white">{isSubmitting ? "Signing in..." : "Sign In"}</Text>
      </TouchableOpacity>

      <TouchableOpacity className="mt-4 items-center" onPress={() => navigation.navigate("Register")}>
        <Text className="text-sm font-semibold text-app-primary-light">Create Account</Text>
      </TouchableOpacity>
      <TouchableOpacity className="mt-4 items-center" onPress={() => navigation.navigate("ForgotPassword")}>
        <Text className="text-sm font-semibold text-app-primary-light">Forgot Password?</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}
