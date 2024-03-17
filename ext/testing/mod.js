import { Printer } from "ext:sable/console/printer.js";
import { styles } from "ext:sable/utils/ansi.js";
import { textWidth } from "ext:sable/utils/text_width.js";

/**
 * Error which gets thrown whenever:
 *  - TestContext is leaking async ops
 *  - Test gets started when async ops are still pending
 */
class TestContextLeakingAsyncOpsError extends Error {
	/**
	 * @param {TestContext=} testContext
	 * @param {boolean=} isAsync - whether given testContext callback returned a promise
	 */
	constructor(testContext, isAsync) {
		// TODO(Im-Beast): Replace this with pretty errors after they happen
		let message = `
You wanted to create a test, but there are still asynchronous ops running.
Please make sure they've completed before you create the test.`;

		if (testContext) {
			message = `
At least one asynchronous operation was started in ${testContext.title} but never completed!
Please await all your promises or resolve test promise when every asynchronous operation has finished:`;

			if (isAsync) {
				message += `
test('${testContext.title}', async (ctx) => {
  ...
--^^^ ops leak somewhere around here, are you sure you awaited every promise?
});`;
			} else {
				const ptd = "-".repeat(textWidth(testContext.title));

				message += `
test('${testContext.title}', (ctx) => {
--------${ptd}^ this test is not asynchronous, but leaks asynchronous ops
  ...
--^^^ ops leak somewhere around here, are you sure this test was meant to be synchronous?
});`;
			}
		}

		super(message);

		this.name = "TestContextLeakingAsyncOpsError";
	}
}

class TestContextInvalidUsageError extends Error {
	/**
	 * @param {TestContext} testContext
	 */
	constructor(testContext) {
		const ptd = "-".repeat(textWidth(testContext.title));
		const ctd = "-".repeat(textWidth(testContext.currentlyTested.title));

		// TODO(Im-Beast): Replace this with pretty errors after they happen
		super(
			`
You're using context from different step!
Please use the step from current callback:
test('${testContext.title}', (ctx) => {
----------${ptd}^^^ you're using this
  ...
  ctx.test('${testContext.currentlyTested.title}', (ctx) => {
----------------${ctd}^^^ instead of this
    ...
  });
  ...
});`,
		);

		this.name = "TestContextInvalidUsageError";
	}
}

class TestContextInUseError extends Error {
	/**
	 * @param {TestContext} testContext
	 * @param {TestContext} tried
	 */
	constructor(testContext, tried) {
		const locked = testContext.locked ? "locked" : "unlocked";

		const parentTitle = testContext.title;
		const currentTitle = testContext.currentlyTested.title;
		const triedTitle = tried.title;

		const ctd = "-".repeat(textWidth(currentTitle));
		const cts = " ".repeat(textWidth(currentTitle));
		const ttd = "-".repeat(textWidth(triedTitle));

		// TODO(Im-Beast): Replace this with pretty errors after they happen
		super(
			`
You started another sub-test when previous one didn't finish! (${parentTitle} is ${locked})
Please check if you're not awaiting async sub-test:
test('${parentTitle}', async (ctx) => {
  ...
  vvv${ctd}--- you're not awaiting it |
  ctx.test('${currentTitle}', async (ctx) => { |
               ${cts}^^^^^------------/
                          but this is async
    ...
  });
  ...
      vvvv${ttd}------------- which in turn crashes here
  ctx.test('${triedTitle}', (ctx) => {
    ...
  });
  ...
});`,
		);

		this.name = "TestContextInUseError";
	}
}

/**
 * Error which gets thrown whenever test comparison fails
 */
class ComparisonError extends Error {
	/**
	 * @param {string} message
	 * @param {"diff" | "none" | "logA" | "logB"} type
	 */
	constructor(message, type = "none") {
		super(message);
		this.name = "ComparisonError";
		this.type = type;
	}
}

/**
 * Value which gets returned whenever comparison passes
 */
const ComparisonPass = "pass";

const testingPrinter = new Printer("stdout");

const core = Sable.core;

