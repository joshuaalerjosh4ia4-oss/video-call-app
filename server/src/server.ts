import http from "http";
import { createApp } from "./app";
import { attachWebSocketServer } from "./websocket/wsServer";
import { env } from "./config/env";

const app = createApp();
const httpServer = http.createServer(app);

attachWebSocketServer(httpServer);

function listen(port: number): void {
  const onError = (error: NodeJS.ErrnoException): void => {
    if (error.code !== "EADDRINUSE" || port >= 65535) {
      throw error;
    }

    const nextPort = port + 1;
    console.warn(`Port ${port} is already in use; trying port ${nextPort}.`);
    listen(nextPort);
  };

  httpServer.once("error", onError);
  httpServer.listen(port, () => {
    httpServer.off("error", onError);

    const address = httpServer.address();
    const listeningPort = typeof address === "object" && address ? address.port : port;
    console.log(`SimpleCall server listening on http://192.168.100.22:${listeningPort}`);
    console.log(`WebSocket signaling available at ws://192.168.100.22:${listeningPort}${env.wsPath}`);
  });
}

listen(env.port);
