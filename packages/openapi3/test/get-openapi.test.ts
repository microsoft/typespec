import { expectDiagnostics } from "@typespec/compiler/testing";
import { deepStrictEqual, ok, strictEqual } from "assert";
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
  const itemSchema = documentRecord.document.components!.schemas!["Item"];
  ok(itemSchema, "should have Item schema");
  ok("type" in itemSchema, "Item schema should have type");
  strictEqual(itemSchema.type, "object");
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

it("applies component naming independently to each service through the object API", async () => {
  const { program } = await ApiTester.compile(`
    import "@typespec/http";
    using Http;
    @service namespace First {
      namespace Models { model User_Profile { first: string; } }
      @get op read(): Models.User_Profile;
    }
    @service namespace Second {
      namespace Models { model User_Profile { second: string; } }
      @get op read(): Models.User_Profile;
    }
  `);
  const records = await getOpenAPI3(program, {
    "component-name-strategy": "name-only",
  });
  strictEqual(records.length, 2);
  for (const [index, record] of records.entries()) {
    ok(!record.versioned);
    expectDiagnostics(record.diagnostics, []);
    const schemas = record.document.components!.schemas!;
    deepStrictEqual(Object.keys(schemas), ["User_Profile"]);
    deepStrictEqual(Object.keys((schemas.User_Profile as any).properties), [
      index === 0 ? "first" : "second",
    ]);
  }
});
