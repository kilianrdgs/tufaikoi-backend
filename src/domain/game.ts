import type { GamePhase, GameState, RoundResult } from "../types";
import { generateScenarioFromPrompt } from "../utils/ai/ai";
import {
	buildConclusionPrompt,
	buildRoundPrompt,
	type GameHistory,
	type RoundNumber,
} from "../utils/ai/prompts";
import { PhaseTimer } from "./phaseTimer";

const DURATION_TIMER = 60_000;

export class Game {
	private currentRound = 1;
	private readonly maxRounds = 3;
	private state: GameState = "PLAYING";
	private phase: GamePhase = "ANSWERING";
	private currentScenario: string;
	private currentQuestion: string;
	private answers = new Map<string, string>();
	private votes = new Map<string, number>();
	private phaseTimer: PhaseTimer;
	private onPhaseChange?: () => void;

	private history: GameHistory = {};
	private winningAnswer: string | null = null;
	private pendingScenario: Promise<{
		scenario: string;
		question: string;
	}> | null = null;

	constructor(
		readonly roomId: string,
		readonly players: { id: string; username: string }[],
		scenario: string,
		onPhaseChange?: () => void,
	) {
		this.currentScenario = scenario;
		this.currentQuestion = "Comment tu gères ça ?";
		this.onPhaseChange = onPhaseChange;
		this.phaseTimer = new PhaseTimer(DURATION_TIMER, () =>
			this.handleTimerExpired(),
		);
		this.phaseTimer.start();
	}

	private async handleTimerExpired() {
		if (this.state === "FINISHED") return;

		await this.nextPhase();
		this.onPhaseChange?.();
	}

	async nextPhase() {
		console.log(
			`[GAME] nextPhase appelé — phase: ${this.phase}, round: ${this.currentRound}`,
		);

		if (this.state === "FINISHED") {
			throw new Error("Game is already finished");
		}

		if (this.phase === "ANSWERING") {
			this.phase = "VOTING";
			console.log("[GAME] → VOTING");
			this.phaseTimer.start();
			return;
		}

		if (this.phase === "VOTING") {
			this.resolveWinner();
			this.launchScenarioGeneration();
			this.phase = "RESULTS";
			console.log("[GAME] → RESULTS");
			this.phaseTimer.start();
			return;
		}

		if (this.phase === "RESULTS") {
			await this.applyPendingScenario();
			this.answers.clear();
			this.votes.clear();

			if (this.currentRound >= this.maxRounds) {
				this.state = "FINISHED";
				this.phaseTimer.clear();
				console.log("[GAME] → FINISHED");
				return;
			}
			this.currentRound++;
			this.phase = "ANSWERING";
			console.log(
				`[GAME] → ANSWERING round ${this.currentRound} — scenario: "${this.currentScenario}"`,
			);
			this.phaseTimer.start();
			return;
		}
	}

	private launchScenarioGeneration() {
		if (!this.winningAnswer) {
			console.log("[IA] Pas de winningAnswer, génération ignorée");
			return;
		}

		const isLastRound = this.currentRound >= this.maxRounds;
		console.log(
			`[IA] Lancement génération — round ${this.currentRound}, winningAnswer: "${this.winningAnswer}", isLastRound: ${isLastRound}`,
		);

		let prompt: string;
		if (isLastRound) {
			prompt = buildConclusionPrompt(
				this.history,
				this.currentScenario,
				this.winningAnswer,
			);
		} else {
			const nextRound = (this.currentRound + 1) as RoundNumber;
			prompt = buildRoundPrompt(
				nextRound,
				this.currentScenario,
				this.winningAnswer,
				this.history,
			);
		}

		console.log("[IA] Prompt envoyé:", prompt);
		this.pendingScenario = generateScenarioFromPrompt(prompt);
	}

	private async applyPendingScenario() {
		if (!this.pendingScenario) {
			console.log("[IA] Aucun scénario en attente à appliquer");
			return;
		}

		console.log("[IA] Attente du résultat IA...");
		const result = await this.pendingScenario;
		console.log(
			`[IA] Scénario reçu: "${result.scenario}" — Question: "${result.question}"`,
		);
		this.currentScenario = result.scenario;
		this.currentQuestion = result.question;
		this.pendingScenario = null;
	}

	private resolveWinner() {
		const answersArray = [...this.answers.entries()];
		const voteCounts = new Map<number, number>();
		for (const answerIndex of this.votes.values()) {
			voteCounts.set(answerIndex, (voteCounts.get(answerIndex) ?? 0) + 1);
		}

		console.log(
			`[GAME] resolveWinner — answers: ${answersArray.length}, votes: ${this.votes.size}`,
		);

		const maxVotes = Math.max(...voteCounts.values(), 0);
		if (maxVotes === 0) {
			this.winningAnswer = answersArray[0]?.[1] ?? null;
		} else {
			const winnerIndex = [...voteCounts.entries()].reduce((a, b) =>
				b[1] > a[1] ? b : a,
			)[0];
			this.winningAnswer = answersArray[winnerIndex]?.[1] ?? null;
		}

		const roundKey = `round${this.currentRound}` as keyof GameHistory;
		if (this.winningAnswer) {
			this.history[roundKey] = {
				scenario: this.currentScenario,
				winningAnswer: this.winningAnswer,
			};
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

	setNextScenario(scenario: string, question: string) {
		this.currentScenario = scenario;
		this.currentQuestion = question;
	}

	getCurrentScenario() {
		return this.currentScenario;
	}

	getWinningAnswer() {
		return this.winningAnswer;
	}

	getHistory() {
		return this.history;
	}

	getCurrentRound() {
		return this.currentRound;
	}

	getPhase() {
		return this.phase;
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

		if (this.phase === "RESULTS" || this.state === "FINISHED") {
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
			scenario: this.currentScenario,
			question: this.currentQuestion,
			answers: this.phase === "VOTING" ? [...this.answers.values()] : null,
			results,
			endTime: this.phaseTimer.endTime,
		};
	}
}