const comparisons = {
	equals(a, b) {
		if (a === b) {
			return ComparisonPass;
		}

		return new ComparisonError(
			"A and B aren't the same",
			typeof a === "object" && typeof b === "object" ? "none" : "diff",
		);
	},
	almostEquals(a, b, stddev) {
		if (a === b) {
			return ComparisonPass;
		}

		if (typeof a !== "number" || typeof b !== "number") {
			throw new TypeError("`almostEquals` only supports comparing numbers");
		}

		if (Math.abs(a - b) <= stddev) {
			return ComparisonPass;
		}

		return new ComparisonError(
			`discrepancy between A and B is higher than ${stddev}`,
			"diff",
		);
	},
	deepEquals(a, b) {
		if (a === b) {
			return ComparisonPass;
		}

		const constructor = a.constructor;
		if (constructor !== b.constructor) {
			return new ComparisonError("A and B have different constructors", "diff");
		}

		switch (constructor) {
			case WeakMap:
			case WeakSet:
				return new ComparisonError(
					"WeakMap and WeakSet are unable to be deeply equaled",
					"none",
				);
			case Number:
				if (!Number.isNaN(a) || !Number.isNaN(b)) {
					return new ComparisonError("A isn't equal to B", "diff");
				}
				return ComparisonPass;
			case RegExp:
				if (String(a) !== String(b)) {
					return new ComparisonError("A isn't equal to B", "diff");
				}
				return ComparisonPass;
			case Date:
				if (a.getTime() !== b.getTime()) {
					return new ComparisonError("A isn't equal to B", "diff");
				}
				return ComparisonPass;
			case WeakRef:
				return comparisons.deepEquals(a.deref(), b.deref());
			case Set:
				if (a.size !== b.size) {
					return new ComparisonError("A and B are of different sizes", "diff");
				}

				for (const value of a) {
					if (!b.has(value)) {
						return new ComparisonError(
							"B is missing value(s) that A has",
							"diff",
						);
					}
				}
				return ComparisonPass;
			case Map:
				for (const [key, aValue] of a.entries()) {
					if (!b.has(key)) {
						return new ComparisonError(
							"B is missing key-value pair(s) that A has",
							"diff",
						);
					} else if (
						comparisons.deepEquals(aValue, b.get(key)) !== ComparisonPass
					) {
						return new ComparisonError(
							"A and B have pair(s) that aren't deeply equal",
							"diff",
						);
					}
				}
				return ComparisonPass;
			case Array:
				if (a.length !== b.length) {
					return new ComparisonError("A and B have different length", "diff");
				}

				for (const key in a) {
					if (!(key in b)) {
						return new ComparisonError(
							"B is missing index(es) that A has",
							"diff",
						);
					} else if (!comparisons.deepEquals(a[key], b[key])) {
						return new ComparisonError(
							"A and B have values that aren't deeply equal",
							"diff",
						);
					}
				}
				return ComparisonPass;
			case Object: {
				let objSize = 0;

				for (const key in a) {
					if (!(key in b)) {
						return new ComparisonError(
							"B is missing propert{y,ies} that A has",
							"diff",
						);
					} else if (!comparisons.deepEquals(a[key], b[key])) {
						return new ComparisonError(
							"A and B have values that aren't deeply equal",
							"diff",
						);
					}

					++objSize;
				}

				for (const _ in b) --objSize;

				if (objSize > 0) {
					return new ComparisonError(
						"A is missing propert{y,ies} that B has",
						"diff",
					);
				}

				return ComparisonPass;
			}
		}

		return new ComparisonError(
			"A and B aren't deeply equal (unsure cause)",
			"diff",
		);
	},
	satisfies(a, b) {
		for (const key in b) {
			if (!(key in a)) {
				return new ComparisonError(
					"A is missing propert{y,ies} that B has",
					"diff",
				);
			}

			const aValue = a[key];
			const bValue = b[key];

			if (comparisons.equals(a, b) === ComparisonPass) {
				continue;
			} else if (typeof aValue !== typeof bValue) {
				return new ComparisonError(
					`Property ${key} in A has different type than B`,
					"diff",
				);
			} else if (typeof aValue === "object") {
				const satisfies = comparisons.satisfies(aValue, bValue);
				if (satisfies !== ComparisonPass) return satisfies;
			}
		}

		return ComparisonPass;
	},
	throws(a) {
		try {
			a();
			return new ComparisonError("A throws", "none");
		} catch {
			return ComparisonPass;
		}
	},
	async rejects(a) {
		return await a
			.then(() => new ComparisonError("A rejects", "none"))
			.catch(() => ComparisonPass);
	},
};

/**
 * @class
 * @classdesc Class responsible for running tests
 */
class TestContext {
	/**
	 * @type {TestContext | undefined}
	 * Currently evaluated sub-test
	 */
	currentlyTested = undefined;

	/** Name of current test */
	name;
	/** Styled {TestContext.name} */
	title;

	passedTests = 0;
	failedTests = 0;

	/**
	 * Whether this test has sub-test which is currently running
	 * If someone tries to create another subtest or comparison when test is locked it will throw
	 */
	locked = false;

