import { deepStrictEqual } from "node:assert";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createSpreadRouter } from "../../../generated/parameters/spread/src/generated/http/router.js";
import { startServer, testRouterOptions } from "../../../helpers.js";
import { runScenario } from "../../../spector.js";

describe("Parameters.Spread", () => {
  let serverAbortController: AbortController;
  beforeEach(() => {
    serverAbortController = new AbortController();
  });
  afterEach(() => {
    serverAbortController.abort();
  });

  it("passes all scenarios", async () => {
    const router = createSpreadRouter(
      {
        async spreadAsRequestBody(ctx, name) {
          deepStrictEqual(name, "foo");
          return { statusCode: 204 };
        },
        async spreadCompositeRequest(ctx, name, testHeader, body) {
          deepStrictEqual(name, "foo");
          deepStrictEqual(testHeader, "bar");
          deepStrictEqual(body, { name: "foo" });
          return { statusCode: 204 };
        },
        async spreadCompositeRequestMix(ctx, name, testHeader, prop) {
          deepStrictEqual(name, "foo");
          deepStrictEqual(testHeader, "bar");
          deepStrictEqual(prop, "foo");
          return { statusCode: 204 };
        },
        async spreadCompositeRequestOnlyWithBody(ctx, body) {
          deepStrictEqual(body, { name: "foo" });
          return { statusCode: 204 };
        },
        async spreadCompositeRequestWithoutBody(ctx, name, testHeader) {
          deepStrictEqual(name, "foo");
          deepStrictEqual(testHeader, "bar");
          return { statusCode: 204 };
        },
      },
      {
        async spreadAsRequestBody(ctx, name) {
          deepStrictEqual(name, "foo");
          return { statusCode: 204 };
        },
        async spreadAsRequestParameter(ctx, id, xMsTestHeader, name) {
          deepStrictEqual(id, "1");
          deepStrictEqual(xMsTestHeader, "bar");
          deepStrictEqual(name, "foo");
          return { statusCode: 204 };
        },
        async spreadParameterWithInnerAlias(ctx, id, name, age, xMsTestHeader) {
          deepStrictEqual(id, "1");
          deepStrictEqual(name, "foo");
          deepStrictEqual(age, 1);
          deepStrictEqual(xMsTestHeader, "bar");
          return { statusCode: 204 };
        },
        async spreadParameterWithInnerModel(ctx, id, name, xMsTestHeader) {
          deepStrictEqual(id, "1");
          deepStrictEqual(name, "foo");
          deepStrictEqual(xMsTestHeader, "bar");
          return { statusCode: 204 };
        },
        async spreadWithMultipleParameters(
          ctx,
          id,
          xMsTestHeader,
          requiredString,
          requiredIntList,
          options,
        ) {
          deepStrictEqual(id, "1");
          deepStrictEqual(xMsTestHeader, "bar");
          deepStrictEqual(requiredString, "foo");
          deepStrictEqual(requiredIntList, [1, 2]);
          deepStrictEqual(options?.optionalInt, 1);
          deepStrictEqual(options?.optionalStringList, ["foo", "bar"]);
          return { statusCode: 204 };
        },
      },
      testRouterOptions,
    );
    const baseUrl = await startServer(router, serverAbortController.signal);
    const { status } = await runScenario("parameters/spread/**/*", baseUrl);
    expect(status).toBe("pass");
  });
});
