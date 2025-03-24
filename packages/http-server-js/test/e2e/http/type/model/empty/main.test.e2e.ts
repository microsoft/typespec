import { deepStrictEqual } from "node:assert";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createEmptyRouter } from "../../../../generated/type/model/empty/src/generated/http/router.js";
import { startServer, testRouterOptions } from "../../../../helpers.js";
import { runScenario } from "../../../../spector.js";

describe("Type.Model.Empty", () => {
  let serverAbortController: AbortController;
  beforeEach(() => {
    serverAbortController = new AbortController();
  });
  afterEach(() => {
    serverAbortController.abort();
  });

  it("passes all scenarios", async () => {
    const router = createEmptyRouter(
      {
        async getEmpty(ctx) {
          return { body: {} };
        },
        async postRoundTripEmpty(ctx, body) {
          return { body };
        },
        async putEmpty(ctx, input) {
          deepStrictEqual(input, {});
        },
      },
      testRouterOptions,
    );
    const baseUrl = await startServer(router, serverAbortController.signal);
    const { status } = await runScenario("type/model/empty/**/*", baseUrl);
    expect(status).toBe("pass");
  });
});
