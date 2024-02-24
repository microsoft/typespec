import { strictEqual } from "assert";
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
   `
  );
  await host.compile("main.tsp");
  const output = await getOpenAPI3(host.program, { "omit-unreachable-types": false });
  strictEqual((output[0] as any).document.components!.schemas!["Item"].type, "object");
});
