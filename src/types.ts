export type ClientMessage =
	| { type: "CREATE_ROOM"; payload: { username: string } }
	| { type: "JOIN_ROOM"; payload: { roomId: string; username: string } }
	| { type: "LEAVE_ROOM" };

export type ServerMessage =
	| { type: "ROOM_CREATED"; payload: { roomId: string; username: string } }
	| { type: "ROOM_JOINED"; payload: { roomId: string; username: string } }
	| { type: "ROOM_LEFT" }
	| {
			type: "ROOM_UPDATE";
			payload: { players: { id: string; username: string }[] };
	  }
	| { type: "ERROR"; payload: { message: string } };
