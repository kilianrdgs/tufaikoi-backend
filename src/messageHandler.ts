import { Player } from "./domain/player";
import { RoomManager } from "./roomManager";
import { WebSocket } from "ws";
import { ClientMessage } from "./types";
import sendServerMessage from "./utils/sendServerMessage";
import generateRoomCode from "./utils/generateRoomCode";

export default function handleMessage(
  raw: any,
  player: Player,
  roomManager: RoomManager
) {
  let message: ClientMessage;

  try {
    message = JSON.parse(raw.toString());
  } catch {
    return sendServerMessage(player.socket, {
      type: "ERROR",
      payload: { message: "Invalid JSON" },
    });
  }

  switch (message.type) {
    case "CREATE_ROOM": {
      if (player.roomId) {
        return sendServerMessage(player.socket, {
          type: "ERROR",
          payload: { message: "Already in a room" },
        });
      }

      const roomId = generateRoomCode();
      const room = roomManager.createRoom(roomId); //création de l'objet room depuis roomManager

      if (!room) {
        return sendServerMessage(player.socket, {
          type: "ERROR",
          payload: { message: "Room creation failed" },
        });
      }

      room.addPlayer(player); //ajout du joueur dans l'objet room

      return sendServerMessage(player.socket, {
        type: "ROOM_CREATED",
        payload: { roomId },
      });
    }
  }
}

// handleMessage(raw, player, roomManager);
