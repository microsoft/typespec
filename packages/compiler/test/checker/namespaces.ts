import { ok, strictEqual } from "assert";
import { Program } from "../../core/program.js";
import { ModelType, NamespaceType, Type } from "../../core/types.js";
import { createTestHost, TestHost } from "../test-host.js";

describe("cadl: namespaces with blocks", () => {
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
    testHost.addCadlFile(
      "main.cadl",
      `
      import "./blue.js";
      @blue @test namespace Z.Q;
      @blue @test namespace N { }
      @blue @test namespace X.Y { }
      `
    );
    const { N, Y, Q } = (await testHost.compile("./")) as {
      N: NamespaceType;
      Y: NamespaceType;
      Q: NamespaceType;
    };

    ok(blues.has(N), "N is blue");
    ok(blues.has(Y), "Y is blue");
    ok(blues.has(Q), "Q is blue");
  });

  it("merges like namespaces", async () => {
    testHost.addCadlFile(
      "main.cadl",
      `
      @test
      namespace N { @test model X { x: string } }
      namespace N { @test model Y { y: string } }
      namespace N { @test model Z { ... X, ... Y } }
      `
    );
    const { N, X, Y, Z } = (await testHost.compile("./")) as {
      N: NamespaceType;
      X: ModelType;
      Y: ModelType;
      Z: ModelType;
    };
    strictEqual(X.namespace, N);
    strictEqual(Y.namespace, N);
    strictEqual(Z.namespace, N);
    strictEqual(Z.properties.size, 2, "has two properties");
  });

  it("merges like namespaces across files", async () => {
    testHost.addCadlFile(
      "main.cadl",
      `
      import "./a.cadl";
      import "./b.cadl";
      import "./c.cadl";
      `
    );
    testHost.addCadlFile(
      "a.cadl",
      `
      @test
      namespace N { @test model X { x: string } }
      `
    );
    testHost.addCadlFile(
      "b.cadl",
      `
      namespace N { @test model Y { y: int32 } }
      `
    );
    testHost.addCadlFile(
      "c.cadl",
      `
      namespace N { @test model Z { ... X, ... Y } }
      `
    );
    const { N, X, Y, Z } = (await testHost.compile("./")) as {
      N: NamespaceType;
      X: ModelType;
      Y: ModelType;
      Z: ModelType;
    };
    strictEqual(X.namespace, N, "X namespace");
    strictEqual(Y.namespace, N, "Y namespace");
    strictEqual(Z.namespace, N, "Z namespace");
    strictEqual(Z.properties.size, 2, "has two properties");
  });

  it("merges sub-namespaces across files", async () => {
    testHost.addCadlFile(
      "main.cadl",
      `
      import "./a.cadl";
      import "./b.cadl";
      import "./c.cadl";
      `
    );
    testHost.addCadlFile(
      "a.cadl",
      `
      namespace N { namespace M { model X { x: string } } }
      `
    );
    testHost.addCadlFile(
      "b.cadl",
      `
      namespace N { namespace M { model Y { y: int32 } } }
      `
    );
    testHost.addCadlFile(
      "c.cadl",
      `
      namespace N { @test model Z { ... M.X, ... M.Y } }
      `
    );

    const { Z } = (await testHost.compile("./")) as {
      Z: ModelType;
    };
    strictEqual(Z.properties.size, 2, "has two properties");
  });

  it("can see things in outer scope same file", async () => {
    testHost.addCadlFile(
      "main.cadl",
      `
      model A { }
      namespace N { model B extends A { } }
      `
    );
    await testHost.compile("./");
  });

  it("can see things in outer scope cross file", async () => {
    testHost.addCadlFile(
      "main.cadl",
      `
      import "./a.cadl";
      import "./b.cadl";
      import "./c.cadl";
      `
    );
    testHost.addCadlFile(
      "a.cadl",
      `
      model A { }
      `
    );
    testHost.addCadlFile(
      "b.cadl",
      `
      model B extends A { }
      `
    );
    testHost.addCadlFile(
      "c.cadl",
      `
      model C { }
      namespace foo {
        op foo(a: A, b: B): C;
      }
      `
    );
    await testHost.compile("./");
  });

  it("accumulates declarations inside of it", async () => {
    testHost.addCadlFile(
      "main.cadl",
      `
      @test namespace Foo {
        namespace Bar { };
        op Baz(): {};
        model Qux { };
      }
      `
    );

    const { Foo } = (await testHost.compile("./")) as {
      Foo: NamespaceType;
    };

    strictEqual(Foo.operations.size, 1);
    strictEqual(Foo.models.size, 1);
    strictEqual(Foo.namespaces.size, 1);
  });
});

