import WebSocket, { WebSocketServer } from "ws";
import { PORT } from "./config.js";
import { messageType } from "./messageType.js";

const wss = new WebSocketServer({ port: PORT });

const userList = [];

// 聊天室广播
const broadcast_each = (callback) => {
  userList.forEach((user) => {
    callback(user);
  });
};

wss.on("connection", (ws) => {
  ws.on("message", (data) => {
    const msg = JSON.parse(data.toString());

    // 有人进入聊天室
    if (msg.type == messageType.ENTER_ROOM_MSG) {
      // 聊天室存在同名用户
      if (userList.map((user) => user.username).includes(msg.sender)) {
        ws.send(JSON.stringify({ type: messageType.ENTER_ROOM_MSG_FAILED }));
        return;
      }

      userList.push({ username: msg.sender, ws });
      console.log(`${new Date().toLocaleString()}: ${msg.sender}进入聊天室`);

      broadcast_each((user) => {
        user.ws.send(
          JSON.stringify({ type: messageType.ENTER_ROOM_MSG, username: msg.sender, userCount: userList.length })
        );
      });
    }

    // 有人离开聊天室
    if (msg.type == messageType.LEAVE_ROOM_MSG) {
      console.log(`${new Date().toLocaleString()}: ${msg.sender}离开聊天室`);
      const index = userList.map((user) => user.username).indexOf(msg.sender);
      if (index >= 0) {
        userList.splice(index, 1);
      }
      broadcast_each((user) => {
        user.ws.send(
          JSON.stringify({ type: messageType.LEAVE_ROOM_MSG, username: msg.sender, userCount: userList.length })
        );
      });
    }

    // 有人发送消息
    if (msg.type == messageType.PLAIN_TEXT_MSG || msg.type == messageType.RICH_TEXT_MSG) {
    }
  });
});

wss.on("listening", () => {
  console.log(`服务启动于 ws://127.0.0.1:${PORT}`);
});
