import { ok, strictEqual } from "assert";
import { Model, Type } from "../../core/types.js";
import {
  BasicTestRunner,
  createTestHost,
  createTestWrapper,
  expectDiagnostics,
  extractSquiggles,
} from "../../testing/index.js";

describe("compiler: spread", () => {
  const blues = new WeakSet();
  function $blue(_: any, target: Type) {
    blues.add(target);
  }

  let runner: BasicTestRunner;

  beforeEach(async () => {
    const host = await createTestHost();
    host.addJsFile("blue.js", { $blue });
    runner = createTestWrapper(host, (code) => code);
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

  it("doesn't emit additional diagnostic if spread reference is unknown-identitfier", async () => {
    const diagnostics = await runner.diagnose(`
      model Foo {
        ...NotDefined
      }
      `);

    expectDiagnostics(diagnostics, {
      code: "unknown-identifier",
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

  it("emit diagnostic if spreading type not allowing properties", async () => {
    const diagnostics = await runner.diagnose(`
      model Foo {
        ...string
      }
      `);

    expectDiagnostics(diagnostics, {
      code: "spread-model",
      message: "Cannot spread type because it cannot hold properties.",
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
