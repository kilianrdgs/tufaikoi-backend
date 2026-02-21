export type ClientMessage =
	| { type: "CREATE_ROOM"; payload: { username: string } }
	| { type: "JOIN_ROOM"; payload: { roomId: string; username: string } }
	| { type: "LEAVE_ROOM" }

	// logique de partie
	| { type: "START_GAME" };

export type ServerMessage =
	| {
			type: "ROOM_UPDATE";
			payload: {
				roomId: string;
				hostId: string | null;
				players: { id: string; username: string }[];
				game: {
					state: RoomState;
				};
			};
	  }
	| {
			type: "ERROR";
			payload: { message: string };
	  };

export type RoomState = "WAITING" | "PLAYING" | "FINISHED";
