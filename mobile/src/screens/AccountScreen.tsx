import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import { RootStackParamList } from "../navigation/types";
import { useAuthContext } from "../context/AuthContext";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Main">;
  onSelectSubjects: () => void;
};

const menuItems: { label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { label: "Subjects", icon: "book-outline" },
  { label: "Grade", icon: "school-outline" },
  { label: "Ledger", icon: "receipt-outline" },
  { label: "Enrollment / Admission", icon: "document-text-outline" },
];

export default function AccountScreen({ navigation, onSelectSubjects }: Props) {
  const { user, logout } = useAuthContext();

  async function handleLogout() {
    await logout();
    navigation.replace("Login", { message: "You have been logged out successfully." });
  }

  return (
    <View className="flex-1 bg-app-bg px-4 pt-14">
      <Text className="text-2xl font-bold text-app-text">Account</Text>
      <View className="mt-6 rounded-2xl bg-app-surface p-5">
        <Text className="text-xs font-semibold uppercase text-app-muted-2">Username</Text>
        <Text className="mt-1 text-lg font-bold text-app-text">{user?.username}</Text>
        <Text className="mt-1 text-sm text-app-muted-2">{user?.email}</Text>
      </View>
      <View className="mt-6 overflow-hidden rounded-2xl bg-app-surface">
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={item.label}
            accessibilityRole="button"
            className={`flex-row items-center px-4 py-4 ${index < menuItems.length - 1 ? "border-b border-app-border" : ""}`}
            onPress={() => {
              if (item.label === "Subjects") {
                onSelectSubjects();
              } else if (item.label === "Enrollment / Admission") {
                navigation.navigate(user?.role === "ADMIN" ? "AdminAdmissions" : "Enrollment");
              } else if (item.label === "Ledger") {
                navigation.navigate("Ledger");
              } else {
                Alert.alert(item.label, "This section is not available yet.");
              }
            }}
          >
            <Ionicons name={item.icon} size={21} color="#563B68" />
            <Text className="ml-3 flex-1 text-[15px] font-semibold text-app-text">{item.label}</Text>
            <Ionicons name="chevron-forward" size={18} color="#968D82" />
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity className="mt-4 flex-row items-center rounded-xl bg-app-danger-bg px-4 py-3" onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={21} color="#FEE2E2" />
        <Text className="ml-3 font-bold text-app-danger-text">Logout</Text>
      </TouchableOpacity>
    </View>
  );
}