import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { webSocketService, WebSocketService } from "../services/WebSocketService";
import { useAuthContext } from "./AuthContext";

interface WebSocketContextValue {
  service: WebSocketService;
  isConnected: boolean;
  onlineUserIds: Set<string>;
}

const WebSocketContext = createContext<WebSocketContextValue | undefined>(undefined);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const { token, logout } = useAuthContext();
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const serviceRef = useRef(webSocketService);

  useEffect(() => {
    const service = serviceRef.current;

    if (!token) {
      service.disconnect();
      setIsConnected(false);
      setOnlineUserIds(new Set());
      return;
    }

    const unsubOpen = service.onOpen(() => setIsConnected(true));
    const unsubClose = service.onClose(() => setIsConnected(false));
    const unsubAuthFailure = service.onAuthFailure(() => {
      void logout();
    });
    const unsubMessage = service.onMessage((message) => {
      if (message.type === "user-online") {
        setOnlineUserIds((prev) => new Set(prev).add(message.userId));
      } else if (message.type === "user-offline") {
        setOnlineUserIds((prev) => {
          const next = new Set(prev);
          next.delete(message.userId);
          return next;
        });
      }
    });

    // Attach listeners before opening the socket so an early server message
    // cannot arrive before the call and presence handlers are registered.
    service.connect(token);

    return () => {
      unsubOpen();
      unsubClose();
      unsubAuthFailure();
      unsubMessage();
    };
  }, [logout, token]);

  useEffect(() => {
    const service = serviceRef.current;
    return () => {
      service.disconnect();
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ service: serviceRef.current, isConnected, onlineUserIds }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocketContext(): WebSocketContextValue {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocketContext must be used within a WebSocketProvider");
  }
  return context;
}
