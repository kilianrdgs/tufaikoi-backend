import { describe, expect, it } from "vitest";
import { Game } from "../game";

describe("Game", () => {
	describe("Initialization", () => {
		it("Should initialize with correct default values", () => {
			const game = new Game("1234", ["player1", "player2"], "question");

			const dto = game.getDTO();

			expect(dto.state).toBe("PLAYING");
			expect(dto.phase).toBe("ANSWERING");
			expect(dto.currentRound).toBe(1);
			expect(dto.maxRounds).toBe(3);
			expect(dto.question).toBe("question");
			expect(dto.answers).toBeNull();
		});
	});
	describe("nextPhase", () => {
		it("Should transition from ANSWERING to VOTING", () => {
			const game = new Game("1234", ["player1", "player2"], "question");

			game.nextPhase();
			const dto = game.getDTO();

			expect(dto.phase).toBe("VOTING");
			expect(dto.answers).not.toBeNull();
		});

		it("Should transition from VOTING to RESULTS", () => {
			const game = new Game("1234", ["player1", "player2"], "question");

			game.nextPhase(); // ANSWERING to VOTING
			game.nextPhase(); // VOTING to RESULTS

			expect(game.getDTO().phase).toBe("RESULTS");
		});

		it("Should transition from RESULTS ROUND 1 to ANSWERING ROUND 2", () => {
			const game = new Game("1234", ["player1", "player2"], "question");

			game.nextPhase(); // ANSWERING to VOTING
			game.nextPhase(); // VOTING to RESULTS
			game.nextPhase(); // RESULTS ROUND 1 to ANSWERING ROUND 2

			const dto = game.getDTO();

			expect(dto.currentRound).toBe(2);
			expect(dto.phase).toBe("ANSWERING");
		});

		it("Should finish game after reaching maxRounds", () => {
			const game = new Game("1234", ["player1", "player2"], "question");

			//ROUND 1
			game.nextPhase(); // ANSWERING to VOTING
			game.nextPhase(); // VOTING to RESULTS
			game.nextPhase(); // RESULTS ROUND 1 to ANSWERING ROUND 2

			//ROUND 2
			game.nextPhase(); // ANSWERING to VOTING
			game.nextPhase(); // VOTING to RESULTS
			game.nextPhase(); // RESULTS ROUND 2 to ANSWERING ROUND 3

			//ROUND 3
			game.nextPhase(); // ANSWERING to VOTING
			game.nextPhase(); // VOTING to RESULTS
			game.nextPhase(); // RESULTS ROUND 3 to FINISHED

			expect(game.getState()).toBe("FINISHED");
		});

		it("Throw if nextPhase is called after game is finished", () => {
			const game = new Game("1234", ["player1", "player2"], "question");

			for (let i = 0; i < 9; i++) {
				game.nextPhase();
			}

			expect(() => game.nextPhase()).toThrow("Game is already finished");
		});
	});

	describe("submitAnswer", () => {
		it("Should store a player's answer", () => {
			const game = new Game("1234", ["player1", "player2"], "question");

			game.submitAnswer("player1", "ma réponse");

			expect(game.getAnswers().get("player1")).toBe("ma réponse");
		});

		it("Throw if not in ANSWERING phase", () => {
			const game = new Game("1234", ["player1", "player2"], "question");

			game.nextPhase(); // ANSWERING to VOTING

			expect(() => game.submitAnswer("player1", "ma réponse")).toThrow(
				"Not in answering phase",
			);
		});

		it("Throw if player already submitted", () => {
			const game = new Game("1234", ["player1", "player2"], "question");
			game.submitAnswer("player1", "ma réponse");

			expect(() => game.submitAnswer("player1", "ma réponse")).toThrow(
				"Answer already submitted",
			);
		});

		it("Should clear answers when moving to next round", () => {
			const game = new Game("1234", ["player1", "player2"], "question");
			game.submitAnswer("player1", "ma réponse");

			game.nextPhase(); // ANSWERING to VOTING
			game.nextPhase(); // VOTING to RESULTS
			game.nextPhase(); // RESULTS ROUND 1 to ANSWERING ROUND 2

			expect(game.getAnswers().size).toBe(0);
		});
	});

	describe("submitVote", () => {
		it("Should store a player's vote", () => {
			const game = new Game("1234", ["player1", "player2"], "question");
			game.submitAnswer("player1", "ma réponse");

			game.nextPhase(); // ANSWERING to VOTING

			game.submitVote("player2", 0);

			expect(game.getVotes().get("player2")).toBe(0);
		});

		it("Throw if not in VOTING phase", () => {
			const game = new Game("1234", ["player1", "player2"], "question");
			game.submitAnswer("player1", "ma réponse");

			expect(() => game.submitVote("player2", 0)).toThrow(
				"Not in voting phase",
			);
		});

		it("Throw if invalid answer index", () => {
			const game = new Game("1234", ["player1", "player2"], "question");
			game.submitAnswer("player1", "ma réponse");

			game.nextPhase(); // ANSWERING to VOTING

			expect(() => game.submitVote("player2", -1)).toThrow(
				"Invalid answer index",
			);
		});

		it("Throw if player already voted", () => {
			const game = new Game("1234", ["player1", "player2"], "question");
			game.submitAnswer("player1", "ma réponse");

			game.nextPhase(); // ANSWERING to VOTING

			game.submitVote("player2", 0);
			expect(() => game.submitVote("player2", 0)).toThrow(
				"Vote already submitted",
			);
		});

		it("Should clear votes when moving to next round", () => {
			const game = new Game("1234", ["player1", "player2"], "question");
			game.submitAnswer("player1", "ma réponse");

			game.nextPhase(); // ANSWERING to VOTING
			game.submitVote("player2", 0);

			game.nextPhase(); // VOTING to RESULTS

			game.nextPhase(); // RESULTS ROUND 1 to ANSWERING ROUND 2

			expect(game.getVotes().size).toBe(0);
		});
	});
});
