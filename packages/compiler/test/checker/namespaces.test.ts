import { ok, strictEqual } from "assert";
import { beforeEach, describe, it } from "vitest";
import { getTypeName } from "../../src/core/index.js";
import type { Program } from "../../src/core/program.js";
import { Model, Namespace, Type } from "../../src/core/types.js";
import {
  TestHost,
  createTestHost,
  expectDiagnostics,
  expectIdenticalTypes,
} from "../../src/testing/index.js";

describe("compiler: namespaces with blocks", () => {
  const blues = new WeakSet();
  function $blue(_: any, target: Type) {
    blues.add(target);
  }

  let testHost: TestHost;

  beforeEach(async () => {
    testHost = await createTestHost();
    testHost.addJsFile("blue.js", { $blue });
  });

  it("can be decorated", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      import "./blue.js";
      @blue @test namespace Z.Q;
      @blue @test namespace N { }
      @blue @test namespace X.Y { }
      `,
    );
    const { N, Y, Q } = (await testHost.compile("./")) as {
      N: Namespace;
      Y: Namespace;
      Q: Namespace;
    };

    ok(blues.has(N), "N is blue");
    ok(blues.has(Y), "Y is blue");
    ok(blues.has(Q), "Q is blue");
  });

  it("can reference array expression on decorator of namespace", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
    import "./blue.js";
    @blue(Bar) @test
    namespace Test {
      model Bar {
        arrayProp: string[];
      }
    }
    `,
    );
    const { Test } = await testHost.compile("./");

    strictEqual(Test.kind, "Namespace" as const);
  });

  it("merges like namespaces", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      @test
      namespace N { @test model X { x: string } }
      namespace N { @test model Y { y: string } }
      namespace N { @test model Z { ... X, ... Y } }
      `,
    );
    const { N, X, Y, Z } = (await testHost.compile("./")) as {
      N: Namespace;
      X: Model;
      Y: Model;
      Z: Model;
    };
    strictEqual(X.namespace, N);
    strictEqual(Y.namespace, N);
    strictEqual(Z.namespace, N);
    strictEqual(Z.properties.size, 2, "has two properties");
  });

  it("merges like namespaces across files", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      import "./a.tsp";
      import "./b.tsp";
      import "./c.tsp";
      `,
    );
    testHost.addTypeSpecFile(
      "a.tsp",
      `
      @test
      namespace N { @test model X { x: string } }
      `,
    );
    testHost.addTypeSpecFile(
      "b.tsp",
      `
      namespace N { @test model Y { y: int32 } }
      `,
    );
    testHost.addTypeSpecFile(
      "c.tsp",
      `
      namespace N { @test model Z { ... X, ... Y } }
      `,
    );
    const { N, X, Y, Z } = (await testHost.compile("./")) as {
      N: Namespace;
      X: Model;
      Y: Model;
      Z: Model;
    };
    strictEqual(X.namespace, N, "X namespace");
    strictEqual(Y.namespace, N, "Y namespace");
    strictEqual(Z.namespace, N, "Z namespace");
    strictEqual(Z.properties.size, 2, "has two properties");
  });

  it("merges sub-namespaces across files", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      import "./a.tsp";
      import "./b.tsp";
      import "./c.tsp";
      `,
    );
    testHost.addTypeSpecFile(
      "a.tsp",
      `
      namespace N { namespace M { model X { x: string } } }
      `,
    );
    testHost.addTypeSpecFile(
      "b.tsp",
      `
      namespace N { namespace M { model Y { y: int32 } } }
      `,
    );
    testHost.addTypeSpecFile(
      "c.tsp",
      `
      namespace N { @test model Z { ... M.X, ... M.Y } }
      `,
    );

    const { Z } = (await testHost.compile("./")) as {
      Z: Model;
    };
    strictEqual(Z.properties.size, 2, "has two properties");
  });

  it("runs all decorators on merged namespaces", async () => {
    const reds = new WeakSet();
    let isRedDuringRef = false;
    let isBlueDuringRef = false;
    testHost.addJsFile("red.js", {
      $red(p: Program, t: Type) {
        reds.add(t);
      },
      $ref(p: Program, t: Type, arg: Type) {
        isRedDuringRef = reds.has(arg);
        isBlueDuringRef = blues.has(arg);
      },
    });

    testHost.addTypeSpecFile(
      "main.tsp",
      `
      import "./blue.js";
      import "./red.js";

      @ref(N)
      namespace A { }
      
      @red
      @test
      namespace N {}

      @blue
      namespace N {}
      `,
    );

    const { N } = (await testHost.compile("./")) as {
      N: Namespace;
    };

    ok(reds.has(N), "is ultimately red"); // passes
    ok(blues.has(N), "is ultimately blue"); // passes

    ok(isRedDuringRef, "red at ref point");
    ok(isBlueDuringRef, "blue at ref point"); // fails
  });

  it("runs all decorators on merged namespaces across files", async () => {
    const reds = new WeakSet();
    let isRedDuringRef = false;
    let isBlueDuringRef = false;
    testHost.addJsFile("red.js", {
      $red(p: Program, t: Type) {
        reds.add(t);
      },
      $ref(p: Program, t: Type, arg: Type) {
        isRedDuringRef = reds.has(arg);
        isBlueDuringRef = blues.has(arg);
      },
    });

    testHost.addTypeSpecFile(
      "main.tsp",
      `
      import "./blue.js";
      import "./red.js";
      import "./one.tsp";
      import "./two.tsp";
      
      @ref(N)
      namespace A { }
    
      `,
    );

    testHost.addTypeSpecFile(
      "one.tsp",
      `
      @red
      @test
      namespace N {}
    
      `,
    );

    testHost.addTypeSpecFile(
      "two.tsp",
      `
      @blue
      namespace N {}
      `,
    );

    const { N } = (await testHost.compile("./")) as {
      N: Namespace;
    };

    ok(reds.has(N), "is ultimately red"); // passes
    ok(blues.has(N), "is ultimately blue"); // passes

    ok(isRedDuringRef, "red at ref point");
    ok(isBlueDuringRef, "blue at ref point"); // fails
  });

  it("can see things in outer scope same file", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      model A { }
      namespace N { model B extends A { } }
      `,
    );
    await testHost.compile("./");
  });

  it("can see things in outer scope cross file", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      import "./a.tsp";
      import "./b.tsp";
      import "./c.tsp";
      `,
    );
    testHost.addTypeSpecFile(
      "a.tsp",
      `
      model A { }
      `,
    );
    testHost.addTypeSpecFile(
      "b.tsp",
      `
      model B extends A { }
      `,
    );
    testHost.addTypeSpecFile(
      "c.tsp",
      `
      model C { }
      namespace foo {
        op foo(a: A, b: B): C;
      }
      `,
    );
    await testHost.compile("./");
  });

  it("accumulates declarations inside of it", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      @test namespace Foo {
        namespace Bar { };
        op Baz(): {};
        model Qux { };
      }
      `,
    );

    const { Foo } = (await testHost.compile("./")) as {
      Foo: Namespace;
    };

    strictEqual(Foo.operations.size, 1);
    strictEqual(Foo.models.size, 1);
    strictEqual(Foo.namespaces.size, 1);
  });

  it("can be decorated, passing a model in a later namespace", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      @test(Azure.Foo)
      namespace Baz { };
      namespace Azure {
        model Foo { }
      }

      `,
    );

    await testHost.compile("./");
  });
});

describe("compiler: blockless namespaces", () => {
  const blues = new WeakSet();
  function $blue(_: any, target: Type) {
    blues.add(target);
  }

  let testHost: TestHost;

  beforeEach(async () => {
    testHost = await createTestHost();
    testHost.addJsFile("blue.js", { $blue });
  });

  it("merges properly with other namespaces", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      import "./a.tsp";
      import "./b.tsp";
      import "./c.tsp";
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
      namespace N;
      model Y { y: int32 }
      `,
    );
    testHost.addTypeSpecFile(
      "c.tsp",
      `
      @test model Z { ... N.X, ... N.Y }
      `,
    );
    const { Z } = (await testHost.compile("./")) as {
      Z: Model;
    };
    strictEqual(Z.properties.size, 2, "has two properties");
  });

  it("does lookup correctly", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      namespace Repro;
      model Yo {
      }
      model Hey {
        wat: Yo;
      }
      `,
    );

    await testHost.compile("./");
  });

  it("does lookup correctly with nested namespaces", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      namespace Repro;
      model Yo {
      }
      model Hey {
        wat: Yo;
      }
      `,
    );
    testHost.addTypeSpecFile(
      "b.tsp",
      `
      namespace Repro.Uhoh;
      model SayYo {
        yo: Hey;
        wat: Yo;
      }
      `,
    );

    await testHost.compile("./");
  });

  it("binds correctly", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      namespace N.M;
      model A { }
      `,
    );
    testHost.addTypeSpecFile(
      "b.tsp",
      `
      model X { a: N.M.A }
      `,
    );

    await testHost.compile("./");
  });

  it("works with blockful namespaces", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      @test
      namespace N;

      @test
      namespace M {
        model A { }
      }
      `,
    );
    testHost.addTypeSpecFile(
      "b.tsp",
      `
      model X { a: N.M.A }
      `,
    );
    const { N, M } = (await testHost.compile("./")) as {
      N: Namespace;
      M: Namespace;
    };

    ok(M.namespace);
    strictEqual(M.namespace, N);
  });

  it("works with nested blockless and blockfull namespaces", async () => {
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
      @test
      namespace N.M;

      @test
      namespace O {
        model A { }
      }
      `,
    );
    testHost.addTypeSpecFile(
      "b.tsp",
      `
      model X { a: N.M.O.A }
      `,
    );
    const { M, O } = (await testHost.compile("./")) as {
      M: Namespace;
      O: Namespace;
    };

    ok(M.namespace);
    ok(O.namespace);
    strictEqual(O.namespace, M);
  });

  it("works when namespaces aren't evaluated first", async () => {
    testHost.addTypeSpecFile(
      "a.tsp",
      `
      import "./b.tsp";
      model M {x: N.X }
      `,
    );
    testHost.addTypeSpecFile(
      "b.tsp",
      `
      namespace N;
      model X {}
      `,
    );

    await testHost.compile("./a.tsp");
  });

  it("accumulates declarations inside of it", async () => {
    testHost.addTypeSpecFile(
      "a.tsp",
      `
      @test namespace Foo;
      namespace Bar { };
      op Baz(): {};
      model Qux { };
      `,
    );

    const { Foo } = (await testHost.compile("./a.tsp")) as {
      Foo: Namespace;
    };

    strictEqual(Foo.operations.size, 1);
    strictEqual(Foo.models.size, 1);
    strictEqual(Foo.namespaces.size, 1);
  });
});

describe("compiler: namespace type name", () => {
  let testHost: TestHost;

  beforeEach(async () => {
    testHost = await createTestHost();
  });

  it("prefix with the namespace of the entity", async () => {
    testHost.addTypeSpecFile(
      "a.tsp",
      `
      namespace Foo;
      
      @test()
      model Model1 {}

      namespace Other.Bar {
         @test()
        model Model2 {}
      }
      `,
    );

    const { Model1, Model2 } = await testHost.compile("./a.tsp");
    strictEqual(getTypeName(Model1), "Foo.Model1");
    strictEqual(getTypeName(Model2), "Foo.Other.Bar.Model2");
  });

  it("gets full name in edge case with decorators", async () => {
    testHost.addJsFile("lib.js", {
      namespace: "AnotherNamespace",
      $myDec() {},
    });

    testHost.addTypeSpecFile(
      "main.tsp",
      `
      import "./lib.js";

      @AnotherNamespace.myDec(AnotherNamespace.AnotherModel)
      namespace SomeNamespace {
        @test()
        model SomeModel {}
      }

      namespace AnotherNamespace {
        @test()
        model AnotherModel {}
      }
      `,
    );

    const { SomeModel, AnotherModel } = await testHost.compile("./main.tsp");
    strictEqual(getTypeName(SomeModel), "SomeNamespace.SomeModel");
    strictEqual(getTypeName(AnotherModel), "AnotherNamespace.AnotherModel");
  });
});

describe("compiler: decorators in namespaces", () => {
  let testHost: TestHost;

  beforeEach(async () => {
    testHost = await createTestHost();
  });

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

    testHost.addJsFile("dec.js", dec);

    testHost.addTypeSpecFile(
      "main.tsp",
      `
      import "./dec.js";
      @A.B.foo @A.B.C.bar model M { };
      `,
    );

    await testHost.compile("main.tsp");
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
    testHost.addJsFile("dec.js", dec);

    testHost.addTypeSpecFile(
      "main.tsp",
      `
      import "./dec.js";

      @A.foo @A.B.bar model M { };
      `,
    );

    await testHost.compile("main.tsp");
    ok(fooCalled);
    ok(barCalled);
  });

  it("provides full namespace name in error when namespace is missing a member", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      import "./other.tsp";
      namespace A.B;
      model M { }
      model N extends A.B.M {}// There's a A.B.M, but this looks in A.B.A.B for M
    `,
    );
    testHost.addTypeSpecFile(
      "other.tsp",
      `
      namespace A.B.A.B;
      model N {}
      `,
    );

    const diagnostics = await testHost.diagnose("./");
    expectDiagnostics(diagnostics, [
      {
        code: "invalid-ref",
        message: /A\.B\.A\.B/,
      },
    ]);
  });

  it("can reference global namespace using `global` for disambiguation", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      namespace A {
       @test namespace B {
          @test model Y extends global.B.X {}
        }
      }
      namespace B {
        @test model X {}
      }
    `,
    );

    const { B, X, Y } = await testHost.compile("./main.tsp");
    strictEqual(B.kind, "Namespace" as const);
    strictEqual(X.kind, "Model" as const);
    strictEqual(Y.kind, "Model" as const);
    ok(Y.baseModel);
    expectIdenticalTypes(Y.baseModel, X);
  });
});
