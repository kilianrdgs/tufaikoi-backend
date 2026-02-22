import type { WebSocket } from "ws";
import type { Player } from "../../domain/player";
import type { RoomManager } from "../../domain/roomManager";
import type { ClientMessage } from "../../types";
import broadcastRoomUpdate from "../../utils/broadcastRoomUpdate";
import generateRoomCode from "../../utils/generateRoomCode";
import sendServerMessage from "../../utils/sendServerMessage";

type CreateRoomMessage = Extract<ClientMessage, { type: "CREATE_ROOM" }>;

export default function handleCreateRoom(
	message: CreateRoomMessage,
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

	const roomId = generateRoomCode();
	const room = roomManager.createRoom(roomId);

	if (!room) {
		return sendServerMessage(socket, {
			type: "ERROR",
			payload: { message: "Room creation failed" },
		});
	}

	player.username = message.payload.username;

	room.addPlayer(player);

	broadcastRoomUpdate(room, sockets);
}
