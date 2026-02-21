import type { Player } from "../domain/player";
import type { RoomManager } from "../roomManager";
import type { ClientMessage } from "../types";
import sendServerMessage from "../utils/sendServerMessage";

type JoinRoomMessage = Extract<ClientMessage, { type: "JOIN_ROOM" }>;

export default function handleJoinRoom(
	message: JoinRoomMessage,
	player: Player,
	roomManager: RoomManager,
) {
	//vérifie que le joueuer n'est pas deja dans une room
	if (player.roomId) {
		return sendServerMessage(player.socket, {
			type: "ERROR",
			payload: { message: "Already in a room" },
		});
	}

	//vérifie que la room existe
	const room = roomManager.getRoom(message.payload.roomId);

	if (!room) {
		return sendServerMessage(player.socket, {
			type: "ERROR",
			payload: { message: "Room does not exist" },
		});
	}

	//mettre a jour le username
	player.username = message.payload.username;

	try {
		room.addPlayer(player);
	} catch (error) {
		if (error instanceof Error) {
			return sendServerMessage(player.socket, {
				type: "ERROR",
				payload: { message: error.message },
			});
		}

		return sendServerMessage(player.socket, {
			type: "ERROR",
			payload: { message: "Unexpected error" },
		});
	}
}
