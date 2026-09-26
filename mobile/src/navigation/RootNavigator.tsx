import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, Image, Text, View } from "react-native";
import { RootStackParamList } from "./types";
import { markNavigationReady, navigationRef } from "./navigationRef";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import ForgotPasswordScreen from "../screens/ForgotPasswordScreen";
import ChangePasswordScreen from "../screens/ChangePasswordScreen";
import HomeScreen from "../screens/HomeScreen";
import MeetingHistoryScreen from "../screens/CallHistoryScreen";
import RoomScreen from "../screens/RoomScreen";
import MainScreen from "../screens/MainScreen";
import EnrollmentScreen from "../screens/EnrollmentScreen";
import AdminAdmissionsScreen from "../screens/AdminAdmissionsScreen";
import AdminSectionCreateScreen from "../screens/AdminSectionCreateScreen";
import LedgerScreen from "../screens/LedgerScreen";
import { useAuthContext } from "../context/AuthContext";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { user, isLoading } = useAuthContext();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Image accessibilityLabel="MyClaSSes logo" className="h-52 w-72" resizeMode="contain" source={require("../../assets/Logosplash.png")} />
        <View className="absolute bottom-20 items-center">
          <ActivityIndicator size="large" color="#563B68" />
          <Text className="mt-3 text-sm text-slate-600">Checking your session...</Text>
        </View>
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef} onReady={markNavigationReady}>
      <Stack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName={user ? (user.mustChangePassword ? "ChangePassword" : "Main") : "Login"}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
        <Stack.Screen name="Main" component={MainScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Room" component={RoomScreen} />
        <Stack.Screen name="MeetingHistory" component={MeetingHistoryScreen} />
        <Stack.Screen name="Enrollment" component={EnrollmentScreen} />
        <Stack.Screen name="AdminAdmissions" component={AdminAdmissionsScreen} />
        <Stack.Screen name="AdminSectionCreate" component={AdminSectionCreateScreen} />
        <Stack.Screen name="Ledger" component={LedgerScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
