import { expectDiagnostics } from "@typespec/compiler/testing";
import { ok, strictEqual } from "assert";
import { it } from "vitest";
import { getOpenAPI3 } from "../src/openapi.js";
import { createOpenAPITestHost } from "./test-host.js";

it("can get openapi as an object", async () => {
  const host = await createOpenAPITestHost();
  host.addTypeSpecFile(
    "./main.tsp",
    `import "@typespec/http";
    import "@typespec/rest";
    import "@typespec/openapi";
    import "@typespec/openapi3";
    using TypeSpec.Rest;
    using TypeSpec.Http;
    using TypeSpec.OpenAPI;

    @service
    namespace Foo;
    
    @get op get(): Item;

    model Item { x: true }
    model Bar { }; // unreachable
   `,
  );
  await host.compile("main.tsp");
  const output = await getOpenAPI3(host.program, { "omit-unreachable-types": false });
  const documentRecord = output[0];
  ok(!documentRecord.versioned, "should not be versioned");
  strictEqual(documentRecord.document.components!.schemas!["Item"].type, "object");
});

it("has diagnostics", async () => {
  const host = await createOpenAPITestHost();
  host.addTypeSpecFile(
    "./main.tsp",
    `import "@typespec/http";
    import "@typespec/rest";
    import "@typespec/openapi";
    import "@typespec/openapi3";
    using TypeSpec.Rest;
    using TypeSpec.Http;
    using TypeSpec.OpenAPI;

    @service
    namespace Foo;
    
    op read(): {@minValue(455) @maxValue(495) @statusCode _: int32, content: string};
   `,
  );
  await host.compile("main.tsp");
  const output = await getOpenAPI3(host.program, { "omit-unreachable-types": false });
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
