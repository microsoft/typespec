import { ok, strictEqual } from "assert";
import { ModelType, Type } from "../../core/types.js";
import {
  BasicTestRunner,
  createTestHost,
  createTestWrapper,
  expectDiagnostics,
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
    runner = createTestWrapper(
      host,
      (code) => `
    import "./blue.js";
    ${code}
    `
    );
  });

  it("clones decorated properties", async () => {
    const { C } = (await runner.compile(`
      model A { @blue foo: string }
      model B { @blue bar: string }
      @test model C { ... A, ... B }
      `)) as { C: ModelType };

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
});
