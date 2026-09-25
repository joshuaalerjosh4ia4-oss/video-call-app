import { Text, TouchableOpacity, View } from "react-native";

interface Props {
  message: string | null;
  onDismiss?: () => void;
}

export default function ErrorMessage({ message, onDismiss }: Props) {
  if (!message) return null;

  return (
    <View className="my-2 flex-row items-center justify-between rounded-lg bg-app-danger-bg p-3">
      <Text className="flex-1 text-[13px] text-app-danger-text">{message}</Text>
      {onDismiss && (
        <TouchableOpacity onPress={onDismiss}>
          <Text className="ml-3 text-xs font-bold text-app-danger-light">Dismiss</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
