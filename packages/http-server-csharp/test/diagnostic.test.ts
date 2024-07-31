import { BasicTestRunner, expectDiagnostics } from "@typespec/compiler/testing";
import { beforeEach, it } from "vitest";
import { createCSharpServiceEmitterTestRunner, getStandardService } from "./test-host.js";
let runner: BasicTestRunner;

beforeEach(async () => {
  runner = await createCSharpServiceEmitterTestRunner();
});

it("warns for custom scalars", async () => {
  const [_, diagnostics] = await runner.compileAndDiagnose(
    getStandardService(`
      /** bar scalar */
      scalar bar;
    `)
  );

  expectDiagnostics(diagnostics, [
    {
      code: "@typespec/http-server-csharp/unrecognized-scalar",
      message:
        "Scalar type bar is not a recognized scalar type.  Please use or extend a built-in scalar type.",
    },
  ]);
});

it("warns for integer", async () => {
  const [_, diagnostics] = await runner.compileAndDiagnose(
    getStandardService(`
      /** the foo */
      model Foo {
        /**An imprecise integer property */
        integerProp: integer;
      }
    `)
  );

  expectDiagnostics(diagnostics, [
    {
      code: "@typespec/http-server-csharp/no-numeric",
      message:
        "Type 'integer' is an imprecise type that does not map directly to a single numeric type, using 'long' as the safest c# numeric type.  Please specify a more precise numeric type, like 'int32' or 'float64'",
    },
  ]);
});

it("warns for float", async () => {
  const [_, diagnostics] = await runner.compileAndDiagnose(
    getStandardService(`
      /** the foo */
      model Foo {
        /**An imprecise floating point property */
        floatProp: float;
      }
    `)
  );

  expectDiagnostics(diagnostics, [
    {
      code: "@typespec/http-server-csharp/no-numeric",
      message:
        "Type 'float' is an imprecise type that does not map directly to a single numeric type, using 'double' as the safest c# numeric type.  Please specify a more precise numeric type, like 'int32' or 'float64'",
    },
  ]);
});

it("warns for numeric", async () => {
  const [_, diagnostics] = await runner.compileAndDiagnose(
    getStandardService(`
      /** the foo */
      model Foo {
        /**An imprecise numeric property */
        numericProp: numeric;
      }
    `)
  );

  expectDiagnostics(diagnostics, [
    {
      code: "@typespec/http-server-csharp/no-numeric",
      message:
        "Type 'numeric' is an imprecise type that does not map directly to a single numeric type, using 'object' as the safest c# numeric type.  Please specify a more precise numeric type, like 'int32' or 'float64'",
    },
  ]);
});

it("warns for invalid identifiers", async () => {
  const [_, diagnostics] = await runner.compileAndDiagnose(
    getStandardService(`
      /** A simple test model*/
    model Foo {
    #suppress "@azure-tools/typespec-azure-core/casing-style" "Testing"
      /** An invalid name test */
      \`**()invalid~~Name\`?: string = "This is a string literal";
    }
    `)
  );

  expectDiagnostics(diagnostics, [
    {
      code: "@typespec/http-server-csharp/invalid-identifier",
      message:
        "Invalid identifier '**()invalid~~Name' in property '**()invalid~~Name' in model Foo",
    },
  ]);
});
