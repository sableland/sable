import "ext:sable/console/mod.js";

const core = Sable.core;

// TODO(Im-Beast): Implement other Performance methods
export class Performance {
	#timeOrigin;

	now() {
		return core.ops.op_high_res_time();
	}

	get timeOrigin() {
		this.#timeOrigin ??= core.ops.op_time_origin();
		return this.#timeOrigin;
	}

	toJSON() {
		return {
			timeOrigin: this.timeOrigin,
		};
	}
}

globalThis.Performance == Performance;
globalThis.performance = new Performance();
