import { expectDiagnostics } from "@typespec/compiler/testing";
import { ok, strictEqual } from "assert";
import { it } from "vitest";
import { getOpenAPI3 } from "../src/openapi.js";
import { ApiTester } from "./test-host.js";

it("can get openapi as an object", async () => {
  const { program } = await ApiTester.compile(`
    import "@typespec/http";
    import "@typespec/openapi";
    import "@typespec/openapi3";
    using Http;

    @service
    namespace Foo;
    
    @get op get(): Item;

    model Item { x: true }
    model Bar { }; // unreachable
  `);
  const output = await getOpenAPI3(program, { "omit-unreachable-types": false });
  const documentRecord = output[0];
  ok(!documentRecord.versioned, "should not be versioned");
  strictEqual(documentRecord.document.components!.schemas!["Item"].type, "object");
});

it("has diagnostics", async () => {
  const { program } = await ApiTester.compile(`
    import "@typespec/http";
    using Http;

    @service
    namespace Foo;
    
    op read(): {@minValue(455) @maxValue(495) @statusCode _: int32, content: string};
   `);
  const output = await getOpenAPI3(program, { "omit-unreachable-types": false });
  const documentRecord = output[0];
  ok(!documentRecord.versioned, "should not be versioned");
  expectDiagnostics(documentRecord.diagnostics, [
    {
      code: "@typespec/openapi3/unsupported-status-code-range",
      message:
        "Status code range '455 to '495' is not supported. OpenAPI 3.0 can only represent range 1XX, 2XX, 3XX, 4XX and 5XX. Example: `@minValue(400) @maxValue(499)` for 4XX.",
    },
  ]);
});
