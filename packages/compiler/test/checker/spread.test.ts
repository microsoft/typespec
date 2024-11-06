import { ok, strictEqual } from "assert";
import { beforeEach, describe, it } from "vitest";
import { Model, Type } from "../../src/core/types.js";
import {
  BasicTestRunner,
  createTestHost,
  createTestWrapper,
  expectDiagnostics,
  extractSquiggles,
} from "../../src/testing/index.js";

describe("compiler: spread", () => {
  const blues = new WeakSet();
  function $blue(_: any, target: Type) {
    blues.add(target);
  }

  let runner: BasicTestRunner;

  beforeEach(async () => {
    const host = await createTestHost();
    host.addJsFile("blue.js", { $blue });
    runner = createTestWrapper(host);
  });

  it("clones decorated properties", async () => {
    const { C } = (await runner.compile(`
      import "./blue.js";
      model A { @blue foo: string }
      model B { @blue bar: string }
      @test model C { ... A, ... B }
      `)) as { C: Model };

    strictEqual(C.kind, "Model");
    strictEqual(C.properties.size, 2);

    for (const [_, prop] of C.properties) {
      ok(blues.has(prop), prop.name + " is blue");
    }
  });

  it("doesn't emit additional diagnostic if spread reference is invalid-ref", async () => {
    const diagnostics = await runner.diagnose(`
      model Foo {
        ...NotDefined
      }
      `);

    expectDiagnostics(diagnostics, {
      code: "invalid-ref",
      message: "Unknown identifier NotDefined",
    });
  });

  it("emit diagnostic if spreading non model type", async () => {
    const diagnostics = await runner.diagnose(`
      alias U = (string | int32);
      model Foo {
        ...U
      }
      `);

    expectDiagnostics(diagnostics, {
      code: "spread-model",
      message: "Cannot spread properties of non-model type.",
    });
  });

  it("emit diagnostic if model spreads itself", async () => {
    const diagnostics = await runner.diagnose(`
      model Foo {
        ...Foo,
        name: string,
      }
      `);

    expectDiagnostics(diagnostics, {
      code: "spread-model",
      message: "Cannot spread type within its own declaration.",
    });
  });

  it("emit diagnostic if model spreads itself through alias", async () => {
    const diagnostics = await runner.diagnose(`
      model Foo {
        ...Bar,
        name: string,
      }
      alias Bar = Foo;
      `);

    expectDiagnostics(diagnostics, {
      code: "spread-model",
      message: "Cannot spread type within its own declaration.",
    });
  });

  it("emit diagnostic if spreading scalar type", async () => {
    const diagnostics = await runner.diagnose(`
      model Foo {
        ...string
      }
      `);

    expectDiagnostics(diagnostics, {
      code: "spread-model",
      message: "Cannot spread properties of non-model type.",
    });
  });

  it("emits duplicate diagnostic at correct location", async () => {
    const { source, pos, end } = extractSquiggles(`
      model Foo { 
        x: string 
      } 
      model Bar { 
        x: string, 
        ~~~...Foo~~~
      }
    `);

    const diagnostics = await runner.diagnose(source);
    expectDiagnostics(diagnostics, {
      code: "duplicate-property",
      pos,
      end,
    });
  });
});
