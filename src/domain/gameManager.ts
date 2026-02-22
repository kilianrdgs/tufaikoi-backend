import { Game } from "./game";

export class GameManager {
	private games = new Map<string, Game>();

	createGame(roomId: string, players: string[], question: string): Game {
		const game = new Game(roomId, players, question);
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
