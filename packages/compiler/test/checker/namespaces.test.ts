import { ok, strictEqual } from "assert";
import { describe, it } from "vitest";
import type { Program } from "../../src/core/program.js";
import type { Type } from "../../src/core/types.js";
import { getTypeName } from "../../src/index.js";
import { expectDiagnostics, expectTypeEquals, mockFile, t } from "../../src/testing/index.js";
import { Tester } from "../tester.js";

describe("compiler: namespaces with blocks", () => {
  const blues = new WeakSet();
  function $blue(_: any, target: Type) {
    blues.add(target);
  }

  it("can be decorated", async () => {
    const { Q, N, Y } = await Tester.files({
      "blue.js": mockFile.js({ $blue }),
    }).compile(t.code`
      import "./blue.js";
      @blue namespace Z.${t.namespace("Q")};
      @blue namespace ${t.namespace("N")} { }
      @blue namespace X.${t.namespace("Y")} { }
    `);

    ok(blues.has(N), "N is blue");
    ok(blues.has(Y), "Y is blue");
    ok(blues.has(Q), "Q is blue");
  });

  it("can reference array expression on decorator of namespace", async () => {
    const { Test } = await Tester.files({
      "blue.js": mockFile.js({ $blue }),
    }).compile(t.code`
      import "./blue.js";
      @blue(Bar)
      namespace ${t.namespace("Test")} {
        model Bar {
          arrayProp: string[];
        }
      }
    `);

    strictEqual(Test.kind, "Namespace" as const);
  });

  it("merges like namespaces", async () => {
    const { N, X, Y, Z } = await Tester.compile(t.code`
      namespace ${t.namespace("N")} { model ${t.model("X")} { x: string } }
      namespace N { model ${t.model("Y")} { y: string } }
      namespace N { model ${t.model("Z")} { ... X, ... Y } }
    `);
    strictEqual(X.namespace, N);
    strictEqual(Y.namespace, N);
    strictEqual(Z.namespace, N);
    strictEqual(Z.properties.size, 2, "has two properties");
  });

  it("merges like namespaces across files", async () => {
    const { N, Z } = await Tester.files({
      "a.tsp": `namespace N { model X { x: string } }`,
      "b.tsp": `namespace N { model Y { y: int32 } }`,
    }).compile(t.code`
      import "./a.tsp";
      import "./b.tsp";
      namespace ${t.namespace("N")} { model ${t.model("Z")} { ... X, ... Y } }
    `);
    const X = N.models.get("X")!;
    const Y = N.models.get("Y")!;
    strictEqual(X.namespace, N, "X namespace");
    strictEqual(Y.namespace, N, "Y namespace");
    strictEqual(Z.namespace, N, "Z namespace");
    strictEqual(Z.properties.size, 2, "has two properties");
  });

  it("merges sub-namespaces across files", async () => {
    const { Z } = await Tester.files({
      "a.tsp": `namespace N { namespace M { model X { x: string } } }`,
      "b.tsp": `namespace N { namespace M { model Y { y: int32 } } }`,
    }).compile(t.code`
      import "./a.tsp";
      import "./b.tsp";
      namespace N { model ${t.model("Z")} { ... M.X, ... M.Y } }
    `);
    strictEqual(Z.properties.size, 2, "has two properties");
  });

  it("runs all decorators on merged namespaces", async () => {
    const reds = new WeakSet();
    let isRedDuringRef = false;
    let isBlueDuringRef = false;

    const { N } = await Tester.files({
      "blue.js": mockFile.js({ $blue }),
      "red.js": mockFile.js({
        $red(p: Program, t: Type) {
          reds.add(t);
        },
        $ref(p: Program, t: Type, arg: Type) {
          isRedDuringRef = reds.has(arg);
          isBlueDuringRef = blues.has(arg);
        },
      }),
    }).compile(t.code`
      import "./blue.js";
      import "./red.js";

      @ref(N)
      namespace A { }

      @red
      namespace ${t.namespace("N")} {}

      @blue
      namespace N {}
    `);

    ok(reds.has(N), "is ultimately red"); // passes
    ok(blues.has(N), "is ultimately blue"); // passes

    ok(isRedDuringRef, "red at ref point");
    ok(isBlueDuringRef, "blue at ref point"); // fails
  });

  it("runs all decorators on merged namespaces across files", async () => {
    const reds = new WeakSet();
    let isRedDuringRef = false;
    let isBlueDuringRef = false;

    const { N } = await Tester.files({
      "blue.js": mockFile.js({ $blue }),
      "red.js": mockFile.js({
        $red(p: Program, t: Type) {
          reds.add(t);
        },
        $ref(p: Program, t: Type, arg: Type) {
          isRedDuringRef = reds.has(arg);
          isBlueDuringRef = blues.has(arg);
        },
      }),
      "one.tsp": `@red namespace N {}`,
      "two.tsp": `@blue namespace N {}`,
    }).compile(t.code`
      import "./blue.js";
      import "./red.js";
      import "./one.tsp";
      import "./two.tsp";

      @ref(N)
      namespace A { }

      namespace ${t.namespace("N")} {}
    `);

    ok(reds.has(N), "is ultimately red"); // passes
    ok(blues.has(N), "is ultimately blue"); // passes

    ok(isRedDuringRef, "red at ref point");
    ok(isBlueDuringRef, "blue at ref point"); // fails
  });

  it("can see things in outer scope same file", async () => {
    await Tester.compile(`
      model A { }
      namespace N { model B extends A { } }
    `);
  });

  it("can see things in outer scope cross file", async () => {
    await Tester.files({
      "a.tsp": `model A { }`,
      "b.tsp": `model B extends A { }`,
      "c.tsp": `
        model C { }
        namespace foo {
          op foo(a: A, b: B): C;
        }
      `,
    }).compile(`
      import "./a.tsp";
      import "./b.tsp";
      import "./c.tsp";
    `);
  });

  it("accumulates declarations inside of it", async () => {
    const { Foo } = await Tester.compile(t.code`
      namespace ${t.namespace("Foo")} {
        namespace Bar { };
        op Baz(): {};
        model Qux { };
      }
    `);

    strictEqual(Foo.operations.size, 1);
    strictEqual(Foo.models.size, 1);
    strictEqual(Foo.namespaces.size, 1);
  });

  it("can be decorated, passing a model in a later namespace", async () => {
    await Tester.files({
      "dec.js": mockFile.js({ $myDec() {} }),
    }).compile(`
      import "./dec.js";
      @myDec(Azure.Foo)
      namespace Baz { };
      namespace Azure {
        model Foo { }
      }
    `);
  });
});

