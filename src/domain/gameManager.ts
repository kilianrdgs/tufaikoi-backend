import { Game } from "./game";

export class GameManager {
	private games = new Map<string, Game>();

	createGame(
		roomId: string,
		players: { id: string; username: string }[],
		question: string,
		onPhaseChange?: () => void,
	): Game {
		if (this.games.has(roomId)) {
			throw new Error("Game already exists for this room");
		}

		const game = new Game(roomId, players, question, onPhaseChange);
		this.games.set(roomId, game);
		return game;
	}

	getGame(roomId: string): Game | undefined {
		return this.games.get(roomId);
	}

	removeGame(roomId: string): void {
		this.games.delete(roomId);
	}
}
