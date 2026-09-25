import { Text, View } from "react-native";
import { RTCView, MediaStream } from "react-native-webrtc";

interface Props {
  stream: MediaStream | null;
  peerUsername: string | null;
}

export default function RemoteVideoView({ stream, peerUsername }: Props) {
  if (!stream) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <Text className="text-base text-app-muted">
          {peerUsername ? `Waiting for ${peerUsername}'s video...` : "Waiting for video..."}
        </Text>
      </View>
    );
  }

  return <RTCView streamURL={stream.toURL()} style={{ flex: 1, backgroundColor: "#000000" }} objectFit="cover" zOrder={0} />;
}
