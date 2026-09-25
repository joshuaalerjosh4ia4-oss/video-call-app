import "react-native-gesture-handler";
import "./global.css";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import RootNavigator from "./src/navigation/RootNavigator";
import { AuthProvider } from "./src/context/AuthContext";
import { WebSocketProvider } from "./src/context/WebSocketContext";
import { RoomProvider } from "./src/context/RoomContext";

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <WebSocketProvider>
          <RoomProvider>
            <StatusBar style="light" />
            <RootNavigator />
          </RoomProvider>
        </WebSocketProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