describe("compiler: blockless namespaces", () => {
  it("merges properly with other namespaces", async () => {
    const { Z } = await Tester.files({
      "a.tsp": `
        namespace N;
        model X { x: int32 }
      `,
      "b.tsp": `
        namespace N;
        model Y { y: int32 }
      `,
    }).compile(t.code`
      import "./a.tsp";
      import "./b.tsp";
      model ${t.model("Z")} { ... N.X, ... N.Y }
    `);
    strictEqual(Z.properties.size, 2, "has two properties");
  });

  // Regression test for https://github.com/microsoft/typespec/issues/8630
  it("does stuff", async () => {
    const { A, B } = await Tester.compile(t.code`
      namespace Top;
      
      namespace A {};

      namespace ${t.namespace("B")} {
        namespace ${t.namespace("A")} {}
      };
    `);
    expectTypeEquals(A.namespace, B);
  });

  it("does lookup correctly", async () => {
    await Tester.compile(`
      namespace Repro;
      model Yo {
      }
      model Hey {
        wat: Yo;
      }
    `);
  });

  it("does lookup correctly with nested namespaces", async () => {
    await Tester.files({
      "b.tsp": `
        namespace Repro.Uhoh;
        model SayYo {
          yo: Hey;
          wat: Yo;
        }
      `,
    }).compile(`
      import "./b.tsp";
      namespace Repro;
      model Yo {
      }
      model Hey {
        wat: Yo;
      }
    `);
  });

  it("binds correctly", async () => {
    await Tester.files({
      "b.tsp": `model X { a: N.M.A }`,
    }).compile(`
      import "./b.tsp";
      namespace N.M;
      model A { }
    `);
  });

  it("works with blockful namespaces", async () => {
    const { N, M } = await Tester.files({
      "b.tsp": `model X { a: N.M.A }`,
    }).compile(t.code`
      import "./b.tsp";
      namespace ${t.namespace("N")};

      namespace ${t.namespace("M")} {
        model A { }
      }
    `);

    ok(M.namespace);
    strictEqual(M.namespace, N);
  });

  it("works with nested blockless and blockfull namespaces", async () => {
    const { M, O } = await Tester.files({
      "b.tsp": `model X { a: N.M.O.A }`,
    }).compile(t.code`
      import "./b.tsp";
      namespace N.${t.namespace("M")};

      namespace ${t.namespace("O")} {
        model A { }
      }
    `);

    ok(M.namespace);
    ok(O.namespace);
    strictEqual(O.namespace, M);
  });

  it("works when namespaces aren't evaluated first", async () => {
    await Tester.files({
      "b.tsp": `
        namespace N;
        model X {}
      `,
    }).compile(`
      import "./b.tsp";
      model M {x: N.X }
    `);
  });

  it("accumulates declarations inside of it", async () => {
    const { Foo } = await Tester.compile(t.code`
      namespace ${t.namespace("Foo")};
      namespace Bar { };
      op Baz(): {};
      model Qux { };
    `);

    strictEqual(Foo.operations.size, 1);
    strictEqual(Foo.models.size, 1);
    strictEqual(Foo.namespaces.size, 1);
  });
});