describe("cadl: blockless namespaces", () => {
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
    testHost.addCadlFile(
      "main.cadl",
      `
      import "./a.cadl";
      import "./b.cadl";
      import "./c.cadl";
      `
    );
    testHost.addCadlFile(
      "a.cadl",
      `
      namespace N;
      model X { x: int32 }
      `
    );
    testHost.addCadlFile(
      "b.cadl",
      `
      namespace N;
      model Y { y: int32 }
      `
    );
    testHost.addCadlFile(
      "c.cadl",
      `
      @test model Z { ... N.X, ... N.Y }
      `
    );
    const { Z } = (await testHost.compile("./")) as {
      Z: ModelType;
    };
    strictEqual(Z.properties.size, 2, "has two properties");
  });

  it("merges properly with other namespaces using eval", async () => {
    testHost.addJsFile("test.js", {
      $eval(p: Program) {
        p.evalCadlScript(`namespace N; @test model Z { ... X, ... Y }`);
      },
    });
    testHost.addCadlFile(
      "main.cadl",
      `
      import "./a.cadl";
      import "./b.cadl";
      import "./c.cadl";
      `
    );
    testHost.addCadlFile(
      "a.cadl",
      `
      namespace N;
      model X { x: int32 }
      `
    );
    testHost.addCadlFile(
      "b.cadl",
      `
      namespace N;
      model Y { y: int32 }
      `
    );
    testHost.addCadlFile(
      "c.cadl",
      `
      import "./test.js";
      @eval model test { }
      `
    );
    const { Z } = (await testHost.compile("./")) as {
      Z: ModelType;
    };
    strictEqual(Z.properties.size, 2, "has two properties");
  });

  it("does lookup correctly", async () => {
    testHost.addCadlFile(
      "main.cadl",
      `
      namespace Repro;
      model Yo {
      }
      model Hey {
        wat: Yo;
      }
      `
    );
    try {
      await testHost.compile("./");
    } catch (e) {
      console.log(e.diagnostics);
      throw e;
    }
  });

  it("does lookup correctly with nested namespaces", async () => {
    testHost.addCadlFile(
      "main.cadl",
      `
      namespace Repro;
      model Yo {
      }
      model Hey {
        wat: Yo;
      }
      `
    );
    testHost.addCadlFile(
      "b.cadl",
      `
      namespace Repro.Uhoh;
      model SayYo {
        yo: Hey;
        wat: Yo;
      }
      `
    );
    try {
      await testHost.compile("./");
    } catch (e) {
      console.log(e.diagnostics);
      throw e;
    }
  });

  it("binds correctly", async () => {
    testHost.addCadlFile(
      "main.cadl",
      `
      namespace N.M;
      model A { }
      `
    );
    testHost.addCadlFile(
      "b.cadl",
      `
      model X { a: N.M.A }
      `
    );
    try {
      await testHost.compile("/");
    } catch (e) {
      console.log(e.diagnostics);
      throw e;
    }
  });

  it("works with blockful namespaces", async () => {
    testHost.addCadlFile(
      "main.cadl",
      `
      @test
      namespace N;

      @test
      namespace M {
        model A { }
      }
      `
    );
    testHost.addCadlFile(
      "b.cadl",
      `
      model X { a: N.M.A }
      `
    );
    const { N, M } = (await testHost.compile("/")) as {
      N: NamespaceType;
      M: NamespaceType;
    };

    ok(M.namespace);
    strictEqual(M.namespace, N);
  });

  it("works with nested blockless and blockfull namespaces", async () => {
    testHost.addCadlFile(
      "main.cadl",
      `
      import "./a.cadl";
      import "./b.cadl";
      `
    );
    testHost.addCadlFile(
      "a.cadl",
      `
      @test
      namespace N.M;

      @test
      namespace O {
        model A { }
      }
      `
    );
    testHost.addCadlFile(
      "b.cadl",
      `
      model X { a: N.M.O.A }
      `
    );
    const { M, O } = (await testHost.compile("/")) as {
      M: NamespaceType;
      O: NamespaceType;
    };

    ok(M.namespace);
    ok(O.namespace);
    strictEqual(O.namespace, M);
  });

  it("works when namespaces aren't evaluated first", async () => {
    testHost.addCadlFile(
      "a.cadl",
      `
      import "./b.cadl";
      model M {x: N.X }
      `
    );
    testHost.addCadlFile(
      "b.cadl",
      `
      namespace N;
      model X {}
      `
    );

    await testHost.compile("/a.cadl");
  });

  it("accumulates declarations inside of it", async () => {
    testHost.addCadlFile(
      "a.cadl",
      `
      @test namespace Foo;
      namespace Bar { };
      op Baz(): {};
      model Qux { };
      `
    );

    const { Foo } = (await testHost.compile("/a.cadl")) as {
      Foo: NamespaceType;
    };

    strictEqual(Foo.operations.size, 1);
    strictEqual(Foo.models.size, 1);
    strictEqual(Foo.namespaces.size, 1);
  });
});

describe("cadl: namespace type name", () => {
  let testHost: TestHost;

  beforeEach(async () => {
    testHost = await createTestHost();
  });

  it("prefix with the namespace of the entity", async () => {
    testHost.addCadlFile(
      "a.cadl",
      `
      namespace Foo;
      
      @test()
      model Model1 {}

      namespace Other.Bar {
         @test()
        model Model2 {}
      }
      `
    );

    const { Model1, Model2 } = await testHost.compile("/a.cadl");
    strictEqual(testHost.program.checker?.getTypeName(Model1), "Foo.Model1");
    strictEqual(testHost.program.checker?.getTypeName(Model2), "Foo.Other.Bar.Model2");
  });
});

describe("cadl: decorators in namespaces", () => {
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

    testHost.addCadlFile(
      "main.cadl",
      `
      import "./dec.js";
      @A.B.foo @A.B.C.bar model M { };
      `
    );

    await testHost.compile("main.cadl");
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

    testHost.addCadlFile(
      "main.cadl",
      `
      import "./dec.js";

      @A.foo @A.B.bar model M { };
      `
    );

    await testHost.compile("main.cadl");
    ok(fooCalled);
    ok(barCalled);
  });
});
