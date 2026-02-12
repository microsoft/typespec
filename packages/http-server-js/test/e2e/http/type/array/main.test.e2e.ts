import { afterEach, assert, beforeEach, describe, expect, it } from "vitest";
import { createArrayRouter } from "../../../generated/type/array/src/generated/http/router.js";
import { startServer, testRouterOptions } from "../../../helpers.js";
import { runScenario } from "../../../spector.js";

import { Temporal } from "temporal-polyfill";
import { HttpContext } from "../../../../../src/http/index.js";

class ArrayImpl<T> {
  #assert: (l: T, r: T) => void;

  constructor(
    public readonly value: T[],
    assert: (l: T, r: T) => void = (l, r) => l === r,
  ) {
    this.#assert = assert;
  }

  async get() {
    return this.value;
  }

  async put(_: HttpContext, body: T[]) {
    assert.equal(body.length, this.value.length);

    for (let i = 0; i < body.length; i++) {
      this.#assert(this.value[i], body[i]);
    }

    return;
  }
}

describe("Type.Array", () => {
  let serverAbortController: AbortController;
  beforeEach(() => {
    serverAbortController = new AbortController();
  });
  afterEach(() => {
    serverAbortController.abort();
  });

  it("passes all scenarios", async () => {
    const router = createArrayRouter(
      new ArrayImpl([1, 2]),
      new ArrayImpl([0x7fffffffffffffffn, -0x7fffffffffffffffn]),
      new ArrayImpl([true, false]),
      new ArrayImpl(["hello", ""]),
      new ArrayImpl([43.125]),
      new ArrayImpl([Temporal.Instant.from("2022-08-26T18:38:00Z")], (l, r) => {
        assert.equal(Temporal.Instant.compare(l, r), 0);
      }),
      new ArrayImpl([Temporal.Duration.from("P123DT22H14M12.011S")], (l, r) => {
        assert.equal(Temporal.Duration.compare(l, r), 0);
      }),
      new ArrayImpl([1, "hello", null]),
      new ArrayImpl([{ property: "hello" }, { property: "world" }], (l, r) => {
        assert.equal(l.property, r.property);
      }),
      new ArrayImpl([1.25, null, 3.0]),
      new ArrayImpl([1, null, 3]),
      new ArrayImpl([true, null, false]),
      new ArrayImpl(["hello", null, "world"]),
      new ArrayImpl([{ property: "hello" }, null, { property: "world" }], (l, r) => {
        if (l === null) {
          assert.equal(r, null);
        } else {
          assert.isNotNull(r);
          assert.equal(l.property, r.property);
        }
      }),
      testRouterOptions,
    );
    const baseUrl = await startServer(router, serverAbortController.signal);
    const { status } = await runScenario("type/array/!(int64value)*/*", baseUrl);
    expect(status).toBe("pass");
  });
});
