import { afterEach, assert, beforeEach, describe, expect, it } from "vitest";
import { createNotDiscriminatedRouter } from "../../../../../generated/type/model/inheritance/not-discriminated/src/generated/http/router.js";
import { startServer, testRouterOptions } from "../../../../../helpers.js";
import { runScenario } from "../../../../../spector.js";

describe("Type.Model.Inheritance.NotDiscriminated", () => {
  let serverAbortController: AbortController;
  beforeEach(() => {
    serverAbortController = new AbortController();
  });
  afterEach(() => {
    serverAbortController.abort();
  });

  it("passes all scenarios", async () => {
    const router = createNotDiscriminatedRouter(
      {
        async getValid(ctx) {
          return { name: "abc", age: 32, smart: true };
        },
        async postValid(ctx, input) {
          assert.deepStrictEqual(input, { name: "abc", age: 32, smart: true });
          return { statusCode: 204 };
        },
        async putValid(ctx, input) {
          assert.deepStrictEqual(input, { name: "abc", age: 32, smart: true });
          return { name: "abc", age: 32, smart: true };
        },
      },
      testRouterOptions,
    );
    const baseUrl = await startServer(router, serverAbortController.signal);
    const { status } = await runScenario("type/model/inheritance/notdiscriminated/**/*", baseUrl);
    expect(status).toBe("pass");
  });
});
