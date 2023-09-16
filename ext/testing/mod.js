import { styles } from "ext:bueno/utils/ansi.js";
import { textWidth } from "ext:bueno/utils/strings.js";
import { Printer } from "ext:bueno/console/printer.js";

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

class InvalidTestContextUsageError extends Error {
  /**
   * @param {TestContext} testContext
   */
  constructor(testContext) {
    super(
      `
You're using context from different step!
Please use the step from current callback:
test('${testContext.title}', (ctx) => {
------${"^".repeat(textWidth(testContext.title))} you're using this
  ...
  ctx.test('${testContext.currentlyTested.title}', (ctx) => { <--- instead of this
------------${
        "^".repeat(textWidth(testContext.currentlyTested.title))
      } instead of this

  });
  ...
});`,
    );

    this.name = "InvalidTestContextUsageError";
  }
}

const testingPrinter = new Printer("stdout");

const core = Bueno.core;

const comparisons = {
  equals(a, b) {
    if (a === b) {
      return ComparisonPass;
    }

    // TODO(Im-Beast): do something else than diff if its an object
    return new ComparisonError("A and B aren't the same", "diff");
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
        parent?.unlock();
      });
    } else {
      testContext.finish();
      parent?.unlock();
    }
  }

  test(testStep, callback) {
    return TestContext.test(testStep, callback, this);
  }

  lock(testContext) {
    this.currentlyTested = testContext;

    if (this.locked) {
      throw "Another step is already running!@#!@# <lock>";
    }

    this.locked = true;
  }

  unlock() {
    if (!this.locked) {
      throw "Another step is already running!@#!@# <unlock>";
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
      throw new InvalidTestContextUsageError(this);
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
      this.fail(new ComparisonError("A equals B", "none"), a, b);
    }
  }

  deepEquals(a, b) {
    this.assertComparisonError(
      comparisons.deepEquals(a, b),
      a,
      b,
    );
  }

  notDeepEquals(a, b) {
    if (comparisons.deepEquals(a, b) !== ComparisonPass) {
      this.pass();
    } else {
      this.fail(new ComparisonError("A deep equals B", "none"), a, b);
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
      this.fail(new ComparisonError("A rejects", "none"), a);
    }
  }
}

function test(testName, callback) {
  return TestContext.test(testName, callback);
}

function bench(name, callback) {
  console.log(`[ Benching '${name}' ]`);
  const time = core.ops.op_bench_fn(callback);
  console.log(`${name} takes ${time}ms`);
  return time;
}

Bueno.testing = {
  test,
  bench,
};
