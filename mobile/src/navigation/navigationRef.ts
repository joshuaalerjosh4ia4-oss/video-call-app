import { createRef } from "react";
import { NavigationContainerRef } from "@react-navigation/native";
import { RootStackParamList } from "./types";

export const navigationRef = createRef<NavigationContainerRef<RootStackParamList>>();
let pendingRoute: keyof RootStackParamList | null = null;

export function navigate<RouteName extends keyof RootStackParamList>(name: RouteName): void {
  if (navigationRef.current?.isReady()) {
    navigationRef.current.navigate(name as never);
    return;
  }
  pendingRoute = name;
}

export function markNavigationReady(): void {
  if (!pendingRoute || !navigationRef.current?.isReady()) return;
  const route = pendingRoute;
  pendingRoute = null;
  navigationRef.current.navigate(route as never);
}