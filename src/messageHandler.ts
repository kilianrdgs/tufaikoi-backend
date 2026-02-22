import type { RawData, WebSocket } from "ws";
import type { Player } from "./domain/player";
import type { RoomManager } from "./domain/roomManager";
import handleCreateRoom from "./handlers/createRoom";
import handleJoinRoom from "./handlers/joinRoom";
import handleLeaveRoom from "./handlers/leaveRoom";
import handleStartGame from "./handlers/startGame";
import type { ClientMessage } from "./types";
import sendServerMessage from "./utils/sendServerMessage";
import { GameManager } from "./domain/gameManager";

export default function handleMessage(
  raw: RawData,
  player: Player,
  roomManager: RoomManager,
  gameManager: GameManager,
  sockets: Map<string, WebSocket>
) {
  const socket = sockets.get(player.id);
  if (!socket) {
    console.warn("Socket not found for player", player.id);
    return;
  }

  let message: ClientMessage;

  try {
    message = JSON.parse(raw.toString());
  } catch {
    return sendServerMessage(socket, {
      type: "ERROR",
      payload: { message: "Invalid JSON" },
    });
  }

  try {
    switch (message.type) {
      case "CREATE_ROOM": {
        return handleCreateRoom(message, player, roomManager, sockets);
      }

      case "LEAVE_ROOM": {
        return handleLeaveRoom(player, roomManager, sockets);
      }

      case "JOIN_ROOM": {
        return handleJoinRoom(message, player, roomManager, sockets);
      }

      case "START_GAME": {
        return handleStartGame(player, roomManager, gameManager, sockets);
      }
    }
  } catch (error) {
    console.error("Error handling message:", error);

    return sendServerMessage(socket, {
      type: "ERROR",
      payload: {
        message: error instanceof Error ? error.message : "Unexpected error",
      },
    });
  }
}
