import { afterEach, assert, beforeEach, describe, expect, it } from "vitest";
import { createExtensibleRouter } from "../../../../generated/type/enum/extensible/src/generated/http/router.js";
import { startServer, testRouterOptions } from "../../../../helpers.js";
import { runScenario } from "../../../../spector.js";

describe("Type.Enum.Extensible", () => {
  let serverAbortController: AbortController;
  beforeEach(() => {
    serverAbortController = new AbortController();
  });
  afterEach(() => {
    serverAbortController.abort();
  });

  it("passes all scenarios", async () => {
    const router = createExtensibleRouter(
      {
        async getKnownValue(ctx) {
          return {
            contentType: "application/json",
            body: "Monday",
          };
        },
        async getUnknownValue(ctx) {
          return {
            contentType: "application/json",
            body: "Weekend",
          };
        },
        async putKnownValue(ctx, body) {
          assert.equal(body, "Monday");
          return;
        },
        async putUnknownValue(ctx, body) {
          assert.equal(body, "Weekend");
          return;
        },
      },
      testRouterOptions,
    );
    const baseUrl = await startServer(router, serverAbortController.signal);
    const { status } = await runScenario("type/enum/extensible/**/*", baseUrl);
    expect(status).toBe("pass");
  });
});
