export class PhaseTimer {
	private timer: ReturnType<typeof setTimeout> | null = null;
	private _endTime: number | null = null;
	private readonly durationMs: number;
	private readonly onExpire: () => void;

	constructor(durationMs: number, onExpire: () => void) {
		this.durationMs = durationMs;
		this.onExpire = onExpire;
	}

	start() {
		this.clear();
		this._endTime = Date.now() + this.durationMs;
		this.timer = setTimeout(() => {
			this.timer = null;
			this._endTime = null;
			this.onExpire();
		}, this.durationMs);
	}

	clear() {
		if (this.timer) {
			clearTimeout(this.timer);
			this.timer = null;
		}
		this._endTime = null;
	}

	get endTime(): number | null {
		return this._endTime;
	}

	isRunning(): boolean {
		return this.timer !== null;
	}
}
