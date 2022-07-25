import { TestHost } from "@cadl-lang/compiler/testing";
import { ok, strictEqual } from "assert";
import { isBody, isHeader, isPathParam, isQueryParam } from "../src/http/decorators.js";
import { createRestTestHost } from "./test-host.js";

describe("rest: plain data", () => {
  let testHost: TestHost;

  beforeEach(async () => {
    testHost = await createRestTestHost();
  });

  it("removes header/query/body/path", async () => {
    testHost.addCadlFile(
      "main.cadl",
      `
      import "@cadl-lang/rest";
      using Cadl.Http;

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
      `
    );

    const { Before, After, Spread } = await testHost.compile("main.cadl");
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
        `query not expected in ${model.name}`
      );
      ok(
        !isPathParam(testHost.program, model.properties.get("c")!),
        `path not expected in ${model.name}`
      );
    }
  });
});
