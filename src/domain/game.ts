import type { GamePhase, GameState, RoundResult } from "../types";
import { PhaseTimer } from "./phaseTimer";

const DURATION_TIMER = 60_000;

export class Game {
	private currentRound = 1;
	private readonly maxRounds = 3;
	private state: GameState = "PLAYING";
	private phase: GamePhase = "ANSWERING";
	private currentQuestion: string;
	private answers = new Map<string, string>();
	private votes = new Map<string, number>();
	private phaseTimer: PhaseTimer;
	private onPhaseChange?: () => void;

	constructor(
		readonly roomId: string,
		readonly players: { id: string; username: string }[],
		question: string,
		onPhaseChange?: () => void,
	) {
		this.currentQuestion = question;
		this.onPhaseChange = onPhaseChange;
		this.phaseTimer = new PhaseTimer(DURATION_TIMER, () =>
			this.handleTimerExpired(),
		);
		this.phaseTimer.start();
	}

	private handleTimerExpired() {
		if (this.state === "FINISHED") return;

		this.nextPhase();
		this.onPhaseChange?.();
	}

	nextPhase() {
		if (this.state === "FINISHED") {
			throw new Error("Game is already finished");
		}

		if (this.phase === "ANSWERING") {
			this.phase = "VOTING";
			this.phaseTimer.start();
			return;
		}

		if (this.phase === "VOTING") {
			this.phase = "RESULTS";
			this.phaseTimer.start();
			return;
		}

		if (this.phase === "RESULTS") {
			this.answers.clear(); // vider les réponses (a ne pas vider pour un historique plus tard)
			this.votes.clear(); // vider les votes (a ne pas vider pour un historique plus tard)

			if (this.currentRound >= this.maxRounds) {
				this.state = "FINISHED";
				this.phaseTimer.clear();
				return;
			}
			this.currentRound++;
			this.phase = "ANSWERING";
			this.phaseTimer.start();
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
		let results: RoundResult[] | null = null;

		if (this.phase === "RESULTS") {
			const answersArray = [...this.answers.entries()];

			const voteCounts = new Map<number, number>();
			for (const answerIndex of this.votes.values()) {
				voteCounts.set(answerIndex, (voteCounts.get(answerIndex) ?? 0) + 1);
			}

			const maxVotes = Math.max(...voteCounts.values(), 0);

			results = answersArray.map(([playerId, answer], index) => {
				const votes = voteCounts.get(index) ?? 0;
				const player = this.players.find((p) => p.id === playerId);
				return {
					username: player?.username ?? "Unknown",
					answer,
					votes,
					isWinner: votes === maxVotes && maxVotes > 0,
				};
			});
		}

		return {
			state: this.state,
			phase: this.phase,
			currentRound: this.currentRound,
			maxRounds: this.maxRounds,
			question: this.currentQuestion,
			answers: this.phase === "VOTING" ? [...this.answers.values()] : null,
			results,
			endTime: this.phaseTimer.endTime,
		};
	}
}
