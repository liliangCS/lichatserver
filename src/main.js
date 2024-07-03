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
    if (msg.type == messageType.SOMEONE_ENTER_ROOM) {
      // 如果聊天室存在同名用户则进入失败
      if (userList.map((user) => user.username).includes(msg.sender)) {
        ws.send(JSON.stringify({ type: messageType.ENTER_ROOM_FAILED }));
        return;
      }

      // 进入成功
      ws.send(JSON.stringify({ type: messageType.ENTER_ROOM_SUCCESS, username: msg.sender }));

      userList.push({ username: msg.sender, ws });
      // 聊天室广播(包括自己)
      broadcast_each((user) => {
        user.ws.send(
          JSON.stringify({
            type: messageType.SOMEONE_ENTER_ROOM,
            username: msg.sender,
            userCount: userList.length,
            timeStr: new Date().toLocaleString()
          })
        );
      });

      console.log(`${new Date().toLocaleString()}: ${msg.sender}进入聊天室`);
    }

    // 有人离开聊天室
    else if (msg.type == messageType.SOMEONE_LEAVE_ROOM) {
      const index = userList.map((user) => user.username).indexOf(msg.sender);
      if (index >= 0) {
        // 聊天室广播(包括自己)
        broadcast_each((user) => {
          user.ws.send(
            JSON.stringify({
              type: messageType.SOMEONE_LEAVE_ROOM,
              username: msg.sender,
              userCount: userList.length - 1,
              timeStr: new Date().toLocaleString()
            })
          );
        });
        userList.splice(index, 1);
        console.log(`${new Date().toLocaleString()}: ${msg.sender}离开聊天室`);
      } else {
        console.log(`${new Date().toLocaleString()}: ${msg.sender}离开聊天室错误，聊天室查无此人`);
      }
    }

    // 有人发送消息
    else if (msg.type == messageType.SEND_PLAIN_TEXT || msg.type == messageType.SEND_RICH_TEXT) {
      const msgData = { ...msg, timeStr: new Date().toLocaleString() };
      // 聊天室广播(包括自己)
      broadcast_each((user) => {
        user.ws.send(JSON.stringify(msgData));
      });
    }
  });

  // 客户端关闭
  ws.on("close", () => {
    let closeUserIndex = -1;
    let closeUsername = "未定义";
    userList.forEach((user, index) => {
      if (user.ws === ws) {
        closeUserIndex = index;
        closeUsername = user.username;
      }
    });

    if (closeUserIndex >= 0) {
      userList.splice(closeUserIndex, 1);

      // 聊天室广播
      broadcast_each((user) => {
        user.ws.send(
          JSON.stringify({
            type: messageType.SOMEONE_LEAVE_ROOM,
            username: closeUsername,
            userCount: userList.length,
            timeStr: new Date().toLocaleString()
          })
        );
      });

      console.log(`${new Date().toLocaleString()}: ${closeUsername}离开聊天室`);
    }
  });
});

wss.on("listening", () => {
  console.log(`服务启动于 ws://127.0.0.1:${PORT}`);
});
