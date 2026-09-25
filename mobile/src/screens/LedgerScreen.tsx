import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { fetchMyAdmission } from "../api/admissions";
import { Admission } from "../types/models";
import { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Ledger">;

export default function LedgerScreen({ navigation }: Props) {
  const [admission, setAdmission] = useState<Admission | null>(null);
  useEffect(() => { fetchMyAdmission().then(setAdmission).catch(() => Alert.alert("Could not load ledger", "Please try again.")); }, []);
  const paymentReference = admission?.id.slice(0, 8).toUpperCase();
  return <View className="flex-1 bg-app-bg"><View className="flex-row items-center justify-between px-4 pb-4 pt-14"><TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#563B68" /></TouchableOpacity><Text className="text-lg font-bold text-app-text">Ledger</Text><View className="w-6" /></View><ScrollView className="px-4" contentContainerStyle={{ paddingBottom: 32 }}>{admission ? <>
    <View className="rounded-xl border border-app-primary bg-app-surface p-4">
      <Text className="text-xs font-semibold uppercase text-app-muted-2">Payment reference</Text>
      <Text selectable className="mt-1 text-base font-bold text-app-primary-light">{paymentReference}</Text>
      <Text className="mt-2 text-xs text-app-muted-2">Use this 8-character reference on your payment receipt.</Text>
    </View>
    <View className="mt-4 rounded-xl bg-app-surface p-4"><Text className="font-bold text-app-text">{admission.section.course} · {admission.section.code}</Text><Text className="mt-1 text-sm text-app-muted-2">{admission.section.semester} · Year {admission.section.yearLevel}</Text><Text className="mt-3 text-xs font-semibold uppercase text-app-primary-light">Admission: {admission.status}</Text><Text className="mt-1 text-xs font-semibold uppercase text-app-primary-light">Payment: {admission.paymentStatus}</Text></View>
    <View className="mt-4 rounded-xl bg-app-surface p-4"><Text className="font-bold text-app-text">Fees</Text><Text className="mt-3 text-sm text-app-muted-2">Enrollment fee: PHP {admission.enrollmentFee.toFixed(2)}</Text><Text className="mt-1 text-sm text-app-muted-2">Subject fees: PHP {admission.subjectFees.toFixed(2)}</Text><Text className="mt-1 text-sm text-app-muted-2">Other fees: PHP {admission.otherFees.toFixed(2)}</Text><Text className="mt-3 text-lg font-bold text-app-text">Total: PHP {admission.totalFees.toFixed(2)}</Text></View>
    <View className="mt-4 rounded-xl bg-app-surface p-4"><Text className="font-bold text-app-text">Payment instructions</Text><Text className="mt-3 text-sm leading-5 text-app-muted-2">1. Send your payment through GCash or Maya to:</Text><Text selectable className="mt-2 text-lg font-bold text-app-primary-light">09525679903</Text><Text className="mt-2 text-sm leading-5 text-app-muted-2">2. Enter the 8-character payment reference above in the payment note or receipt reference field.</Text><Text className="mt-2 text-sm leading-5 text-app-muted-2">3. Pay the exact total shown in your ledger, then keep your receipt or transaction screenshot.</Text><Text className="mt-2 text-sm leading-5 text-app-muted-2">4. Submit the receipt to the admin for verification. Your admission cannot be finalized until payment is confirmed.</Text></View>
    <View className="mt-4 rounded-xl bg-app-surface p-4"><Text className="font-bold text-app-text">Subject schedule</Text>{(admission.subjects ?? []).map(({ subject }) => <View key={subject.id} className="mt-3 flex-row justify-between"><Text className="text-sm text-app-text">{subject.code}</Text><Text className="text-sm capitalize text-app-muted-2">{subject.schedule ?? "morning"}</Text></View>)}</View>
  </> : <Text className="mt-8 text-center text-app-muted-2">No admission ledger yet.</Text>}</ScrollView></View>;
}