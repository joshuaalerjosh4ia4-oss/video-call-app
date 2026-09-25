// React Native types are provided by the mobile project's dependency setup.
import { Text, TouchableOpacity, View } from "react-native";

interface Props {
  isMuted: boolean;
  isCameraEnabled: boolean;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onSwitchCamera: () => void;
  onEndCall: () => void;
}

export default function CallControls({
  isMuted,
  isCameraEnabled,
  onToggleMute,
  onToggleCamera,
  onSwitchCamera,
  onEndCall,
}: Props) {
  return (
    <View className="flex-row items-center justify-around bg-[rgba(17,24,39,0.9)] px-3 py-4">
      <ControlButton label={isMuted ? "Unmute" : "Mute"} active={isMuted} onPress={onToggleMute} />
      <ControlButton
        label={isCameraEnabled ? "Camera Off" : "Camera On"}
        active={!isCameraEnabled}
        onPress={onToggleCamera}
      />
      <ControlButton label="Flip" onPress={onSwitchCamera} />
      <TouchableOpacity className="rounded-full bg-app-danger px-5 py-2.5" onPress={onEndCall}>
        <Text className="text-sm font-bold text-white">End</Text>
      </TouchableOpacity>
    </View>
  );
}

function ControlButton({ label, active = false, onPress }: { label: string; active?: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      className={`rounded-full px-3.5 py-2.5 ${active ? "bg-app-warning" : "bg-app-surface-alt"}`}
      onPress={onPress}
    >
      <Text className="text-[13px] font-semibold text-white">{label}</Text>
    </TouchableOpacity>
  );
}
