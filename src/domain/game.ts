import type { GamePhase, GameState } from "../types";

export class Game {
	private currentRound = 1;
	private readonly maxRounds = 3;
	private state: GameState = "PLAYING";
	private phase: GamePhase = "ANSWERING";
	private currentQuestion: string;
	private answers = new Map<string, string>();
	private votes = new Map<string, number>();

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
			this.answers.clear(); // vider les réponses (a ne pas vider pour un historique plus tard)
			this.votes.clear(); // vider les votes (a ne pas vider pour un historique plus tard)

			if (this.currentRound >= this.maxRounds) {
				this.state = "FINISHED";
				return;
			}
			this.currentRound++;
			this.phase = "ANSWERING";
			return;
		}
	}

	submitAnswer(playerId: string, answer: string) {
		if (this.phase !== "ANSWERING") {
			throw new Error("Not in answering phase");
		}

		if (this.answers.has(playerId)) {
			throw new Error("Answer already submitted");
		}

		this.answers.set(playerId, answer);
	}

	submitVote(playerId: string, answerIndex: number) {
		if (this.phase !== "VOTING") {
			throw new Error("Not in voting phase");
		}

		if (answerIndex < 0 || answerIndex >= this.answers.size) {
			throw new Error("Invalid answer index");
		}

		if (this.votes.has(playerId)) {
			throw new Error("Vote already submitted");
		}

		this.votes.set(playerId, answerIndex);
	}

	getState() {
		return this.state;
	}

	getAnswers() {
		return new Map(this.answers);
	}

	getVotes() {
		return new Map(this.votes);
	}

	getDTO() {
		return {
			state: this.state,
			phase: this.phase,
			currentRound: this.currentRound,
			maxRounds: this.maxRounds,
			question: this.currentQuestion,
			answers: this.phase === "VOTING" ? [...this.answers.values()] : null,
		};
	}
}
