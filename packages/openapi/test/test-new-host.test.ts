import { expectDiagnostics } from "@typespec/compiler/testing";
import { it } from "vitest";
import { HostBuilder } from "./test-host.js";

it("works", async () => {
  const [, diagnostics] = await HostBuilder.compileAndDiagnose(`
      import "@typespec/openapi";
      using OpenAPI;
      @operationId("foo")
      model Foo {}
    `);

  expectDiagnostics(diagnostics, {
    code: "decorator-wrong-target",
    message: "Cannot apply @operationId decorator to Foo since it is not assignable to Operation",
  });
});