	/**
	 * @param {string} name - name for current test
	 * @param {TestContext | undefined} parent - parent test
	 */
	constructor(name, parent) {
		this.name = name;

		this.parent = parent;
		this.start = performance.now();

		this.title = `${styles.bold}${styles.cyan}${name}${styles.reset}`;
		console.group(this.title);
	}

	/**
	 * @param {TestContext} testContext - currently evaluated TestContext
	 * @param {boolean} async - whether TestContext returned a promise
	 * @throws when async ops are still pending
	 */
	static sanitizeAsyncOps(testContext = undefined, async = false) {
		if (!core.ops.op_test_async_ops_sanitization()) {
			throw new TestContextLeakingAsyncOpsError(testContext, async);
		}
	}

	/**
	 * Lock current test and ensure that only one test runs at the time
	 * @param {TestContext} testContext - currently evaluted test context
	 */
	lock(testContext) {
		if (this.locked) {
			throw new TestContextInUseError(this, testContext);
		}

		this.currentlyTested = testContext;
		this.locked = true;
	}

	/**
	 * Unlock current test and ensure that only one test runs at the time
	 * @param {TestContext} testContext - currently evaluted test context
	 */
	unlock(testContext) {
		if (!this.locked) {
			throw new TestContextInUseError(this, testContext);
		}

		this.locked = false;
	}

	/**
	 * Create new test with given callback
	 * @param {string} name
	 * @param {(context: TestContext) => void | Promise<void>} callback
	 * @param {TestContext} [parent=undefined] parent
	 * @returns {void | Promise<void>}
	 */
	static test(name, callback, parent) {
		const testContext = new TestContext(name, parent);

		parent?.lock(testContext);
		const response = callback(testContext);

		if (response instanceof Promise) {
			return response.then(() => {
				testContext.finish();
				parent?.unlock(testContext);
				TestContext.sanitizeAsyncOps(testContext, true);
			});
		} else {
			testContext.finish();
			parent?.unlock(testContext);
			TestContext.sanitizeAsyncOps(testContext, false);
		}
	}

	/**
	 * Create new sub-test with given callback
	 * @param {string} name
	 * @param {(context: TestContext) => void | Promise<void>} callback
	 * @returns {void | Promise<void>}
	 */
	test(name, callback) {
		return TestContext.test(name, callback, this);
	}

	/**
	 * Finish running this test
	 */
	finish() {
		if (this.failedTests > 0) return;

		const testTime = (performance.now() - this.start).toFixed(3);
		console.log(`- ${styles.lightGreen}ok${styles.reset} (${testTime}ms)`);
		console.groupEnd();
	}

	/**
	 * Fail this test if `error` is a `ComparisonError`, otherwise pass
	 *
	 * Additionally it ensures this test uses its own context
	 * @param {ComparisonError | "pass"} error
	 * @param {*} a
	 * @param {*} b
	 */
	assertComparisonError(error, a, b) {
		if (this.locked) {
			throw new TestContextInvalidUsageError(this);
		}

		if (error instanceof ComparisonError) {
			this.fail(error, a, b);
		} else {
			this.pass();
		}
	}

	pass() {
		this.passedTests++;
	}

	/**
	 * Fail current test.
	 *
	 * If `ComparisonError.type` is:
	 *  - diff - prints pretty diff log of `a` and `b`
	 *  - logA - only logs `a`
	 *  - logB - only logs `b`
	 *  - none - doesn't log any additional info
	 *
	 * Then it throws with given `ComparisonError`
	 *
	 * @param {ComparisonError} error - comparison error
	 * @param {*} a - object A
	 * @param {*} b - object B (or undefined if unnecessary)
	 * @throws
	 */
	fail(error, a, b) {
		this.failedTests++;

		console.log(
			`- ${styles.red}${styles.bold}failed${styles.reset}:`,
		);

		console.log(error.message);
		switch (error.type) {
			case "none":
				break;
			case "logA":
				console.log("Showing A:", a);
				break;
			case "logB":
				console.log("Showing B:", b);
				break;
			case "diff":
				console.log(
					`Showing diff of ${styles.lightRed}${styles.bold}A${styles.reset} and ${styles.lightGreen}${styles.bold}B${styles.reset}:`,
				);
				console.log(core.ops.op_diff_str(
					testingPrinter.format(a),
					testingPrinter.format(b),
				));
				break;
		}
		throw error;
	}

