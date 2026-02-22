import type { GamePhase, GameState } from "../types";

export class Game {
	private currentRound = 1;
	private readonly maxRounds = 3;
	private state: GameState = "PLAYING";
	private phase: GamePhase = "ANSWERING";
	private currentQuestion: string;

	constructor(
		readonly roomId: string,
		readonly players: string[],
		question: string,
	) {
		this.currentQuestion = question;
	}

	nextPhase() {
		if (this.state === "FINISHED") {
			throw new Error("Game is already finished");
		}

		if (this.phase === "ANSWERING") {
			this.phase = "VOTING";
			return;
		}

		if (this.phase === "VOTING") {
			this.phase = "RESULTS";
			return;
		}

		if (this.phase === "RESULTS") {
			if (this.currentRound >= this.maxRounds) {
				this.state = "FINISHED";
				return;
			}
			this.currentRound++;
			this.phase = "ANSWERING";
			return;
		}
	}

	getState() {
		return this.state;
	}

	getDTO() {
		return {
			state: this.state,
			phase: this.phase,
			currentRound: this.currentRound,
			maxRounds: this.maxRounds,
			question: this.currentQuestion,
		};
	}
}
