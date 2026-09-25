import { ActivityIndicator, Text, View } from "react-native";

interface Props {
  message?: string;
}

export default function LoadingScreen({ message = "Loading..." }: Props) {
  return (
    <View className="flex-1 items-center justify-center bg-app-bg">
      <ActivityIndicator size="large" color="#563B68" />
      <Text className="mt-3 text-sm text-app-muted">{message}</Text>
    </View>
  );
}
