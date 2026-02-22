import type { WebSocket } from "ws";
import type { Player } from "../../domain/player";
import type { RoomManager } from "../../domain/roomManager";
import type { ClientMessage } from "../../types";
import broadcastRoomUpdate from "../../utils/broadcastRoomUpdate";
import sendServerMessage from "../../utils/sendServerMessage";

type JoinRoomMessage = Extract<ClientMessage, { type: "JOIN_ROOM" }>;

export default function handleJoinRoom(
	message: JoinRoomMessage,
	player: Player,
	roomManager: RoomManager,
	sockets: Map<string, WebSocket>,
) {
	const socket = sockets.get(player.id);
	if (!socket) return;

	if (player.roomId) {
		return sendServerMessage(socket, {
			type: "ERROR",
			payload: { message: "Already in a room" },
		});
	}

	const room = roomManager.getRoom(message.payload.roomId);

	if (!room) {
		return sendServerMessage(socket, {
			type: "ERROR",
			payload: { message: "Room does not exist" },
		});
	}

	player.username = message.payload.username;

	room.addPlayer(player);

	broadcastRoomUpdate(room, sockets);
}
