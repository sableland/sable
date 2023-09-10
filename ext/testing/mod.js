import { ansi, textWidth } from "ext:bueno/ansi/mod.js";
import { Printer } from "ext:bueno/console/printer.js";

const testingPrinter = new Printer();

const core = Bueno.core;

const comparisons = {
  equals(a, b) {
    return a === b;
  },
  deepEquals(a, b) {
    if (a === b) {
      return true;
    }

    const constructor = a.constructor;
    if (constructor !== b.constructor) {
      return false;
    }

    switch (constructor) {
      case WeakMap:
      case WeakSet:
        throw "WeakMap and WeakSet are unable to be deeply equaled";
      case Number:
        return Number.isNaN(a) && Number.isNaN(b);
      case RegExp:
        return String(a) === String(b);
      case Date:
        return a.getTime() === b.getTime();
      case WeakRef:
        return comparisons.deepEquals(a.deref(), b.deref());
      case Set:
        if (a.size !== b.size) {
          return false;
        }

        for (const value of a) {
          if (!b.has(value)) return false;
        }
        return true;
      case Map:
        for (const [key, aValue] of a.entries()) {
          const bValue = b.get(key);
          if (!comparisons.deepEquals(aValue, bValue)) {
            return false;
          }
        }
        return true;
      case Array:
        if (a.length !== b.length) {
          return false;
        }

        for (const key in a) {
          if (!comparisons.deepEquals(a[key], b[key])) {
            return false;
          }
        }
        return true;
      case Object:
        let objSize = 0;

        for (const key in a) {
          if (!(key in b) || !comparisons.deepEquals(a[key], b[key])) {
            return false;
          }

          ++objSize;
        }

        for (const _ in b) {
          --objSize;
        }

        return objSize === 0;
    }

    return false;
  },
  throws(callback) {
    try {
      callback();
    } catch {
      return true;
    } finally {
      return false;
    }
  },
  async rejects(promise) {
    return await promise
      .then(() => false)
      .catch(() => true);
  },
};

class TestContext {
  #testStep;
  #indent;
  #title;

  constructor(testStep, indent = 0) {
    this.#testStep = testStep;
    this.#indent = indent;

    let title = " ".repeat(indent);
    if (indent > 0) title += "> ";
    title += ansi.style(ansi.style(testStep, "cyan"), "bold");
    this.#title = title;
    console.log(title);
  }

  static test(testStep, callback, indent = 0) {
    callback(new TestContext(testStep, indent));
  }

  test(testStep, callback) {
    TestContext.test(testStep, callback, this.#indent + 1);
  }

  /**
   * @param {"diff" | ""} type - type of the error message to be displayed
   * @param {*} a - object a
   * @param {*} b  - object b (or undefined if unnecessary)
   */
  fail(message, type, a, b) {
    const indent = "  ".repeat(this.#indent);
    console.log(
      `${indent} - ${ansi.style("failed", "lightRed")}`,
    );
    switch (type) {
      case "diff":
        const diffStr = core.ops.op_diff_str(
          testingPrinter.style(a),
          testingPrinter.style(b),
        );
        console.log(diffStr);
        break;
    }
  }

  pass() {
    const indent = "  ".repeat(this.#indent);
    console.log(
      `${indent} - ${ansi.style("ok", "lightGreen")}`,
    );
  }

  assert(a) {
    if (!a) {
      this.fail(`${a}`);
    } else {
      this.pass();
    }
  }

  equals(a, b) {
    if (!comparisons.equals(a, b)) {
      this.fail("a doesn't equal b", "diff", a, b);
    } else {
      this.pass();
    }
  }

  notEquals(a, b) {
    if (comparisons.equals(a, b)) {
      this.fail(`${a} equals ${b}`);
    } else {
      this.pass();
    }
  }

  deepEquals(a, b) {
    if (!comparisons.deepEquals(a, b)) {
      this.fail("a doesn't deep equal b", "diff", a, b);
    } else {
      this.pass();
    }
  }

  notDeepEquals(a, b) {
    if (comparisons.deepEquals(a, b)) {
      this.fail(`Fail ${a} deep equals ${b}`);
    } else {
      this.pass();
    }
  }

  throws(cb) {
    if (!comparisons.throws(cb)) {
      this.fail(`${cb} doesn't throw`);
    } else {
      this.pass();
    }
  }

  notThrows(callback) {
    if (comparisons.throws(callback)) {
      this.fail(`${callback} throws`);
    } else {
      this.pass();
    }
  }

  async rejects(promise) {
    if (!await comparisons.rejects(promise)) {
      this.fail(`${promise} doesn't reject`);
    } else {
      this.pass();
    }
  }

  async notRejects(promise) {
    if (await comparisons.rejects(promise)) {
      this.fail(`${promise} rejects`);
    } else {
      this.pass();
    }
  }
}

function test(testName, callback) {
  TestContext.test(testName, callback);
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
