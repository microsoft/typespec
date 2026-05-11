import { rejects, strictEqual } from "assert";
import { describe, it } from "vitest";
import { expectDiagnosticEmpty, expectDiagnostics, mockFile, t } from "../../src/testing/index.js";
import { Tester } from "../tester.js";

describe("compiler: using statements", () => {
  it("works in global scope", async () => {
    const { Y } = await Tester.files({
      "a.tsp": `
      namespace N;
      model X { x: int32 }
      `,
    }).compile(t.code`
      import "./a.tsp";
      using N;
      model ${t.model("Y")} { ... X }
    `);

    strictEqual(Y.properties.size, 1);
  });

  it("works in namespaces", async () => {
    const { Y } = await Tester.files({
      "a.tsp": `
      namespace N;
      model X { x: int32 }
      `,
    }).compile(t.code`
      import "./a.tsp";
      namespace Z;
      using N;
      model ${t.model("Y")} { ... X }
    `);

    strictEqual(Y.properties.size, 1);
  });

  it("works with dotted namespaces", async () => {
    const { Y } = await Tester.files({
      "a.tsp": `
      namespace N.M;
      model X { x: int32 }
      `,
    }).compile(t.code`
      import "./a.tsp";
      using N.M;
      model ${t.model("Y")} { ... X }
    `);

    strictEqual(Y.properties.size, 1);
  });

  // This is checking a case where when using a namespace it would start linking its content
  // before the using of the file were resolved themself causing invalid refs.
  it("using a namespace won't start linking it", async () => {
    const diagnostics = await Tester.files({
      "a.tsp": `
      import "./b.tsp";
      using B;
      namespace A { model AModel { b: BModel } }
      `,
      "b.tsp": `namespace B { model BModel {} }`,
    }).diagnose(`
      import "./a.tsp";
      using A;
    `);

    expectDiagnosticEmpty(diagnostics);
  });

  it("TypeSpec.Xyz namespace doesn't need TypeSpec prefix in using", async () => {
    const { Y } = await Tester.files({
      "a.tsp": `
      namespace TypeSpec.Xyz;
      model X { x: int32 }
      `,
    }).compile(t.code`
      import "./a.tsp";
      using Xyz;
      model ${t.model("Y")} { ... X }
    `);

    strictEqual(Y.properties.size, 1);
  });

  it("can use 2 namespace with the same last name", async () => {
    const diagnostics = await Tester.files({
      "a.tsp": `
      namespace N.A {
        model B { }
      }

      namespace M.A {
        model B { }
      }
      `,
      "b.tsp": `
      using N.A;
      using M.A;
      `,
    }).diagnose(`
      import "./a.tsp";
      import "./b.tsp";
    `);
    expectDiagnosticEmpty(diagnostics);
  });

  describe("duplicate usings", () => {
    it("doesn't consider using scoped in namespace as duplicate", async () => {
      const diagnostics = await Tester.files({
        "a.tsp": `namespace A { model AModel {} }`,
      }).diagnose(`
        import "./a.tsp";
        using A;

        namespace B {
          using A;
        }
        namespace C {
          using A;
        }
      `);
      expectDiagnosticEmpty(diagnostics);
    });

    it("throws errors for duplicate imported usings", async () => {
      const diagnostics = await Tester.files({
        "a.tsp": `
      namespace N.M;
      model X { x: int32 }
      `,
        "b.tsp": `
      using N.M;
      using N.M;
      `,
      }).diagnose(`
      import "./a.tsp";
      import "./b.tsp";
      `);
      expectDiagnostics(diagnostics, [
        { code: "duplicate-using", message: 'duplicate using of "N.M" namespace' },
        { code: "duplicate-using", message: 'duplicate using of "N.M" namespace' },
      ]);
    });
  });

  it("does not throws errors for different usings with the same bindings if not used", async () => {
    const diagnostics = await Tester.files({
      "a.tsp": `
      namespace N {
        model A { }
      }

      namespace M {
        model A { }
      }
      `,
      "b.tsp": `
      using N;
      using M;
      `,
    }).diagnose(`
      import "./a.tsp";
      import "./b.tsp";
    `);
    expectDiagnosticEmpty(diagnostics);
  });

  it("report ambiguous diagnostics when using name present in multiple using", async () => {
    const diagnostics = await Tester.files({
      "a.tsp": `
      namespace N {
        model A { }
      }

      namespace M {
        model A { }
      }
      `,
      "b.tsp": `
      using N;
      using M;

      model B extends A {}
      `,
    }).diagnose(
      `
      import "./a.tsp";
      import "./b.tsp";
    `,
      { compilerOptions: { nostdlib: true } },
    );
    expectDiagnostics(diagnostics, [
      {
        code: "ambiguous-symbol",
        message:
          '"A" is an ambiguous name between N.A, M.A. Try using fully qualified name instead: N.A, M.A',
      },
    ]);
  });

  it("report ambiguous diagnostics when symbol exists in using namespace and global namespace", async () => {
    const diagnostics = await Tester.files({
      "a.tsp": `
      model M {}

      using B;
      
      model Q extends M {}
      `,
      "b.tsp": `
      namespace B {
        model M { }
      }
      `,
    }).diagnose(
      `
      import "./a.tsp";
      import "./b.tsp";
    `,
      { compilerOptions: { nostdlib: true } },
    );
    expectDiagnostics(diagnostics, [
      {
        code: "ambiguous-symbol",
        message:
          '"M" is an ambiguous name between global.M, B.M. Try using fully qualified name instead: global.M, B.M',
      },
    ]);
  });

  it("reports ambiguous symbol for decorator", async () => {
    const diagnostics = await Tester.files({
      "doc.js": mockFile.js({
        namespace: "Test.A",
        $doc() {},
      }),
    }).diagnose(`
      import "./doc.js";
      namespace Test;

      namespace A {
        extern dec doc(target: unknown);
      }

      using A;

      @doc
      namespace Foo {}
    `);
    expectDiagnostics(diagnostics, [
      {
        code: "ambiguous-symbol",
        message: `"doc" is an ambiguous name between TypeSpec.doc, Test.A.doc. Try using fully qualified name instead: TypeSpec.doc, Test.A.doc`,
      },
    ]);
  });

  it("reports ambiguous symbol for decorator with missing implementation", async () => {
    const diagnostics = await Tester.diagnose(`
      namespace Test;

      namespace A {
        extern dec doc(target: unknown);
      }

      using A;

      @doc
      namespace Foo {}
    `);
    expectDiagnostics(diagnostics, [
      {
        code: "ambiguous-symbol",
        message: `"doc" is an ambiguous name between TypeSpec.doc, Test.A.doc. Try using fully qualified name instead: TypeSpec.doc, Test.A.doc`,
      },
      { code: "missing-implementation" },
    ]);
  });

  it("ambiguous use doesn't affect other files", async () => {
    const diagnostics = await Tester.files({
      "a.tsp": `
      namespace N {
        model A { }
      }

      namespace M {
        model A { }
      }
      `,
      "ambiguous.tsp": `
      using N;
      using M;

      model Ambiguous extends A {}
      `,
      "notambiguous.tsp": `
      using N;

      model NotAmbiguous extends A {}
      `,
    }).diagnose(`
      import "./a.tsp";
      import "./ambiguous.tsp";
      import "./notambiguous.tsp";
    `);
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
    const { B } = await Tester.files({
      "a.tsp": `
      namespace N;
      model A { a: string }
      `,
    }).compile(t.code`
      import "./a.tsp";
      using N;
      namespace B {
        model A { a: int32 | string }
        model ${t.model("B")} { ... A }
      }
    `);
    strictEqual(B.properties.size, 1);
    strictEqual(B.properties.get("a")!.type.kind, "Union");
  });

  it("usings are local to a file", async () => {
    await rejects(
      Tester.files({
        "a.tsp": `
      namespace N;
      model A { a: string }
      `,
        "b.tsp": `
      namespace M {
        using N;
      }
      
      namespace M {
        model X { a: A };
      }
      `,
      }).compile(`
      import "./a.tsp";
      import "./b.tsp";
    `),
    );
  });

  it("TypeSpec namespace is automatically using'd", async () => {
    await Tester.compile(`
      namespace Foo;
      model test { x: int32 };
    `);
  });

  it("works when the using'd namespace is merged after the current namespace", async () => {
    await Tester.files({
      "other.tsp": `
      namespace Other;

      model OtherModel {
      }
    `,
    }).compile(`
      import "./other.tsp";
      namespace Main;
      using Other;
      model Thing {
        other: OtherModel;
      }
    `);
  });
});

describe("emit diagnostics", () => {
  it("unknown identifier", async () => {
    const diagnostics = await Tester.diagnose(`
      using NotDefined;
    `);
    expectDiagnostics(diagnostics, {
      code: "invalid-ref",
      message: "Unknown identifier NotDefined",
    });
  });

  describe("when using non-namespace types", () => {
    [
      ["model", "model Target {}"],
      ["enum", "enum Target {}"],
      ["union", "union Target {}"],
      ["scalar", "scalar Target;"],
      ["interface", "interface Target {}"],
      ["operation", "op Target(): void;"],
    ].forEach(([name, code]) => {
      it(name, async () => {
        const diagnostics = await Tester.diagnose(`
          using Target;
          ${code}
        `);
        expectDiagnostics(diagnostics, {
          code: "using-invalid-ref",
          message: "Using must refer to a namespace",
        });
      });
    });
  });
});
