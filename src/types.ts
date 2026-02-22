export type ClientMessage =
	| { type: "CREATE_ROOM"; payload: { username: string } }
	| { type: "JOIN_ROOM"; payload: { roomId: string; username: string } }
	| { type: "LEAVE_ROOM" }
	| { type: "START_GAME" }

	// message in game
	| { type: "NEXT_PHASE" }
	| { type: "SUBMIT_ANSWER"; payload: { answer: string } }
	| { type: "SUBMIT_VOTE"; payload: { answerIndex: number } };

export type ServerMessage =
	| {
			type: "ROOM_UPDATE";
			payload: {
				roomId: string;
				hostId: string | null;
				players: { id: string; username: string }[];
				state: RoomState;
				game: GameDTO | null;
			};
	  }
	| {
			type: "ERROR";
			payload: { message: string };
	  };

export type RoomState = "WAITING" | "IN_GAME";

export type GameState = "PLAYING" | "FINISHED";
export type GamePhase = "ANSWERING" | "VOTING" | "RESULTS";

export type GameDTO = {
	state: GameState;
	phase: GamePhase;
	currentRound: number;
	maxRounds: number;
	question: string | null;
	answers: string[] | null;
	results: RoundResult[] | null;
};

export type RoundResult = {
	username: string;
	answer: string;
	votes: number;
	isWinner: boolean;
};
