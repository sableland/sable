import { op_high_res_time, op_time_origin } from "ext:core/ops";

import "ext:sable/console/mod.js";

// TODO(Im-Beast): Implement other Performance methods
export class Performance {
	#timeOrigin;

	now() {
		return op_high_res_time();
	}

	get timeOrigin() {
		this.#timeOrigin ??= op_time_origin();
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
