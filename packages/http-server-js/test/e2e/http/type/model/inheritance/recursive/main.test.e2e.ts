import { afterEach, assert, beforeEach, describe, expect, it } from "vitest";
import { createRecursiveRouter } from "../../../../../generated/type/model/inheritance/recursive/src/generated/http/router.js";
import { startServer, testRouterOptions } from "../../../../../helpers.js";
import { runScenario } from "../../../../../spector.js";

describe("Type.Model.Inheritance.Recursive", () => {
  let serverAbortController: AbortController;
  beforeEach(() => {
    serverAbortController = new AbortController();
  });
  afterEach(() => {
    serverAbortController.abort();
  });

  it("passes all scenarios", async () => {
    const router = createRecursiveRouter(
      {
        async get(ctx) {
          return {
            level: 0,
            extension: [
              {
                level: 1,
                extension: [
                  {
                    level: 2,
                  },
                ],
              },
              {
                level: 1,
              },
            ],
          };
        },
        async put(ctx, input) {
          assert.deepStrictEqual(input, {
            level: 0,
            extension: [
              {
                level: 1,
                extension: [
                  {
                    level: 2,
                  },
                ],
              },
              {
                level: 1,
              },
            ],
          });
          return;
        },
      },
      testRouterOptions,
    );
    const baseUrl = await startServer(router, serverAbortController.signal);
    const { status } = await runScenario("type/model/inheritance/recursive/**/*", baseUrl);
    expect(status).toBe("pass");
  });
});
