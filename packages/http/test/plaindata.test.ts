import { t } from "@typespec/compiler/testing";
import { ok, strictEqual } from "assert";
import { describe, it } from "vitest";
import { isBody, isHeader, isPathParam, isQueryParam } from "../src/decorators.js";
import { Tester } from "./test-host.js";

describe("http: plain data", () => {
  it("removes header/query/body/path", async () => {
    const { Before, After, Spread, program } = await Tester.compile(t.code`
      model ${t.model("Before")} {
        @header a: string;
        @query b: string;
        @path c: string;
        @body d: string;
      }

      model ${t.model("After")} is PlainData<Before> {}

      model ${t.model("Spread")} {
        ...After
      }
    `);

    ok(isHeader(program, Before.properties.get("a")!), "header expected");
    ok(isBody(program, Before.properties.get("d")!), "body expected");
    ok(isQueryParam(program, Before.properties.get("b")!), "query expected");
    ok(isPathParam(program, Before.properties.get("c")!), "path expected");

    for (const model of [After, Spread]) {
      strictEqual(model.kind, "Model" as const);
      ok(!isHeader(program, model.properties.get("a")!), `header not expected in ${model.name}`);
      ok(!isBody(program, model.properties.get("d")!), `body not expected in ${model.name}`);
      ok(!isQueryParam(program, model.properties.get("b")!), `query not expected in ${model.name}`);
      ok(!isPathParam(program, model.properties.get("c")!), `path not expected in ${model.name}`);
    }
  });
});
