import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { playersTestList } from "../../types";
import { Game } from "../game";

vi.mock("../../services/ai", () => ({
	generateScenarioFromPrompt: vi.fn().mockResolvedValue({
		scenario: "Scénario généré par IA",
		question: "Question générée ?",
	}),
}));

describe("Game", () => {
	describe("Initialization", () => {
		it("Should initialize with correct default values", () => {
			const game = new Game("1234", playersTestList, "Un scénario test");

			const dto = game.getDTO();

			expect(dto.state).toBe("PLAYING");
			expect(dto.phase).toBe("ANSWERING");
			expect(dto.currentRound).toBe(1);
			expect(dto.maxRounds).toBe(3);
			expect(dto.scenario).toBe("Un scénario test");
			expect(dto.question).toBe("Comment tu gères ça ?");
			expect(dto.answers).toBeNull();
		});
	});
	describe("nextPhase", () => {
		it("Should transition from ANSWERING to VOTING", async () => {
			const game = new Game("1234", playersTestList, "scenario");

			await game.nextPhase();
			const dto = game.getDTO();

			expect(dto.phase).toBe("VOTING");
			expect(dto.answers).not.toBeNull();
		});

		it("Should transition from VOTING to RESULTS", async () => {
			const game = new Game("1234", playersTestList, "scenario");

			await game.nextPhase(); // ANSWERING to VOTING
			await game.nextPhase(); // VOTING to RESULTS

			expect(game.getDTO().phase).toBe("RESULTS");
		});

		it("Should transition from RESULTS ROUND 1 to ANSWERING ROUND 2", async () => {
			const game = new Game("1234", playersTestList, "scenario");

			await game.nextPhase(); // ANSWERING to VOTING
			await game.nextPhase(); // VOTING to RESULTS
			await game.nextPhase(); // RESULTS ROUND 1 to ANSWERING ROUND 2

			const dto = game.getDTO();

			expect(dto.currentRound).toBe(2);
			expect(dto.phase).toBe("ANSWERING");
		});

		it("Should finish game after reaching maxRounds", async () => {
			const game = new Game("1234", playersTestList, "scenario");

			//ROUND 1
			await game.nextPhase(); // ANSWERING to VOTING
			await game.nextPhase(); // VOTING to RESULTS
			await game.nextPhase(); // RESULTS ROUND 1 to ANSWERING ROUND 2

			//ROUND 2
			await game.nextPhase(); // ANSWERING to VOTING
			await game.nextPhase(); // VOTING to RESULTS
			await game.nextPhase(); // RESULTS ROUND 2 to ANSWERING ROUND 3

			//ROUND 3
			await game.nextPhase(); // ANSWERING to VOTING
			await game.nextPhase(); // VOTING to RESULTS
			await game.nextPhase(); // RESULTS ROUND 3 to FINISHED

			expect(game.getState()).toBe("FINISHED");
		});

		it("Throw if nextPhase is called after game is finished", async () => {
			const game = new Game("1234", playersTestList, "scenario");

			for (let i = 0; i < 9; i++) {
				await game.nextPhase();
			}

			await expect(game.nextPhase()).rejects.toThrow(
				"Game is already finished",
			);
		});
	});

	describe("submitAnswer", () => {
		it("Should store a player's answer", () => {
			const game = new Game("1234", playersTestList, "scenario");

			game.submitAnswer("player1", "ma réponse");

			expect(game.getAnswers().get("player1")).toBe("ma réponse");
		});

		it("Throw if not in ANSWERING phase", async () => {
			const game = new Game("1234", playersTestList, "scenario");

			await game.nextPhase(); // ANSWERING to VOTING

			expect(() => game.submitAnswer("player1", "ma réponse")).toThrow(
				"Not in answering phase",
			);
		});

		it("Throw if player already submitted", () => {
			const game = new Game("1234", playersTestList, "scenario");
			game.submitAnswer("player1", "ma réponse");

			expect(() => game.submitAnswer("player1", "ma réponse")).toThrow(
				"Answer already submitted",
			);
		});

		it("Should clear answers when moving to next round", async () => {
			const game = new Game("1234", playersTestList, "scenario");
			game.submitAnswer("player1", "ma réponse");

			await game.nextPhase(); // ANSWERING to VOTING
			await game.nextPhase(); // VOTING to RESULTS
			await game.nextPhase(); // RESULTS ROUND 1 to ANSWERING ROUND 2

			expect(game.getAnswers().size).toBe(0);
		});
	});

	describe("submitVote", () => {
		it("Should store a player's vote", async () => {
			const game = new Game("1234", playersTestList, "scenario");
			game.submitAnswer("player1", "ma réponse");

			await game.nextPhase(); // ANSWERING to VOTING

			game.submitVote("player2", 0);

			expect(game.getVotes().get("player2")).toBe(0);
		});

		it("Throw if not in VOTING phase", () => {
			const game = new Game("1234", playersTestList, "scenario");
			game.submitAnswer("player1", "ma réponse");

			expect(() => game.submitVote("player2", 0)).toThrow(
				"Not in voting phase",
			);
		});

		it("Throw if invalid answer index", async () => {
			const game = new Game("1234", playersTestList, "scenario");
			game.submitAnswer("player1", "ma réponse");

			await game.nextPhase(); // ANSWERING to VOTING

			expect(() => game.submitVote("player2", -1)).toThrow(
				"Invalid answer index",
			);
		});

		it("Throw if player already voted", async () => {
			const game = new Game("1234", playersTestList, "scenario");
			game.submitAnswer("player1", "ma réponse");

			await game.nextPhase(); // ANSWERING to VOTING

			game.submitVote("player2", 0);
			expect(() => game.submitVote("player2", 0)).toThrow(
				"Vote already submitted",
			);
		});

		it("Should clear votes when moving to next round", async () => {
			const game = new Game("1234", playersTestList, "scenario");
			game.submitAnswer("player1", "ma réponse");

			await game.nextPhase(); // ANSWERING to VOTING
			game.submitVote("player2", 0);

			await game.nextPhase(); // VOTING to RESULTS
			await game.nextPhase(); // RESULTS ROUND 1 to ANSWERING ROUND 2

			expect(game.getVotes().size).toBe(0);
		});
	});

	describe("History & winning answer", () => {
		it("Should resolve winning answer after VOTING to RESULTS", async () => {
			const game = new Game("1234", playersTestList, "scenario");
			game.submitAnswer("player1", "réponse A");
			game.submitAnswer("player2", "réponse B");

			await game.nextPhase(); // ANSWERING to VOTING

			game.submitVote("player1", 1);
			game.submitVote("player2", 1);

			await game.nextPhase(); // VOTING to RESULTS

			expect(game.getWinningAnswer()).toBe("réponse B");
		});

		it("Should save round history after vote resolution", async () => {
			const game = new Game("1234", playersTestList, "Mon scénario");
			game.submitAnswer("player1", "réponse A");
			game.submitAnswer("player2", "réponse B");

			await game.nextPhase(); // ANSWERING to VOTING
			game.submitVote("player1", 0);
			game.submitVote("player2", 0);
			await game.nextPhase(); // VOTING to RESULTS

			const history = game.getHistory();
			expect(history.round1).toEqual({
				scenario: "Mon scénario",
				winningAnswer: "réponse A",
			});
		});

		it("Should update scenario via setNextScenario", () => {
			const game = new Game("1234", playersTestList, "scenario initial");

			game.setNextScenario("nouveau scénario", "Nouvelle question ?");

			const dto = game.getDTO();
			expect(dto.scenario).toBe("nouveau scénario");
			expect(dto.question).toBe("Nouvelle question ?");
		});
	});

	describe("Timer", () => {
		beforeEach(() => {
			vi.useFakeTimers();
		});

		afterEach(() => {
			vi.useRealTimers();
		});

		it("Should have endTime in DTO on initialization", () => {
			const now = Date.now();
			const game = new Game("1234", playersTestList, "scenario");

			const dto = game.getDTO();

			expect(dto.endTime).toBeGreaterThanOrEqual(now + 60_000);
		});

		it("Should reset endTime when phase changes", async () => {
			const game = new Game("1234", playersTestList, "scenario");

			const firstEndTime = game.getDTO().endTime;

			if (!firstEndTime) return;

			vi.advanceTimersByTime(10_000);
			await game.nextPhase(); // ANSWERING to VOTING

			const secondEndTime = game.getDTO().endTime;

			expect(secondEndTime).toBeGreaterThan(firstEndTime);
		});

		it("Should auto-advance phase when timer expires", async () => {
			const game = new Game("1234", playersTestList, "scenario");

			expect(game.getDTO().phase).toBe("ANSWERING");

			await vi.advanceTimersByTimeAsync(60_000);

			expect(game.getDTO().phase).toBe("VOTING");
		});

		it("Should call onPhaseChange callback when timer expires", async () => {
			const callback = vi.fn();
			const _game = new Game("1234", playersTestList, "scenario", callback);

			await vi.advanceTimersByTimeAsync(60_000);

			expect(callback).toHaveBeenCalledOnce();
		});

		it("Should auto-advance through multiple phases", async () => {
			const callback = vi.fn();
			const game = new Game("1234", playersTestList, "scenario", callback);

			await vi.advanceTimersByTimeAsync(60_000); // ANSWERING -> VOTING
			await vi.advanceTimersByTimeAsync(60_000); // VOTING -> RESULTS
			await vi.advanceTimersByTimeAsync(60_000); // RESULTS -> ANSWERING round 2

			expect(game.getDTO().phase).toBe("ANSWERING");
			expect(game.getDTO().currentRound).toBe(2);
			expect(callback).toHaveBeenCalledTimes(3);
		});

		it("Should have endTime null when game is finished", async () => {
			const game = new Game("1234", playersTestList, "scenario");

			// 3 rounds × 3 phases = 9 transitions
			for (let i = 0; i < 9; i++) {
				await vi.advanceTimersByTimeAsync(60_000);
			}

			expect(game.getState()).toBe("FINISHED");
			expect(game.getDTO().endTime).toBeNull();
		});

		it("Should not advance phase after game is finished", async () => {
			const callback = vi.fn();
			const game = new Game("1234", playersTestList, "scenario", callback);

			// Finish the game
			for (let i = 0; i < 9; i++) {
				await vi.advanceTimersByTimeAsync(60_000);
			}

			callback.mockClear();
			await vi.advanceTimersByTimeAsync(60_000); // should do nothing

			expect(game.getState()).toBe("FINISHED");
			expect(callback).not.toHaveBeenCalled();
		});
	});

	describe("getDTO results", () => {
		it("Results should be null in ANSWERING and VOTING phases", async () => {
			const game = new Game("1234", playersTestList, "scenario");
			expect(game.getDTO().results).toBeNull();

			await game.nextPhase(); // ANSWERING to VOTING

			expect(game.getDTO().results).toBeNull();
		});

		it("Results should contain correct data in RESULTS phase", async () => {
			const game = new Game("1234", playersTestList, "scenario");

			game.submitAnswer("player1", "reponse1");
			game.submitAnswer("player2", "reponse2");

			await game.nextPhase(); // ANSWERING to VOTING

			game.submitVote("player1", 1);
			game.submitVote("player2", 1);

			await game.nextPhase(); // VOTING to RESULTS

			const results = game.getDTO().results;

			expect(results).toHaveLength(2);
			expect(results?.[0]).toEqual({
				username: "User1",
				answer: "reponse1",
				votes: 0,
				isWinner: false,
			});
			expect(results?.[1]).toEqual({
				username: "User2",
				answer: "reponse2",
				votes: 2,
				isWinner: true,
			});
		});
		it("Results should be null after moving to next round", async () => {
			const game = new Game("1234", playersTestList, "scenario");

			game.submitAnswer("player1", "reponse1");
			game.submitAnswer("player2", "reponse2");

			await game.nextPhase(); // ANSWERING to VOTING

			game.submitVote("player1", 1);
			game.submitVote("player2", 1);

			await game.nextPhase(); // VOTING to RESULTS
			await game.nextPhase(); // RESULTS to ANSWERING ROUND 2

			expect(game.getDTO().results).toBeNull();
		});
	});
});
