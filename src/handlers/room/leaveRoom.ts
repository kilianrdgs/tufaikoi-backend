import type { WebSocket } from "ws";
import { Player } from "../../domain/player";
import { RoomManager } from "../../domain/roomManager";
import sendServerMessage from "../../utils/sendServerMessage";
import broadcastRoomUpdate from "../../utils/broadcastRoomUpdate";

export default function handleLeaveRoom(
  player: Player,
  roomManager: RoomManager,
  sockets: Map<string, WebSocket>
) {
  const socket = sockets.get(player.id);
  if (!socket) return;

  if (!player.roomId) {
    return sendServerMessage(socket, {
      type: "ERROR",
      payload: { message: "Not in a room" },
    });
  }

  const room = roomManager.getRoom(player.roomId);

  if (!room) {
    return sendServerMessage(socket, {
      type: "ERROR",
      payload: { message: "Room not found" },
    });
  }

  room.removePlayer(player);

  broadcastRoomUpdate(room, sockets);

  roomManager.removeRoomIfEmpty(room);
}
