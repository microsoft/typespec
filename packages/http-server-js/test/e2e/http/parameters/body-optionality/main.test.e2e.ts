import { deepStrictEqual } from "node:assert";
import { afterEach, assert, beforeEach, describe, expect, it } from "vitest";
import { createBodyOptionalityRouter } from "../../../generated/parameters/body-optionality/src/generated/http/router.js";
import { startServer, testRouterOptions } from "../../../helpers.js";
import { runScenario } from "../../../spector.js";

describe("Parameters.BodyOptionality", () => {
  let serverAbortController: AbortController;
  beforeEach(() => {
    serverAbortController = new AbortController();
  });
  afterEach(() => {
    serverAbortController.abort();
  });

  it("passes all scenarios", async () => {
    const router = createBodyOptionalityRouter(
      {
        async requiredExplicit(ctx, body) {
          deepStrictEqual(body, { name: "foo" });
          return { statusCode: 204 };
        },
        async requiredImplicit(ctx, name) {
          deepStrictEqual(name, "foo");
          return { statusCode: 204 };
        },
      },
      {
        async omit(ctx, options) {
          assert.isUndefined(options?.body);
          return { statusCode: 204 };
        },
        async set(ctx, options) {
          assert(options?.body);
          assert.deepStrictEqual(options.body, { name: "foo" });
          return { statusCode: 204 };
        },
      },
      testRouterOptions,
    );
    const baseUrl = await startServer(router, serverAbortController.signal);
    // Skipping optional explicit scenarios: https://github.com/microsoft/typespec/issues/6561
    const { status } = await runScenario(
      "parameters/bodyoptionality/**/!(optionalexplicit)*",
      baseUrl,
    );
    expect(status).toBe("pass");
  });
});
