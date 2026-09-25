import { useEffect } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ActivityIndicator, Image, Text, View } from "react-native";
import { RootStackParamList } from "../navigation/types";
import { useAuthContext } from "../context/AuthContext";

type Props = NativeStackScreenProps<RootStackParamList, "Splash">;

export default function SplashScreen({ navigation }: Props) {
  const { user, isLoading } = useAuthContext();

  useEffect(() => {
    if (isLoading) return;
    navigation.reset({ index: 0, routes: [{ name: user ? "Main" : "Login" }] });
  }, [isLoading, user, navigation]);

  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Image accessibilityLabel="MyClaSSes logo" className="h-52 w-72" resizeMode="contain" source={require("../../assets/Logosplash.png")} />
      <View className="absolute bottom-20 items-center">
        <ActivityIndicator size="large" color="#563B68" />
        <Text className="mt-3 text-sm text-slate-600">Checking your session...</Text>
      </View>
    </View>
  );
}
