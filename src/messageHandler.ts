import type { RawData } from "ws";
import type { Player } from "./domain/player";
import handleCreateRoom from "./handlers/createRoom";
import handleJoinRoom from "./handlers/joinRoom";
import handleLeaveRoom from "./handlers/leaveRoom";
import handleStartGame from "./handlers/startGame";
import type { RoomManager } from "./roomManager";
import type { ClientMessage } from "./types";
import sendServerMessage from "./utils/sendServerMessage";

export default function handleMessage(
	raw: RawData,
	player: Player,
	roomManager: RoomManager,
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
			return handleCreateRoom(message, player, roomManager);
		}

		case "LEAVE_ROOM": {
			return handleLeaveRoom(player, roomManager);
		}

		case "JOIN_ROOM": {
			return handleJoinRoom(message, player, roomManager);
		}

		case "START_GAME": {
			return handleStartGame(player, roomManager);
		}
	}
}
