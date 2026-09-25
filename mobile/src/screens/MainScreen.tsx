import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Text, TouchableOpacity, View } from "react-native";
import { RootStackParamList } from "../navigation/types";
import HomeScreen from "./HomeScreen";
import SubjectScreen from "./SubjectScreen";
import AccountScreen from "./AccountScreen";

type Props = NativeStackScreenProps<RootStackParamList, "Main">;
type Tab = "Subjects" | "Rooms" | "Account";

const tabs: { key: Tab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: "Subjects", label: "Subjects", icon: "book-outline" },
  { key: "Rooms", label: "Rooms", icon: "videocam-outline" },
  { key: "Account", label: "Account", icon: "person-outline" },
];

export default function MainScreen({ navigation }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("Rooms");

  return (
    <View className="flex-1 bg-app-bg">
      <View className="flex-1">
        {activeTab === "Subjects" ? <SubjectScreen /> : null}
        {activeTab === "Rooms" ? <HomeScreen navigation={navigation} /> : null}
        {activeTab === "Account" ? <AccountScreen navigation={navigation} onSelectSubjects={() => setActiveTab("Subjects")} /> : null}
      </View>
      <View className="flex-row border-t border-app-border bg-app-surface px-2 pb-2 pt-2">
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <TouchableOpacity
              key={tab.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              className="flex-1 items-center py-1"
              onPress={() => setActiveTab(tab.key)}
            >
              <Ionicons name={tab.icon} size={22} color={isActive ? "#563B68" : "#968D82"} />
              <Text className={`mt-1 text-xs font-semibold ${isActive ? "text-app-primary-light" : "text-app-muted-2"}`}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}