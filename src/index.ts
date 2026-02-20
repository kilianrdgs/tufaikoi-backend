import express from "express";
import { createServer } from "node:http";
import { WebSocketServer } from "ws";
import { RoomManager } from "./roomManager";
import { Player } from "./domain/player";
import crypto from "node:crypto";
import handleMessage from "./messageHandler";
const app = express();

app.get("/", (_req, res) => {
  res.send("Hello, World!");
});

const server = createServer(app);
const ws = new WebSocketServer({ server });

const roomManager = new RoomManager();

ws.on("connection", (socket) => {
  const player = new Player(crypto.randomUUID(), socket, "usertest");

  socket.on("message", (raw) => {
    handleMessage(raw, player, roomManager);
  });

  socket.on("close", () => {
    if (player.roomId) {
      const room = roomManager.getRoom(player.roomId);
      if (room) {
        room.removePlayer(player);
        roomManager.removeRoomIfEmpty(room);
      }
    }
  });
});

server.listen(3000, () => {
  console.log("Server is running on port 3000");
});
