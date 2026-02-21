import WebSocket from "ws";
import type { RoomState, ServerMessage } from "../types";
import type { Player } from "./player";

export class Room {
	public players = new Map<string, Player>();
	private state: RoomState = "WAITING";
	private hostId: string | null = null;

	constructor(public id: string) {}

	addPlayer(player: Player) {
		if (this.state !== "WAITING") {
			throw new Error("Room is locked");
		}

		if (this.players.has(player.id)) {
			throw new Error("Player already in room");
		}

		if (this.players.size === 0) {
			this.hostId = player.id;
		}

		this.players.set(player.id, player);
		player.roomId = this.id;

		this.notifyRoomUpdate();
	}

	removePlayer(player: Player) {
		if (!this.players.has(player.id))
			return console.log(`Player ${player.username} deleted`);

		this.players.delete(player.id);
		player.roomId = null;

		// attention futur bug si l'hote quitte la partie ça bloque toute la suite

		this.notifyRoomUpdate();
	}

	startGame(player: Player) {
		if (this.state !== "WAITING") {
			throw new Error("Invalid state transition");
		}

		//uniquement l'hote peut lancer la partie
		if (this.hostId !== player.id) {
			throw new Error("Only host can start the game");
		}

		// sécurité pour eviter de lancer tout seul
		if (this.players.size < 2) {
			throw new Error("not enough players");
		}

		this.state = "PLAYING";

		this.notifyRoomUpdate();
	}

	getPlayersDTO() {
		return Array.from(this.players.values()).map((player) => ({
			id: player.id,
			username: player.username,
		}));
	}

	broadcast(message: ServerMessage) {
		const data = JSON.stringify(message);

		for (const player of this.players.values()) {
			if (player.socket.readyState === WebSocket.OPEN) {
				console.log(`Sending message ${player.username}: ${data}`);
				player.socket.send(data);
			}
		}
	}

	private notifyRoomUpdate() {
		this.broadcast({
			type: "ROOM_UPDATE",
			payload: {
				roomId: this.id,
				hostId: this.hostId,
				players: this.getPlayersDTO(),
				game: {
					state: this.state,
				},
			},
		});
	}
}
