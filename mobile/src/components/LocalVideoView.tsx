import { View } from "react-native";
import { RTCView, MediaStream } from "react-native-webrtc";

interface Props {
  stream: MediaStream | null;
  isCameraEnabled: boolean;
  floating?: boolean;
}

export default function LocalVideoView({ stream, isCameraEnabled, floating = false }: Props) {
  return (
    <View
      className={ 
        floating
          ? "h-[150px] w-[110px] overflow-hidden rounded-xl border-2 border-app-border bg-app-surface-alt"
          : "flex-1 bg-app-surface"
      }
    >
      {stream && isCameraEnabled ? (
        <RTCView streamURL={stream.toURL()} style={{ flex: 1 }} objectFit="cover" mirror zOrder={1} />
      ) : (
        <View className="flex-1 bg-app-surface-alt" />
      )}
    </View>
  );
}
