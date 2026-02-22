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
		});
	});
	describe("nextPhase", () => {
		it("Should transition from ANSWERING to VOTING", () => {
			const game = new Game("1234", ["player1", "player2"], "question");

			game.nextPhase();

			expect(game.getDTO().phase).toBe("VOTING");
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
});
