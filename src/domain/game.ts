import { GameState } from "../types";

export class Game {
  private currentRound = 1;
  private readonly maxRounds = 3;
  private state: GameState = "PLAYING";

  constructor(readonly roomId: string, readonly players: string[]) {}

  getState() {
    return this.state;
  }

  getDTO() {
    return {
      state: this.state,
      currentRound: this.currentRound,
      maxRounds: this.maxRounds,
    };
  }
}