	/** Make sure that `a` is truthy */
	assert(a) {
		this.assertComparisonError(
			a
				? ComparisonPass
				: new ComparisonError("Failed assertion, A isn't truthy", "logA"),
			a,
		);
	}

	/** Make sure that `a === b` */
	equals(a, b) {
		this.assertComparisonError(comparisons.equals(a, b), a, b);
	}

	/** Make sure that `a !== b` */
	notEquals(a, b) {
		this.assertComparisonError(
			comparisons.equals(a, b) === ComparisonPass
				? new ComparisonError("A equals B", "none")
				: ComparisonPass,
		);
	}

	/** Make sure that absolute difference of `a` and `b` isn't higher than `stddev` */
	almostEquals(a, b, stddev) {
		this.assertComparisonError(comparisons.almostEquals(a, b, stddev), a, b);
	}

	/** Make sure that absolute difference of `a` and `b` is higher than `stddev` */
	notAlmostEquals(a, b, stddev) {
		this.assertComparisonError(
			comparisons.almostEquals(a, b, stddev) === ComparisonPass
				? new ComparisonError("A almost equals B", "none")
				: ComparisonPass,
		);
	}

	/** Make sure that `a` deeply equals `b` */
	deepEquals(a, b) {
		this.assertComparisonError(comparisons.deepEquals(a, b), a, b);
	}

	/** Make sure that `a` doesn't deeply equal `b` */
	notDeepEquals(a, b) {
		this.assertComparisonError(
			comparisons.deepEquals(a, b) === ComparisonPass
				? new ComparisonError("A deeply equals B", "none")
				: ComparisonPass,
		);
	}

	/**
	 * Make sure that `a` satisfies `b`
	 * Its similiar to typescripts `A extends B ? true : false`
	 */
	satisfies(a, b) {
		this.assertComparisonError(comparisons.satisfies(a, b), a, b);
	}

	/** Make sure that `a` doesn't satisfy `b` */
	notSatisfies(a, b) {
		this.assertComparisonError(
			comparisons.satisfies(a, b) === ComparisonPass
				? new ComparisonError("A satisfies B", "none")
				: ComparisonPass,
		);
	}

	/**
	 * Make sure `a` throws
	 * @param {(...args: *) => *} a
	 */
	throws(a) {
		this.assertComparisonError(comparisons.throws(a), a);
	}

	/**
	 * Make sure `a` doesn't throw
	 * @param {(...args: *) => *} a
	 */
	notThrows(a) {
		this.assertComparisonError(
			comparisons.throws(a) === ComparisonPass
				? new ComparisonError("A throws", "none")
				: ComparisonPass,
		);
	}

	/**
	 * Make sure `a` rejects
	 * @param {(...args: *) => Promise<*>} a
	 */
	async rejects(a) {
		this.assertComparisonError(await comparisons.rejects(a), a);
	}

	/**
	 * Make sure `a` doesn't reject
	 * @param {(...args: *) => Promise<*>} a
	 */
	async notRejects(a) {
		this.assertComparisonError(
			await comparisons.rejects(a) === ComparisonPass
				? new ComparisonError("A rejects", "none")
				: ComparisonPass,
		);
	}

	#order = new Map();

	/**
	 * Make sure that this method was called in proper order
	 * @param {*} id
	 * @param {number} order
	 */
	order(id, order) {
		const current = this.#order.get(id) ?? 0;
		if (order !== current) {
			this.assertComparisonError(
				new ComparisonError("This didn't run in proper order", "diff"),
				order,
				current,
			);
		}
		this.#order.set(id, current + 1);
	}
}

/** @type {"default" | "test" | "bench" | undefined} */
let runtimeState;

function noop() {}

/**
 * Create new test
 * @param {string} name - name of a test
 * @param {(context: TestContext) => void | Promise<void>} callback
 * @returns {void | Promise<void>}
 */
function test(name, callback) {
	if (!runtimeState) {
		runtimeState = core.ops.op_runtime_state();
	}

	if (runtimeState !== "test") {
		Sable.bench = noop;
		return;
	}

	TestContext.sanitizeAsyncOps();
	return TestContext.test(name, callback);
}

// TODO(Im-Beast): more advanced benchmarking
function bench(name, callback) {
	if (!runtimeState) {
		runtimeState = core.ops.op_runtime_state();
	}

	if (runtimeState !== "bench") {
		Sable.bench = noop;
		return;
	}

	console.log(`[ Benching '${name}' ]`);
	const time = core.ops.op_bench_fn(callback);
	console.log(`${name} takes ${time}ms`);
	return time;
}

Sable.testing = {
	test,
	bench,
};
