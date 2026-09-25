import { useEffect, useState } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { FlatList, RefreshControl, Text, TouchableOpacity, View } from "react-native";
import { RootStackParamList } from "../navigation/types";
import { MeetingRecord } from "../types/models";
import { getMeetingHistory } from "../utils/storage";
import LoadingScreen from "../components/LoadingScreen";
import ErrorMessage from "../components/ErrorMessage";

type Props = NativeStackScreenProps<RootStackParamList, "MeetingHistory">;

export default function CallHistoryScreen({ navigation }: Props) {
  const [meetings, setMeetings] = useState<MeetingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadHistory() {
    try {
      const history = await getMeetingHistory();
      setMeetings(history);
      setError(null);
    } catch {
      setError("Could not load meeting history.");
    }
  }

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      await loadHistory();
      setIsLoading(false);
    })();
  }, []);

  async function handleRefresh() {
    setIsRefreshing(true);
    await loadHistory();
    setIsRefreshing(false);
  }

  if (isLoading) {
    return <LoadingScreen message="Loading meeting history..." />;
  }

  return (
    <View className="flex-1 bg-app-bg">
      <View className="flex-row items-center justify-between px-4 pb-4 pt-14">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text className="w-10 text-sm font-semibold text-app-primary-light">Back</Text>
        </TouchableOpacity>
        <Text className="text-lg font-bold text-app-text">Meeting History</Text>
        <View className="w-10" />
      </View>

      <ErrorMessage message={error} onDismiss={() => setError(null)} />

      <FlatList
        data={meetings}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#563B68" />}
        renderItem={({ item }) => {
          return (
            <View className="border-b border-app-surface px-4 py-3.5">
              <Text className="text-[15px] font-semibold text-app-text">
                Meeting {item.roomId}
              </Text>
              <Text className="mt-1 text-xs text-app-muted">
                {item.type === "created" ? "Created" : "Joined"} • {new Date(item.createdAt).toLocaleString()}
              </Text>
            </View>
          );
        }}
        ListEmptyComponent={
          <View className="mt-12 items-center">
            <Text className="text-app-muted-2">No meetings yet.</Text>
          </View>
        }
      />
    </View>
  );
}
