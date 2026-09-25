import { Text, TouchableOpacity, View } from "react-native";
import { User } from "../types/models";

interface Props {
  user: User;
  onCall: (user: User) => void;
}

export default function UserListItem({ user, onCall }: Props) {
  return (
    <View className="flex-row items-center justify-between border-b border-app-surface px-4 py-3.5">
      <View className="flex-1">
        <Text className="text-base font-semibold text-app-text">{user.username}</Text>
        <View className="mt-1 flex-row items-center">
          <View className={`mr-1.5 h-2 w-2 rounded-full ${user.online ? "bg-app-success-dot" : "bg-app-muted-2"}`} />
          <Text className="text-xs text-app-muted">{user.online ? "Online" : "Offline"}</Text>
        </View>
      </View>
      <TouchableOpacity
        className={`rounded-full px-[18px] py-2 ${user.online ? "bg-app-primary" : "bg-app-surface-alt"}`}
        onPress={() => onCall(user)}
        disabled={!user.online}
      >
        <Text className="font-semibold text-white">Call</Text>
      </TouchableOpacity>
    </View>
  );
}
