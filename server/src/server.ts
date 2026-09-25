import http from "http";
import { createApp } from "./app";
import { attachWebSocketServer } from "./websocket/wsServer";
import { env } from "./config/env";

const app = createApp();
const httpServer = http.createServer(app);

attachWebSocketServer(httpServer);

httpServer.listen(env.port, () => {
  console.log(`SimpleCall server listening on http://192.168.100.22:${env.port}`);
  console.log(`WebSocket signaling available at ws://192.168.100.22:${env.port}${env.wsPath}`);
});