describe("compiler: namespace type name", () => {
  it("prefix with the namespace of the entity", async () => {
    const { Model1, Model2 } = await Tester.compile(t.code`
      namespace Foo;

      model ${t.model("Model1")} {}

      namespace Other.Bar {
        model ${t.model("Model2")} {}
      }
    `);

    strictEqual(getTypeName(Model1), "Foo.Model1");
    strictEqual(getTypeName(Model2), "Foo.Other.Bar.Model2");
  });

  it("gets full name in edge case with decorators", async () => {
    const { SomeModel, AnotherModel } = await Tester.files({
      "lib.js": mockFile.js({
        namespace: "AnotherNamespace",
        $myDec() {},
      }),
    }).compile(t.code`
      import "./lib.js";

      @AnotherNamespace.myDec(AnotherNamespace.AnotherModel)
      namespace SomeNamespace {
        model ${t.model("SomeModel")} {}
      }

      namespace AnotherNamespace {
        model ${t.model("AnotherModel")} {}
      }
    `);

    strictEqual(getTypeName(SomeModel), "SomeNamespace.SomeModel");
    strictEqual(getTypeName(AnotherModel), "AnotherNamespace.AnotherModel");
  });
});

describe("compiler: decorators in namespaces", () => {
  it("puts decorators in namespaces using an exported string", async () => {
    let fooCalled = false;
    let barCalled = false;

    const dec = {
      namespace: "A.B",
      $foo() {
        fooCalled = true;
      },
      $bar() {
        barCalled = true;
      },
    };

    (dec.$bar as any).namespace = "C";

    await Tester.files({
      "dec.js": mockFile.js(dec),
    }).compile(`
      import "./dec.js";
      @A.B.foo @A.B.C.bar model M { };
    `);
    ok(fooCalled);
    ok(barCalled);
  });

  it("puts decorators in a namespace using the .namespace property", async () => {
    let fooCalled = false;
    let barCalled = false;
    const dec = {
      $foo() {
        fooCalled = true;
      },
      $bar() {
        barCalled = true;
      },
    };

    (dec.$foo as any).namespace = "A";
    (dec.$bar as any).namespace = "A.B";

    await Tester.files({
      "dec.js": mockFile.js(dec),
    }).compile(`
      import "./dec.js";

      @A.foo @A.B.bar model M { };
    `);
    ok(fooCalled);
    ok(barCalled);
  });

  it("provides full namespace name in error when namespace is missing a member", async () => {
    const diagnostics = await Tester.files({
      "other.tsp": `
        namespace A.B.A.B;
        model N {}
      `,
    }).diagnose(`
      import "./other.tsp";
      namespace A.B;
      model M { }
      model N extends A.B.M {}// There's a A.B.M, but this looks in A.B.A.B for M
    `);
    expectDiagnostics(diagnostics, [
      {
        code: "invalid-ref",
        message: /A\.B\.A\.B/,
      },
    ]);
  });

  it("can reference global namespace using `global` for disambiguation", async () => {
    const { B, X, Y } = await Tester.compile(t.code`
      namespace A {
        namespace ${t.namespace("B")} {
          model ${t.model("Y")} extends global.B.X {}
        }
      }
      namespace B {
        model ${t.model("X")} {}
      }
    `);
    strictEqual(B.kind, "Namespace" as const);
    strictEqual(X.kind, "Model" as const);
    strictEqual(Y.kind, "Model" as const);
    ok(Y.baseModel);
    expectTypeEquals(Y.baseModel, X);
  });
});
