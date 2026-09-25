import { useEffect, useState } from "react";
import { Alert, FlatList, Text, TouchableOpacity, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { fetchAdminAdmissions, updateAdminAdmission } from "../api/admissions";
import { Admission } from "../types/models";
import { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "AdminAdmissions">;

export default function AdminAdmissionsScreen({ navigation }: Props) {
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  useEffect(() => { fetchAdminAdmissions().then(setAdmissions).catch(() => Alert.alert("Could not load admissions", "Please try again.")); }, []);
  async function update(admission: Admission, finalize: boolean) {
    try {
      const updated = await updateAdminAdmission(admission.id, finalize ? "PAID" : "UNPAID", finalize);
      setAdmissions((current) => current.map((item) => item.id === updated.id ? { ...item, ...updated } : item));
    } catch (error) { Alert.alert("Could not update admission", error instanceof Error ? error.message : "Please try again."); }
  }
  return <View className="flex-1 bg-app-bg px-4 pt-14"><TouchableOpacity onPress={() => navigation.goBack()}><Text className="text-app-primary-light">Back</Text></TouchableOpacity><View className="mt-5 flex-row items-center justify-between"><Text className="text-2xl font-bold text-app-text">Admission Review</Text><TouchableOpacity className="rounded-lg bg-app-primary px-3 py-2" onPress={() => navigation.navigate("AdminSectionCreate")}><Text className="font-bold text-white">Create Section</Text></TouchableOpacity></View><FlatList className="mt-5" data={admissions} keyExtractor={(item) => item.id} renderItem={({ item }) => <View className="mb-3 rounded-xl bg-app-surface p-4"><Text className="font-bold text-app-text">{item.student?.username} · {item.section.code}</Text><Text className="mt-1 text-xs text-app-primary-light">Payment reference: {item.id.slice(0, 8).toUpperCase()}</Text><Text className="mt-1 text-sm text-app-muted-2">{item.student?.email} · Total PHP {item.totalFees.toFixed(2)}</Text><Text className="mt-2 text-xs font-semibold text-app-primary-light">{item.status} · {item.paymentStatus}</Text>{item.paymentStatus !== "PAID" ? <TouchableOpacity className="mt-3 rounded-lg bg-app-surface-alt p-3" onPress={() => update(item, false)}><Text className="text-center font-bold text-app-text">Mark Paid</Text></TouchableOpacity> : null}<TouchableOpacity disabled={item.paymentStatus !== "PAID" || item.status === "FINALIZED"} className="mt-2 rounded-lg bg-app-primary p-3" onPress={() => update(item, true)}><Text className="text-center font-bold text-white">{item.status === "FINALIZED" ? "Codes Sent" : "Finalize & Send Codes"}</Text></TouchableOpacity></View>} ListEmptyComponent={<Text className="text-app-muted-2">No admission applications.</Text>} /></View>;
}
