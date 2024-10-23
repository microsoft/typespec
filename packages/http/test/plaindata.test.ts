import { TestHost } from "@typespec/compiler/testing";
import { ok, strictEqual } from "assert";
import { beforeEach, describe, it } from "vitest";
import { isBody, isHeader, isPathParam, isQueryParam } from "../src/decorators.js";
import { createHttpTestHost } from "./test-host.js";

describe("http: plain data", () => {
  let testHost: TestHost;

  beforeEach(async () => {
    testHost = await createHttpTestHost();
  });

  it("removes header/query/body/path", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      import "@typespec/http";
      using TypeSpec.Http;

      @test
      model Before {
        @header a: string;
        @query b: string;
        @path c: string;
        @body d: string;
      }

      @test
      model After is PlainData<Before> {}

      @test
      model Spread {
        ...After
      }
      `,
    );

    const { Before, After, Spread } = await testHost.compile("main.tsp");
    const program = testHost.program;

    strictEqual(Before.kind, "Model" as const);
    ok(isHeader(program, Before.properties.get("a")!), "header expected");
    ok(isBody(program, Before.properties.get("d")!), "body expected");
    ok(isQueryParam(testHost.program, Before.properties.get("b")!), "query expected");
    ok(isPathParam(testHost.program, Before.properties.get("c")!), "path expected");

    for (const model of [After, Spread]) {
      strictEqual(model.kind, "Model" as const);
      ok(!isHeader(program, model.properties.get("a")!), `header not expected in ${model.name}`);
      ok(!isBody(program, model.properties.get("d")!), `body not expected in ${model.name}`);
      ok(
        !isQueryParam(testHost.program, model.properties.get("b")!),
        `query not expected in ${model.name}`,
      );
      ok(
        !isPathParam(testHost.program, model.properties.get("c")!),
        `path not expected in ${model.name}`,
      );
    }
  });
});
