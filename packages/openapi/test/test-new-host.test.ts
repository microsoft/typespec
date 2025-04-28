import { expectDiagnostics } from "@typespec/compiler/testing";
import { it } from "vitest";
import { Tester } from "./test-host.js";

it("case 1: pure", async () => {
  const [, diagnostics] = await Tester.compileAndDiagnose(`
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

const ImportWrap = Tester.wrap((c) => `import "@typespec/openapi";${c}`);

it("case 2: wraps", async () => {
  const diagnostics = await ImportWrap.diagnose(`
      using OpenAPI;
      @operationId("foo")
      model Foo {}
    `);

  expectDiagnostics(diagnostics, {
    code: "decorator-wrong-target",
    message: "Cannot apply @operationId decorator to Foo since it is not assignable to Operation",
  });
});

const LibsImported = Tester.importLibraries();

it("case 3: auto imports", async () => {
  const diagnostics = await LibsImported.diagnose(`
      using OpenAPI;
      @operationId("foo")
      model Foo {}
    `);

  expectDiagnostics(diagnostics, {
    code: "decorator-wrong-target",
    message: "Cannot apply @operationId decorator to Foo since it is not assignable to Operation",
  });
});

const LibsAndUsing = Tester.importLibraries().using("OpenAPI");

it("case 4: auto imports and auto using", async () => {
  const diagnostics = await LibsAndUsing.diagnose(`
      @operationId("foo")
      model Foo {}
    `);

  expectDiagnostics(diagnostics, {
    code: "decorator-wrong-target",
    message: "Cannot apply @operationId decorator to Foo since it is not assignable to Operation",
  });
});
