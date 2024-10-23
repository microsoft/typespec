import { rejects, strictEqual } from "assert";
import { beforeEach, describe, it } from "vitest";
import { Model } from "../../src/core/types.js";
import {
  TestHost,
  createTestHost,
  expectDiagnosticEmpty,
  expectDiagnostics,
} from "../../src/testing/index.js";

describe("compiler: using statements", () => {
  let testHost: TestHost;

  beforeEach(async () => {
    testHost = await createTestHost();
  });

  it("works in global scope", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      import "./a.tsp";
      import "./b.tsp";
      `,
    );
    testHost.addTypeSpecFile(
      "a.tsp",
      `
      namespace N;
      model X { x: int32 }
      `,
    );
    testHost.addTypeSpecFile(
      "b.tsp",
      `
      using N;
      @test model Y { ... X }
      `,
    );

    const { Y } = (await testHost.compile("./")) as {
      Y: Model;
    };

    strictEqual(Y.properties.size, 1);
  });

  it("works in namespaces", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      import "./a.tsp";
      import "./b.tsp";
      `,
    );
    testHost.addTypeSpecFile(
      "a.tsp",
      `
      namespace N;
      model X { x: int32 }
      `,
    );
    testHost.addTypeSpecFile(
      "b.tsp",
      `
      namespace Z;
      using N;
      @test model Y { ... X }
      `,
    );

    const { Y } = (await testHost.compile("./")) as {
      Y: Model;
    };

    strictEqual(Y.properties.size, 1);
  });

  it("works with dotted namespaces", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      import "./a.tsp";
      import "./b.tsp";
      `,
    );
    testHost.addTypeSpecFile(
      "a.tsp",
      `
      namespace N.M;
      model X { x: int32 }
      `,
    );
    testHost.addTypeSpecFile(
      "b.tsp",
      `
      using N.M;
      @test model Y { ... X }
      `,
    );

    const { Y } = (await testHost.compile("./")) as {
      Y: Model;
    };

    strictEqual(Y.properties.size, 1);
  });

  it("TypeSpec.Xyz namespace doesn't need TypeSpec prefix in using", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      import "./a.tsp";
      import "./b.tsp";
      `,
    );
    testHost.addTypeSpecFile(
      "a.tsp",
      `
      namespace TypeSpec.Xyz;
      model X { x: int32 }
      `,
    );
    testHost.addTypeSpecFile(
      "b.tsp",
      `
      using Xyz;
      @test model Y { ... X }
      `,
    );

    const { Y } = (await testHost.compile("./")) as {
      Y: Model;
    };

    strictEqual(Y.properties.size, 1);
  });

  it("can use 2 namespace with the same last name", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      import "./a.tsp";
      import "./b.tsp";
      `,
    );
    testHost.addTypeSpecFile(
      "a.tsp",
      `
      namespace N.A {
        model B { }
      }

      namespace M.A {
        model B { }
      }
      `,
    );

    testHost.addTypeSpecFile(
      "b.tsp",
      `
      using N.A;
      using M.A;
      `,
    );

    const diagnostics = await testHost.diagnose("./");
    expectDiagnosticEmpty(diagnostics);
  });

  it("throws errors for duplicate imported usings", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      import "./a.tsp";
      import "./b.tsp";
      `,
    );
    testHost.addTypeSpecFile(
      "a.tsp",
      `
      namespace N.M;
      model X { x: int32 }
      `,
    );

    testHost.addTypeSpecFile(
      "b.tsp",
      `
      using N.M;
      using N.M;
      `,
    );

    const diagnostics = await testHost.diagnose("./");
    strictEqual(diagnostics.length, 1);
    strictEqual(diagnostics[0].code, "duplicate-using");
    strictEqual(diagnostics[0].message, 'duplicate using of "N.M" namespace');
  });

  it("does not throws errors for different usings with the same bindings if not used", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      import "./a.tsp";
      import "./b.tsp";
      `,
    );
    testHost.addTypeSpecFile(
      "a.tsp",
      `
      namespace N {
        model A { }
      }

      namespace M {
        model A { }
      }
      `,
    );

    testHost.addTypeSpecFile(
      "b.tsp",
      `
      using N;
      using M;
      `,
    );

    const diagnostics = await testHost.diagnose("./");
    expectDiagnosticEmpty(diagnostics);
  });

  it("report ambiguous diagnostics when using name present in multiple using", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      import "./a.tsp";
      import "./b.tsp";
      `,
    );
    testHost.addTypeSpecFile(
      "a.tsp",
      `
      namespace N {
        model A { }
      }

      namespace M {
        model A { }
      }
      `,
    );

    testHost.addTypeSpecFile(
      "b.tsp",
      `
      using N;
      using M;

      model B extends A {}
      `,
    );
    const diagnostics = await testHost.diagnose("./", { nostdlib: true });
    expectDiagnostics(diagnostics, [
      {
        code: "ambiguous-symbol",
        message:
          '"A" is an ambiguous name between N.A, M.A. Try using fully qualified name instead: N.A, M.A',
      },
    ]);
  });

  it("report ambiguous diagnostics when symbol exists in using namespace and global namespace", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      import "./a.tsp";
      import "./b.tsp";
      `,
    );
    testHost.addTypeSpecFile(
      "a.tsp",
      `
      model M {}

      using B;
      
      model Q extends M {}
      `,
    );
    testHost.addTypeSpecFile(
      "b.tsp",
      `
      namespace B {
        model M { }
      }
      `,
    );

    const diagnostics = await testHost.diagnose("./", { nostdlib: true });
    expectDiagnostics(diagnostics, [
      {
        code: "ambiguous-symbol",
        message:
          '"M" is an ambiguous name between global.M, B.M. Try using fully qualified name instead: global.M, B.M',
      },
    ]);
  });

  it("reports ambiguous symbol for decorator", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      import "./doc.js";
      namespace Test;

      namespace A {
        extern dec doc(target: unknown);
      }

      using A;

      @doc
      namespace Foo {}
      `,
    );

    testHost.addJsFile("doc.js", {
      namespace: "Test.A",
      $doc() {},
    });

    const diagnostics = await testHost.diagnose("./");
    expectDiagnostics(diagnostics, [
      {
        code: "ambiguous-symbol",
        message: `"doc" is an ambiguous name between TypeSpec.doc, Test.A.doc. Try using fully qualified name instead: TypeSpec.doc, Test.A.doc`,
      },
      { code: "unknown-decorator" },
    ]);
  });

  it("reports ambiguous symbol for decorator with missing implementation", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      namespace Test;

      namespace A {
        extern dec doc(target: unknown);
      }

      using A;

      @doc
      namespace Foo {}
      `,
    );

    const diagnostics = await testHost.diagnose("./");
    expectDiagnostics(diagnostics, [
      {
        code: "ambiguous-symbol",
        message: `"doc" is an ambiguous name between TypeSpec.doc, Test.A.doc. Try using fully qualified name instead: TypeSpec.doc, Test.A.doc`,
      },
      { code: "unknown-decorator" },
      { code: "missing-implementation" },
    ]);
  });

  it("ambiguous use doesn't affect other files", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      import "./a.tsp";
      import "./ambiguous.tsp";
      import "./notambiguous.tsp";
      `,
    );
    testHost.addTypeSpecFile(
      "a.tsp",
      `
      namespace N {
        model A { }
      }

      namespace M {
        model A { }
      }
      `,
    );

    testHost.addTypeSpecFile(
      "ambiguous.tsp",
      `
      using N;
      using M;

      model Ambiguous extends A {}
      `,
    );

    testHost.addTypeSpecFile(
      "notambiguous.tsp",
      `
      using N;

      model NotAmbiguous extends A {}
      `,
    );
    const diagnostics = await testHost.diagnose("./");
    expectDiagnostics(diagnostics, [
      {
        code: "ambiguous-symbol",
        message:
          '"A" is an ambiguous name between N.A, M.A. Try using fully qualified name instead: N.A, M.A',
        file: /ambiguous\.tsp$/,
      },
    ]);
  });

  it("resolves 'local' decls over usings", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      import "./a.tsp";
      import "./b.tsp";
      `,
    );
    testHost.addTypeSpecFile(
      "a.tsp",
      `
      namespace N;
      model A { a: string }
      `,
    );

    testHost.addTypeSpecFile(
      "b.tsp",
      `
      using N;
      namespace B {
        model A { a: int32 | string }
        @test model B { ... A }
      }
      `,
    );

    const { B } = (await testHost.compile("./")) as {
      B: Model;
    };
    strictEqual(B.properties.size, 1);
    strictEqual(B.properties.get("a")!.type.kind, "Union");
  });

  it("usings are local to a file", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      import "./a.tsp";
      import "./b.tsp";
      `,
    );
    testHost.addTypeSpecFile(
      "a.tsp",
      `
      namespace N;
      model A { a: string }
      `,
    );

    testHost.addTypeSpecFile(
      "b.tsp",
      `
      namespace M {
        using N;
      }
      
      namespace M {
        model X { a: A };
      }
      `,
    );

    await rejects(testHost.compile("./"));
  });
  it("TypeSpec namespace is automatically using'd", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      namespace Foo;
      model test { x: int32 };
    `,
    );

    await testHost.compile("./");
  });

  it("works when the using'd namespace is merged after the current namespace", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      import "./other.tsp";
      namespace Main;
      using Other;
      model Thing {
        other: OtherModel;
      }
    `,
    );
    testHost.addTypeSpecFile(
      "other.tsp",
      `
      namespace Other;

      model OtherModel {
      }
    `,
    );
    await testHost.compile("./");
  });

  describe("emit diagnostic when using non-namespace types", () => {
    [
      ["model", "model Target {}"],
      ["enum", "enum Target {}"],
      ["union", "union Target {}"],
      ["scalar", "scalar Target;"],
      ["interface", "interface Target {}"],
      ["operation", "op Target(): void;"],
    ].forEach(([name, code]) => {
      it(name, async () => {
        testHost.addTypeSpecFile(
          "main.tsp",
          `
          using Target;
          ${code}
        `,
        );

        const diagnostics = await testHost.diagnose("./");
        expectDiagnostics(diagnostics, {
          code: "using-invalid-ref",
          message: "Using must refer to a namespace",
        });
      });
    });
  });
});
