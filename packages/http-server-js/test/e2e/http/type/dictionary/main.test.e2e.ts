import { afterEach, assert, beforeEach, describe, expect, it } from "vitest";
import { createDictionaryRouter } from "../../../generated/type/dictionary/src/generated/http/router.js";
import { startServer, testRouterOptions } from "../../../helpers.js";
import { runScenario } from "../../../spector.js";

import { Temporal } from "temporal-polyfill";
import { HttpContext } from "../../../../../src/http/index.js";
import { InnerModel } from "../../../generated/type/dictionary/src/generated/models/all/type/dictionary.js";

class RecordImpl<T> {
  #assert: (l: T, r: T) => void;

  constructor(
    public readonly value: Record<string, T>,
    assert: (l: T, r: T) => void = (l, r) => l === r,
  ) {
    this.#assert = assert;
  }

  async get() {
    return this.value;
  }

  async put(_: HttpContext, body: Record<string, T>) {
    const props = Object.entries(this.value);
    const bodyProps = Object.entries(body);

    assert.equal(bodyProps.length, props.length);

    for (const [k, v] of bodyProps) {
      this.#assert(v, this.value[k]);
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
    const router = createDictionaryRouter(
      new RecordImpl({ k1: 1, k2: 2 }),
      new RecordImpl({ k1: 0x7fffffffffffffffn, k2: -0x7fffffffffffffffn }),
      new RecordImpl({ k1: true, k2: false }),
      new RecordImpl({ k1: "hello", k2: "" }),
      new RecordImpl({ k1: 43.125 }),
      new RecordImpl({ k1: Temporal.Instant.from("2022-08-26T18:38:00Z") }, (l, r) => {
        assert.equal(Temporal.Instant.compare(l, r), 0);
      }),
      new RecordImpl({ k1: Temporal.Duration.from("P123DT22H14M12.011S") }, (l, r) => {
        assert.equal(Temporal.Duration.compare(l, r), 0);
      }),
      new RecordImpl({ k1: 1, k2: "hello", k3: null }),
      new RecordImpl({ k1: { property: "hello" }, k2: { property: "world" } }, (l, r) => {
        assert.equal(l.property, r.property);
      }),
      new RecordImpl<InnerModel>(
        {
          k1: { property: "hello", children: {} },
          k2: {
            property: "world",
            children: {
              "k2.1": { property: "inner world" },
            },
          },
        },
        (l, r) => {
          assert.equal(l.property, r.property);
          assert.deepEqual(l.children, r.children);
        },
      ),
      new RecordImpl({ k1: 1.25, k2: 0.5, k3: null }),
      testRouterOptions,
    );
    const baseUrl = await startServer(router, serverAbortController.signal);
    const { status } = await runScenario("type/dictionary/**/*", baseUrl);
    expect(status).toBe("pass");
  });
});
