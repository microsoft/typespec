import {
  EmitterTesterInstance,
  expectDiagnostics,
  TestEmitterCompileResult,
} from "@typespec/compiler/testing";
import { beforeEach, it } from "vitest";
import { EmitterTester, getStandardService } from "./test-host.js";

let tester: EmitterTesterInstance<TestEmitterCompileResult>;

beforeEach(async () => {
  tester = await EmitterTester.createInstance();
});

it("warns for custom scalars", async () => {
  const diagnostics = await tester.diagnose(
    getStandardService(`
      /** bar scalar */
      scalar bar;
    `),
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
  const diagnostics = await tester.diagnose(
    getStandardService(`
      /** the foo */
      model Foo {
        /**An imprecise integer property */
        integerProp: integer;
      }
    `),
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
  const diagnostics = await tester.diagnose(
    getStandardService(`
      /** the foo */
      model Foo {
        /**An imprecise floating point property */
        floatProp: float;
      }
    `),
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
  const diagnostics = await tester.diagnose(
    getStandardService(`
      /** the foo */
      model Foo {
        /**An imprecise numeric property */
        numericProp: numeric;
      }
    `),
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
  const diagnostics = await tester.diagnose(
    getStandardService(`
      /** A simple test model*/
    model Foo {
    #suppress "@azure-tools/typespec-azure-core/casing-style" "Testing"
      /** An invalid name test */
      \`**()invalid~~Name\`?: string = "This is a string literal";
    }
    `),
  );

  expectDiagnostics(diagnostics, [
    {
      code: "@typespec/http-server-csharp/invalid-identifier",
      message:
        "Invalid identifier '**()invalid~~Name' in property '**()invalid~~Name' in model Foo",
    },
  ]);
});

it("warns for invalid interpolation", async () => {
  const diagnostics = await tester.diagnose(
    getStandardService(`
      /** A simple test model*/
      model Foo {
        /** string literal */
        stringProp?: string;
        /** boolean literal */
        stringTemplateProp?: "\${Foo.stringProp} is a bad interpolation";
      }
    `),
  );

  expectDiagnostics(diagnostics, [
    {
      code: "@typespec/http-server-csharp/invalid-interpolation",
      message:
        "StringTemplate types should only reference literal-valued constants, enum members, or literal-valued model properties.  The interpolated value will not contain one or more referenced elements in generated code.",
    },
  ]);
});

it("warns for anonymous models", async () => {
  const diagnostics = await tester.diagnose(
    getStandardService(`
      /** A simple test model*/
      model Foo {
        /** Numeric literal */
        intProp: [8, 10];

        /** A complex property */
        modelProp: {
          bar: string;
        };

        anotherModelProp: {
          baz: string;
        };

        yetAnother: Foo.modelProp;

      }

      @route("/foo") op foo(): void;
      `),
  );

  expectDiagnostics(diagnostics, [
    {
      code: "@typespec/http-server-csharp/anonymous-model",
      message:
        "Inline models use generated names in emitted code. Consider defining each model with an explicit name.  This model will be named 'Model0' in emitted code",
    },
    {
      code: "@typespec/http-server-csharp/anonymous-model",
      message:
        "Inline models use generated names in emitted code. Consider defining each model with an explicit name.  This model will be named 'Model1' in emitted code",
    },
  ]);
});

it("warns for GET requests with explicit body parameters", async () => {
  const diagnostics = await tester.diagnose(
    getStandardService(
      `
      #suppress "@typespec/http-server-csharp/anonymous-model" "Test"
      @route("/foo") @get op foo(@body body?: { intProp?: int32}): void;
      `,
    ),
  );

  expectDiagnostics(diagnostics, [
    {
      code: "@typespec/http-server-csharp/get-request-body",
      message:
        "Get operations should not have request bodies. Generating an operation and interface without parameters, your business logic will use HttpContext to interpret Request properties.",
    },
  ]);
});
