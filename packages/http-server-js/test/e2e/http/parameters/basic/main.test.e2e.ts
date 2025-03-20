import { deepStrictEqual } from "node:assert";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createBasicRouter } from "../../../generated/parameters/basic/src/generated/http/router.js";
import { startServer, testRouterOptions } from "../../../helpers.js";
import { runScenario } from "../../../spector.js";

describe("Parameters.Basic", () => {
  let serverAbortController: AbortController;
  beforeEach(() => {
    serverAbortController = new AbortController();
  });
  afterEach(() => {
    serverAbortController.abort();
  });

  it("passes all scenarios", async () => {
    const router = createBasicRouter(
      {
        async simple(ctx, body) {
          deepStrictEqual(body, { name: "foo" });
          return { statusCode: 204 };
        },
      },
      {
        async simple(ctx, name) {
          deepStrictEqual(name, "foo");
          return { statusCode: 204 };
        },
      },
      testRouterOptions,
    );
    const baseUrl = await startServer(router, serverAbortController.signal);
    const { status } = await runScenario("parameters/basic/**/*", baseUrl);
    expect(status).toBe("pass");
  });
});
