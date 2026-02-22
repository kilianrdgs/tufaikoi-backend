import type { RoomState } from "../types";
import type { Player } from "./player";

export class Room {
	private players = new Map<string, Player>();
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
	}

	removePlayer(player: Player) {
		if (!this.players.has(player.id)) return;

		this.players.delete(player.id);
		player.roomId = null;

		if (this.hostId === player.id) {
			const next = this.players.values().next().value;
			this.hostId = next ? next.id : null;
		}
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

		this.state = "IN_GAME";
		return this.state;
	}

	getPlayersDTO() {
		return Array.from(this.players.values()).map((player) => ({
			id: player.id,
			username: player.username,
		}));
	}

	getState() {
		return this.state;
	}

	getHostId() {
		return this.hostId;
	}

	getPlayers() {
		return this.players.values();
	}

	isEmpty() {
		return this.players.size === 0;
	}
}
