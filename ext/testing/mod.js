import { styles } from "ext:bueno/utils/ansi.js";
import { textWidth } from "ext:bueno/utils/strings.js";
import { Printer } from "ext:bueno/console/printer.js";

// TODO(Im-Beast): bueno test and bench subcommands
// TODO(Im-Beast): op sanitization checks

const ComparisonPass = "pass";
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

class TestContextInvalidUsageError extends Error {
  /**
   * @param {TestContext} testContext
   */
  constructor(testContext) {
    // TODO(Im-Beast): Replace this with pretty errors after they happen

    const ptd = "-".repeat(textWidth(testContext.title));
    const ctd = "-".repeat(textWidth(testContext.currentlyTested.title));

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

const testingPrinter = new Printer("stdout");

const core = Bueno.core;

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
      return new TypeError("`almostEquals` only supports comparing numbers");
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

class TestContext {
  indent;
  title;
  testStep;

  passedTests = 0;
  failedTests = 0;

  locked = false;
  /** @type {TestContext} */
  currentlyTested = undefined;

  /**
   * @param {string} testStep
   * @param {TestContext | undefined} parent
   */
  constructor(testStep, parent) {
    this.testStep = testStep;

    this.parent = parent;
    this.title = `${styles.bold}${styles.cyan}${testStep}${styles.reset}`;
    this.start = performance.now();

    console.group(this.title);
  }

  static test(testStep, callback, parent) {
    const testContext = new TestContext(testStep, parent);

    parent?.lock(testContext);
    const response = callback(testContext);

    if (response instanceof Promise) {
      return response.then(() => {
        testContext.finish();
        parent?.unlock(testContext);
      });
    } else {
      testContext.finish();
      parent?.unlock(testContext);
    }
  }

  test(testStep, callback) {
    return TestContext.test(testStep, callback, this);
  }

  lock(testContext) {
    if (this.locked) {
      throw new TestContextInUseError(this, testContext);
    }

    this.currentlyTested = testContext;

    this.locked = true;
  }

  unlock(testContext) {
    if (!this.locked) {
      throw new TestContextInUseError(this, testContext);
    }

    this.locked = false;
  }

  finish() {
    if (this.failedTests > 0) return;

    const testTime = (performance.now() - this.start).toFixed(3);
    console.log(
      `- ${styles.lightGreen}ok${styles.reset} (${testTime}ms)`,
    );
    console.groupEnd(this.title);
  }

  /**
   * @param {ComparisonError} error - comparison error
   * @param {*} a - object A
   * @param {*} b - object B (or undefined if unnecessary)
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
        console.log(indent, "Showing A:", a);
        break;
      case "logB":
        console.log(indent, "Showing B:", b);
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
    //throw error;
  }

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

  assert(a) {
    if (!a) {
      this.fail(
        new ComparisonError("Failed assertion, A is truthy", "logA"),
        a,
      );
    } else {
      this.pass();
    }
  }

  equals(a, b) {
    this.assertComparisonError(comparisons.equals(a, b), a, b);
  }

  notEquals(a, b) {
    if (comparisons.equals(a, b) !== ComparisonPass) {
      this.pass();
    } else {
      this.fail(new ComparisonError("A equals B", "none"));
    }
  }

  almostEquals(a, b, stddev) {
    this.assertComparisonError(comparisons.almostEquals(a, b, stddev), a, b);
  }

  notAlmostEquals(a, b, stddev) {
    if (comparisons.almostEquals(a, b, stddev) !== ComparisonPass) {
      this.pass();
    } else {
      this.fail(new ComparisonError("A almost equals B", "none"));
    }
  }

  deepEquals(a, b) {
    this.assertComparisonError(comparisons.deepEquals(a, b), a, b);
  }

  notDeepEquals(a, b) {
    if (comparisons.deepEquals(a, b) !== ComparisonPass) {
      this.pass();
    } else {
      this.fail(new ComparisonError("A deep equals B", "none"));
    }
  }

  satisfies(a, b) {
    this.assertComparisonError(comparisons.satisfies(a, b), a, b);
  }

  notSatisfies(a, b) {
    if (comparisons.satisfies(a, b) !== ComparisonPass) {
      this.pass();
    } else {
      this.fail(new ComparisonError("A satisfies B", "none"));
    }
  }

  throws(a) {
    this.assertComparisonError(comparisons.throws(a), a);
  }

  notThrows(a) {
    if (comparisons.throws(a) !== ComparisonPass) {
      this.pass();
    } else {
      this.fail(new ComparisonError("A throws", "none"), a);
    }
  }

  async rejects(a) {
    this.assertComparisonError(await comparisons.rejects(a), a);
  }

  async notRejects(a) {
    if (await comparisons.rejects(a) !== ComparisonPass) {
      this.pass();
    } else {
      this.fail(new ComparisonError("A rejects", "none"));
    }
  }
}

function noop() {}

function test(testName, callback) {
  if (core.ops.op_runtime_state() !== "test") {
    Bueno.testing.test = noop;
    return;
  }

  return TestContext.test(testName, callback);
}

// TODO(Im-Beast): more advanced benchmarking
function bench(name, callback) {
  if (core.ops.op_runtime_state() !== "bench") {
    Bueno.testing.bench = noop;
    return;
  }

  console.log(`[ Benching '${name}' ]`);
  const time = core.ops.op_bench_fn(callback);
  console.log(`${name} takes ${time}ms`);
  return time;
}

Bueno.testing = {
  test,
  bench,
};
