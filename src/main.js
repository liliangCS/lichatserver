import WebSocket, { WebSocketServer } from "ws";
import { PORT } from "./config.js";

const wss = new WebSocketServer({ port: PORT });

wss.on("connection", function connection(ws) {
  ws.on("error", console.error);

  ws.on("message", function message(data, isBinary) {
    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data, { binary: isBinary });
      }
    });
  });
});

wss.on("listening", () => {
  console.log(`服务启动于 ws:127.0.0.1:${PORT}`);
});
