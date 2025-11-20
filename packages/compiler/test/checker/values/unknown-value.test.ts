import { strictEqual } from "assert";
import { beforeEach, describe, it } from "vitest";
import { DecoratorContext, Program, Type, Value } from "../../../src/index.js";
import { expectDiagnostics } from "../../../src/testing/expect.js";
import { createTestHost, createTestRunner } from "../../../src/testing/test-host.js";
import { BasicTestRunner, TestHost } from "../../../src/testing/types.js";

describe("invalid uses of unknown value", () => {
  let host: TestHost;
  let runner: BasicTestRunner;
  let observedValue: Value | null = null;

  beforeEach(async () => {
    host = await createTestHost();
    host.addJsFile("lib.js", {
      $collect: (_context: DecoratorContext, _target: Type, value: Value) => {
        observedValue = value;
      },
      $functions: {
        Items: {
          echo: (_: Program, value: Value) => {
            observedValue = value;

            return value;
          },
        },
      },
    });
    runner = await createTestRunner(host);
  });

  it("cannot be passed to a decorator", async () => {
    const diags = await runner.diagnose(`
      import "./lib.js";

      extern dec collect(target: Reflection.Model, value: valueof unknown);

      @collect(unknown)
      model Test {}
    `);

    strictEqual(observedValue, null);

    expectDiagnostics(diags, [
      {
        code: "unknown-value",
        message: "The 'unknown' value cannot be used as an argument to a function or decorator.",
        severity: "error",
      },
    ]);
  });

  it("cannot be passed to a function", async () => {
    const diags = await runner.diagnose(`
      import "./lib.js";

      namespace Items {
        extern fn echo(value: valueof unknown): valueof unknown;
      }

      const x = Items.echo(unknown);
    `);

    strictEqual(observedValue, null);

    expectDiagnostics(diags, [
      {
        code: "unknown-value",
        message: "The 'unknown' value cannot be used as an argument to a function or decorator.",
        severity: "error",
      },
    ]);
  });
});

describe("usage", () => {
  let host: TestHost;
  let runner: BasicTestRunner;

  beforeEach(async () => {
    host = await createTestHost();
    runner = await createTestRunner(host);
  });

  for (const typeDescriptor of [
    "unknown",
    "string",
    "int32",
    "boolean",
    "model Foo",
    "union Bar",
    "enum Baz",
    "string[]",
    "Record<int32>",
  ]) {
    const type = typeDescriptor.replace(/^(model|union|enum) /, "");

    it(`can be assigned to variable of type valueof '${typeDescriptor}'`, async () => {
      const diags = await runner.diagnose(`
        model Foo {
          example: string;
        }

        union Bar {
          foo: Foo;
          baz: Baz;
        }

        enum Baz {
          A,
          B,
          C,
        }

        const x: ${type} = unknown;
      `);

      expectDiagnostics(diags, []);
    });
  }
});
