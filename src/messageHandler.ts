import type { RawData } from "ws";
import type { Player } from "./domain/player";
import type { RoomManager } from "./roomManager";
import type { ClientMessage } from "./types";
import generateRoomCode from "./utils/generateRoomCode";
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

			player.username = message.payload.username;

			room.addPlayer(player); //ajout du joueur dans l'objet room

			return sendServerMessage(player.socket, {
				type: "ROOM_CREATED",
				payload: { roomId, username: player.username },
			});
		}

		case "LEAVE_ROOM": {
			//verifie si le joueur est bien dans la room
			if (!player.roomId) {
				return sendServerMessage(player.socket, {
					type: "ERROR",
					payload: { message: "Not in a room" },
				});
			}

			const room = roomManager.getRoom(player.roomId);

			if (!room) {
				return sendServerMessage(player.socket, {
					type: "ERROR",
					payload: { message: "Room not found" },
				});
			}

			room.removePlayer(player); //supprime le joueur de la room

			roomManager.removeRoomIfEmpty(room); //supprime la room si elle est vide

			//message retour
			return sendServerMessage(player.socket, {
				type: "ROOM_LEFT",
			});
		}

		case "JOIN_ROOM": {
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

			room.addPlayer(player);

			//message retour
			return sendServerMessage(player.socket, {
				type: "ROOM_JOINED",
				payload: {
					roomId: room.id,
					username: player.username,
				},
			});
		}
	}
}

// handleMessage(raw, player, roomManager);
