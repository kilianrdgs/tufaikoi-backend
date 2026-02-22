import type { WebSocket } from "ws";
import type { Player } from "../domain/player";
import type { RoomManager } from "../domain/roomManager";
import broadcastRoomUpdate from "../utils/broadcastRoomUpdate";
import sendServerMessage from "../utils/sendServerMessage";

export default function handleStartGame(
	player: Player,
	roomManager: RoomManager,
	sockets: Map<string, WebSocket>,
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

	room.startGame(player);

	broadcastRoomUpdate(room, sockets);
}
