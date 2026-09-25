import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import {
  FlatList,
  ScrollView,
  Share,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { RTCView } from "react-native-webrtc";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Entypo, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { RootStackParamList } from "../navigation/types";
import { useRoomContext } from "../context/RoomContext";
import LocalVideoView from "../components/LocalVideoView";
import ErrorMessage from "../components/ErrorMessage";

type Props = NativeStackScreenProps<RootStackParamList, "Room">;

export default function RoomScreen({ navigation, route }: Props) {
  const {
    roomId,
    localStream,
    remoteStreams,
    participants,
    participantCount,
    error,
    clearError,
    leaveRoom,
    cameraEnabled,
    microphoneEnabled,
    remoteMediaStates,
    toggleCamera,
    toggleMicrophone,
    messages,
    sendChat,
    sendReaction,
    screenSharing,
    toggleScreenSharing,
  } = useRoomContext();
  const insets = useSafeAreaInsets();
  const [chatText, setChatText] = useState("");
  const [showRoomActions, setShowRoomActions] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const currentRoomId = roomId ?? route.params.roomId;
  const tiles = participants.map((participant) => ({
    participant,
    stream: remoteStreams.get(participant.userId),
  }));

  return (
    <View
      className="flex-1 bg-app-bg px-4 pt-14"
      style={{ paddingBottom: Math.max(insets.bottom, 18) }}
    >
      <View className="mb-4 flex-row items-center justify-end">
        <TouchableOpacity
          className="rounded-xl bg-app-surface-alt px-3 py-2"
          onPress={() => setShowRoomActions((visible) => !visible)}
        >
          <Ionicons name="options" color="#fff" size={24} />
        </TouchableOpacity>
      </View>

      <ErrorMessage message={error} onDismiss={clearError} />

      <View className="mb-3 h-48 overflow-hidden rounded-2xl bg-black">
        <LocalVideoView stream={localStream} isCameraEnabled={cameraEnabled} />
        <Text className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-1 text-xs text-white">
          You
        </Text>
      </View>

      <FlatList
        data={tiles}
        numColumns={2}
        keyExtractor={({ participant }) => participant.userId}
        columnWrapperStyle={{ gap: 10 }}
        contentContainerStyle={{ gap: 10 }}
        renderItem={({ item }) => (
          <View className="h-36 flex-1 overflow-hidden rounded-2xl bg-black">
            {item.stream &&
            (remoteMediaStates.get(item.participant.userId)?.cameraEnabled ??
              true) ? (
              <RTCView
                streamURL={item.stream.toURL()}
                style={{ flex: 1 }}
                objectFit="cover"
              />
            ) : (
              <View className="flex-1 items-center justify-center bg-app-surface-alt">
                <Text className="text-2xl">📷</Text>
                <Text className="mt-1 text-xs text-app-muted-2">
                  Camera off
                </Text>
              </View>
            )}
            <Text className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-1 text-xs text-white">
              {item.participant.username}{" "}
              <Ionicons
                name={
                  (remoteMediaStates.get(item.participant.userId)
                    ?.microphoneEnabled ?? true)
                    ? "mic-outline"
                    : "mic-off-outline"
                }
                color="white"
                size={18}
              />
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <View className="items-center py-12">
            <Text className="text-center text-app-muted-2">
              Share the code to invite people to this room.
            </Text>
          </View>
        }
      />

      <View className="relative mt-2">
        <View className="flex-row gap-2">
          <TouchableOpacity
            className="flex-1 items-center rounded-xl bg-app-surface-alt px-2 py-3"
            onPress={toggleMicrophone}
          >
            <Ionicons
              name={microphoneEnabled ? "mic-outline" : "mic-off-outline"}
              color={microphoneEnabled ? "white" : "white"}
              size={24}
            />
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 items-center rounded-xl bg-app-surface-alt px-2 py-3"
            onPress={toggleCamera}
          >
            <Ionicons
              name={cameraEnabled ? "videocam-outline" : "videocam-off-outline"}
              color={cameraEnabled ? "white" : "white"}
              size={24}
            />
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 items-center rounded-xl px-2 py-3 ${screenSharing ? "bg-app-primary" : "bg-app-surface-alt"}`}
            onPress={() => void toggleScreenSharing()}
          >
            <MaterialIcons
              name={screenSharing ? "ios-share" : "ios-share"}
              color={screenSharing ? "white" : "white"}
              size={24}
            />
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 items-center rounded-xl px-2 py-3 ${showParticipants ? "bg-app-primary" : "bg-app-surface-alt"}`}
            onPress={() => setShowParticipants((visible) => !visible)}
          >
            <Ionicons name="people-outline" color="#fff" size={24} />
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 items-center rounded-xl px-2 py-3 ${showReactions ? "bg-app-primary" : "bg-app-surface-alt"}`}
            onPress={() => setShowReactions((visible) => !visible)}
          >
            <MaterialIcons name="add-reaction" color="#fff" size={24} />
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 items-center rounded-xl px-2 py-3 ${showChat ? "bg-app-primary" : "bg-app-surface-alt"}`}
            onPress={() => setShowChat((visible) => !visible)}
          >
            <Entypo name="chat" color="#fff" size={24} />
          </TouchableOpacity>
        </View>
        {showParticipants && (
          <View className="mt-2 rounded-2xl bg-app-surface p-3">
            <View className="mb-2 flex-row items-center justify-between">
              <Text className="font-bold text-white">Participants</Text>
              <Text className="text-xs text-app-muted-2">{participantCount}</Text>
            </View>
            {participants.length === 0 ? (
              <Text className="text-xs text-app-muted-2">
                No participants yet.
              </Text>
            ) : (
              participants.map((participant) => {
                const mediaState = remoteMediaStates.get(participant.userId);
                const microphoneEnabledForParticipant =
                  mediaState?.microphoneEnabled ?? true;
                const cameraEnabledForParticipant =
                  mediaState?.cameraEnabled ?? true;

                return (
                  <View
                    key={participant.userId}
                    className="mb-2 flex-row items-center justify-between rounded-xl bg-app-surface-alt px-3 py-2"
                  >
                    <View className="flex-row items-center gap-2">
                      <Ionicons
                        name="person-circle-outline"
                        color="#E2E8F0"
                        size={18}
                      />
                      <Text className="text-sm text-white">
                        {participant.username}
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-3">
                      <Ionicons
                        name={
                          microphoneEnabledForParticipant
                            ? "mic-outline"
                            : "mic-off-outline"
                        }
                        color={microphoneEnabledForParticipant ? "#E2E8F0" : "#F87171"}
                        size={16}
                      />
                      <Ionicons
                        name={
                          cameraEnabledForParticipant
                            ? "videocam-outline"
                            : "videocam-off-outline"
                        }
                        color={cameraEnabledForParticipant ? "#E2E8F0" : "#F87171"}
                        size={16}
                      />
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}
        {showChat && (
          <View
            className="absolute bottom-0 left-0 right-0 z-10 rounded-xl border border-app-border p-3"
            style={{ backgroundColor: "rgba(11, 18, 32, 0.92)" }}
          >
            <View className="mb-2 flex-row items-center justify-between">
              <Text className="font-bold text-white">Chat</Text>
              <TouchableOpacity
                onPress={() => setShowChat(false)}
                accessibilityLabel="Close chat"
              >
                <Text className="px-2 text-lg text-white">×</Text>
              </TouchableOpacity>
            </View>
            <ScrollView className="h-20" contentContainerStyle={{ gap: 2 }}>
              {messages.map((message) => (
                <Text key={message.id} className="text-xs text-white">
                  <Text className="font-bold text-app-primary-light">
                    {message.username}:{" "}
                  </Text>
                  {message.text}
                </Text>
              ))}
            </ScrollView>
            <View className="mt-2 flex-row gap-2">
              <TextInput
                value={chatText}
                onChangeText={setChatText}
                onSubmitEditing={() => {
                  sendChat(chatText);
                  setChatText("");
                }}
                returnKeyType="send"
                placeholder="Message"
                placeholderTextColor="#CBD5E1"
                className="flex-1 rounded-lg border border-app-border bg-black/30 px-2 py-1 text-white"
              />
              <TouchableOpacity
                className="justify-center rounded-lg bg-app-primary px-3"
                onPress={() => {
                  sendChat(chatText);
                  setChatText("");
                }}
              >
                <Text className="font-bold text-white">Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
      {showReactions && (
        <View className="mt-2 flex-row justify-center gap-4 rounded-xl bg-app-surface p-2">
          {["👍", "❤️", "😂", "👏", "🎉"].map((emoji) => (
            <TouchableOpacity key={emoji} onPress={() => sendReaction(emoji)}>
              <Text className="text-2xl">{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {showRoomActions && (
        <View className="mb-2 mt-4 rounded-2xl bg-app-surface p-3">
          <Text className="mb-2 text-sm font-bold text-app-text">
            Room details
          </Text>
          <Text className="text-xs text-app-muted-2">
            Meeting ID: {currentRoomId}
          </Text>
          <Text className="mt-1 text-xs text-app-muted-2">
            Passcode: {route.params.passcode}
          </Text>
          <Text className="mt-1 text-xs text-app-muted-2">
            Participants: {participantCount}
          </Text>
          <TouchableOpacity
            className="mt-3 items-center rounded-xl bg-app-primary py-3"
            onPress={() =>
              Share.share({
                message: `Join my video meeting\nMeeting ID: ${currentRoomId}\nPasscode: ${route.params.passcode}`,
              })
            }
          >
            <Text className="font-bold text-white">Share room</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="mt-2 items-center rounded-xl bg-app-danger py-3"
            onPress={() => {
              leaveRoom();
              navigation.replace("Main");
            }}
          >
            <Text className="font-bold text-white">Leave room</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
