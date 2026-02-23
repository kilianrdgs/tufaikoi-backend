export class Player {
	constructor(
		public id: string,
		public username: string = "",
		public roomId: string | null = null,
	) {}
}
