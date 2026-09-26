import { useState } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { RootStackParamList } from "../navigation/types";
import { useAuthContext } from "../context/AuthContext";
import ErrorMessage from "../components/ErrorMessage";
import { resendVerificationRequest, verifyEmailRequest } from "../api/auth";
import { ApiRequestError } from "../api/client";

type Props = NativeStackScreenProps<RootStackParamList, "Register">;

export default function RegisterScreen({ navigation }: Props) {
  const { register, error, clearError } = useAuthContext();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mobilePhone, setMobilePhone] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState<"FEMALE" | "MALE" | "OTHER" | null>(null);
  const [address, setAddress] = useState({
    blk: "",
    lot: "",
    street: "",
    villagePurok: "",
    barangay: "",
    municipality: "",
    region: "",
  });
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [verificationSent, setVerificationSent] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validate(): string | null {
    if (username.trim().length < 3) return "Username must be at least 3 characters";
    if (!email.includes("@")) return "Please enter a valid email address";
    if (password.length < 12) return "Password must be at least 12 characters";
    if (password !== confirmPassword) return "Passwords do not match";
    if (!/^9\d{9}$/.test(mobilePhone.trim())) return "Enter a 10-digit mobile number starting with 9";
    if (!/^\d+$/.test(age) || Number(age) < 1 || Number(age) > 120) return "Enter an age between 1 and 120";
    if (!sex) return "Please select your sex";
    if (!address.barangay.trim() || !address.municipality.trim() || !address.region.trim()) {
      return "Barangay, municipality, and region are required";
    }
    return null;
  }

  function updateAddress(field: keyof typeof address, value: string) {
    setAddress((current) => ({ ...current, [field]: value }));
  }

  async function handleCreateAccount() {
    clearError();
    const validationMessage = validate();
    setValidationError(validationMessage);
    if (validationMessage) return;

    setIsSubmitting(true);
    try {
      await register({
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password,
        mobilePhone: mobilePhone.trim(),
        age: Number(age),
        sex: sex!,
        ...address,
        barangay: address.barangay.trim(),
        municipality: address.municipality.trim(),
        region: address.region.trim(),
      });
      setVerificationSent(true);
    } catch {
      // error surfaced via context's `error` field
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVerifyEmail() {
    setLocalError(null);
    if (!/^\d{6}$/.test(verificationCode)) {
      setLocalError("Enter the 6-digit code sent to your email");
      return;
    }
    setIsVerifying(true);
    try {
      await verifyEmailRequest({ email: email.trim().toLowerCase(), code: verificationCode });
      navigation.replace("Login", { message: "Email verified. You can now sign in." });
    } catch (err) {
      setLocalError(err instanceof ApiRequestError ? err.message : "Unable to verify your email. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleResendCode() {
    setLocalError(null);
    try {
      await resendVerificationRequest({ email: email.trim().toLowerCase() });
      setLocalError("A new verification code has been sent if the account is awaiting verification.");
    } catch (err) {
      setLocalError(err instanceof ApiRequestError ? err.message : "Unable to resend the code. Please try again.");
    }
  }

  return (
    <KeyboardAvoidingView className="flex-1 bg-app-bg" behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerClassName="flex-grow justify-center px-6 py-12" keyboardShouldPersistTaps="handled">
        <Text className="mb-6 text-center text-[26px] font-extrabold text-app-text">
          {verificationSent ? "Verify Your Email" : "Create Account"}
        </Text>

        <ErrorMessage
          message={localError ?? validationError ?? error}
          onDismiss={() => {
            setLocalError(null);
            setValidationError(null);
            clearError();
          }}
        />

        {verificationSent ? (
          <>
            <Text className="mb-4 text-center text-sm text-app-muted">
              Enter the 6-digit code sent to {email.trim().toLowerCase()}.
            </Text>
            <TextInput
              className="mb-3 rounded-[10px] bg-app-surface-alt px-4 py-3.5 text-center text-[20px] tracking-[6px] text-app-text"
              placeholder="000000"
              placeholderTextColor="#968D82"
              keyboardType="number-pad"
              maxLength={6}
              value={verificationCode}
              onChangeText={setVerificationCode}
            />
            <TouchableOpacity
              className="mt-3 items-center rounded-[10px] bg-app-primary py-3.5"
              onPress={handleVerifyEmail}
              disabled={isVerifying}
            >
              <Text className="text-base font-bold text-white">{isVerifying ? "Verifying..." : "Verify Email"}</Text>
            </TouchableOpacity>
            <TouchableOpacity className="mt-4 items-center" onPress={handleResendCode}>
              <Text className="text-sm font-semibold text-app-primary-light">Resend Code</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
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

        <TextInput
          className="mb-3 rounded-[10px] bg-app-surface-alt px-4 py-3.5 text-[15px] text-app-text"
          placeholder="Mobile Phone (e.g. 9525769801)"
          placeholderTextColor="#968D82"
          keyboardType="phone-pad"
          maxLength={10}
          value={mobilePhone}
          onChangeText={setMobilePhone}
        />
        <TextInput
          className="mb-3 rounded-[10px] bg-app-surface-alt px-4 py-3.5 text-[15px] text-app-text"
          placeholder="Age"
          placeholderTextColor="#968D82"
          keyboardType="number-pad"
          value={age}
          onChangeText={setAge}
        />
        <Text className="mb-2 mt-1 text-sm font-semibold text-app-text">Sex</Text>
        <View className="mb-4 flex-row gap-2">
          {(["FEMALE", "MALE", "OTHER"] as const).map((option) => (
            <Pressable
              key={option}
              accessibilityRole="radio"
              accessibilityState={{ selected: sex === option }}
              className={`flex-1 items-center rounded-[10px] border px-3 py-3 ${
                sex === option ? "border-app-primary bg-app-primary/10" : "border-app-surface-alt bg-app-surface-alt"
              }`}
              onPress={() => setSex(option)}
            >
              <Text className="text-sm font-semibold text-app-text">
                {option === "OTHER" ? "Other" : option === "FEMALE" ? "Female" : "Male"}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text className="mb-2 mt-1 text-sm font-semibold text-app-text">Address</Text>
        <TextInput
          className="mb-3 rounded-[10px] bg-app-surface-alt px-4 py-3.5 text-[15px] text-app-text"
          placeholder="Blk (optional)"
          placeholderTextColor="#968D82"
          value={address.blk}
          onChangeText={(value) => updateAddress("blk", value)}
        />
        <TextInput
          className="mb-3 rounded-[10px] bg-app-surface-alt px-4 py-3.5 text-[15px] text-app-text"
          placeholder="Lot (optional)"
          placeholderTextColor="#968D82"
          value={address.lot}
          onChangeText={(value) => updateAddress("lot", value)}
        />
        <TextInput
          className="mb-3 rounded-[10px] bg-app-surface-alt px-4 py-3.5 text-[15px] text-app-text"
          placeholder="Street (optional)"
          placeholderTextColor="#968D82"
          value={address.street}
          onChangeText={(value) => updateAddress("street", value)}
        />
        <TextInput
          className="mb-3 rounded-[10px] bg-app-surface-alt px-4 py-3.5 text-[15px] text-app-text"
          placeholder="Village / Purok (optional)"
          placeholderTextColor="#968D82"
          value={address.villagePurok}
          onChangeText={(value) => updateAddress("villagePurok", value)}
        />
        <TextInput
          className="mb-3 rounded-[10px] bg-app-surface-alt px-4 py-3.5 text-[15px] text-app-text"
          placeholder="Barangay"
          placeholderTextColor="#968D82"
          value={address.barangay}
          onChangeText={(value) => updateAddress("barangay", value)}
        />
        <TextInput
          className="mb-3 rounded-[10px] bg-app-surface-alt px-4 py-3.5 text-[15px] text-app-text"
          placeholder="Municipality / City"
          placeholderTextColor="#968D82"
          value={address.municipality}
          onChangeText={(value) => updateAddress("municipality", value)}
        />
        <TextInput
          className="mb-3 rounded-[10px] bg-app-surface-alt px-4 py-3.5 text-[15px] text-app-text"
          placeholder="Region"
          placeholderTextColor="#968D82"
          value={address.region}
          onChangeText={(value) => updateAddress("region", value)}
        />

        <TouchableOpacity
          className="mt-3 items-center rounded-[10px] bg-app-primary py-3.5"
          onPress={handleCreateAccount}
          disabled={isSubmitting}
        >
          <Text className="text-base font-bold text-white">{isSubmitting ? "Creating..." : "Create Account"}</Text>
        </TouchableOpacity>
          </>
        )}

        <TouchableOpacity className="mt-4 items-center" onPress={() => navigation.goBack()}>
          <Text className="text-sm font-semibold text-app-primary-light">Back to Sign In</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
