import { ok, strictEqual } from "assert";
import { isTemplateDeclaration } from "../../core/type-utils.js";
import { Interface, Model, Operation, Type } from "../../core/types.js";
import {
  BasicTestRunner,
  createTestHost,
  createTestRunner,
  expectDiagnostics,
  TestHost,
} from "../../testing/index.js";

describe("compiler: interfaces", () => {
  let testHost: TestHost;
  let runner: BasicTestRunner;

  beforeEach(async () => {
    testHost = await createTestHost();
    runner = await createTestRunner(testHost);
  });

  it("works", async () => {
    const blues = new Set<Type>();
    testHost.addJsFile("test.js", {
      $blue(p: any, t: Interface) {
        blues.add(t);
      },
    });
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      import "./test.js";
      @test @blue interface Foo {
        @blue bar(): string;
      }
      `
    );

    const { Foo } = (await testHost.compile("./")) as {
      Foo: Interface;
    };

    strictEqual(Foo.namespace, testHost.program.checker.getGlobalNamespaceType());
    strictEqual(Foo.name, "Foo");
    strictEqual(Foo.operations.size, 1);
    const bar = Foo.operations.get("bar");
    ok(bar);
    strictEqual(bar.name, "bar");
    strictEqual(bar.kind, "Operation");
    ok(blues.has(bar));
    ok(blues.has(Foo));
  });

  it("throws diagnostics for duplicate properties", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      @test interface Foo {
        bar(): string;
        bar(): int32;
      }
      `
    );

    const diagnostics = await testHost.diagnose("./");
    expectDiagnostics(diagnostics, {
      code: "interface-duplicate",
      message: "Interface already has a member named bar",
    });
  });

  it("can be templated", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      @test interface Foo<T> {
        bar(): T;
      }

      alias Bar = Foo<int32>;
      `
    );

    const { Foo } = (await testHost.compile("./")) as {
      Foo: Interface;
    };

    strictEqual(Foo.operations.size, 1);
    const returnType = Foo.operations.get("bar")!.returnType;
    strictEqual(returnType.kind, "Scalar" as const);
    strictEqual(returnType.name, "int32");
  });

  it("can extend one other interfaces", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      interface Bar<T> { bar(): T }
      @test interface Foo<T> extends Bar<T> {
        foo(): T;
      }

      alias Baz = Foo<int32>;
      `
    );

    const { Foo } = (await testHost.compile("./")) as {
      Foo: Interface;
    };
    strictEqual(Foo.operations.size, 2);
    ok(Foo.operations.get("foo"));
    ok(Foo.operations.get("bar"));
    strictEqual((Foo.operations.get("bar")!.returnType as Model).name, "int32");
  });

  it("can extend two other interfaces", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      interface Bar<T> { bar(): T }
      interface Baz<T> { baz(): T }
      @test interface Foo<T> extends Bar<T>, Baz<T> {
        foo(): T;
      }

      alias Qux = Foo<int32>;
      `
    );

    const { Foo } = (await testHost.compile("./")) as {
      Foo: Interface;
    };
    strictEqual(Foo.operations.size, 3);
    ok(Foo.operations.get("foo"));
    ok(Foo.operations.get("bar"));
    ok(Foo.operations.get("baz"));
    strictEqual((Foo.operations.get("bar")!.returnType as Model).name, "int32");
  });

  it("doesn't copy interface decorators down when using extends", async () => {
    const blues = new Set<Type>();
    testHost.addJsFile("test.js", {
      $blue(p: any, t: Interface) {
        blues.add(t);
      },
    });

    testHost.addTypeSpecFile(
      "main.tsp",
      `
      import "./test.js";
      @blue interface Foo { foo(): int32 }
      @test interface Bar extends Foo {
        bar(): int32;
      }
      `
    );

    const { Bar } = (await testHost.compile("./")) as {
      Bar: Interface;
    };

    ok(!blues.has(Bar));
    strictEqual(Bar.operations.size, 2);
  });

  it("clones extended operations", async () => {
    const blues = new Set<Type>();
    let calls = 0;
    testHost.addJsFile("test.js", {
      $blue(p: any, t: Interface) {
        calls++;
        blues.add(t);
      },
    });

    testHost.addTypeSpecFile(
      "main.tsp",
      `
      import "./test.js";
      interface Foo { @blue foo(): int32 }
      @test interface Bar extends Foo {}
      `
    );

    const { Bar } = (await testHost.compile("./")) as {
      Bar: Interface;
    };

    strictEqual(calls, 2);
    ok(blues.has(Bar.operations.get("foo")!));
  });

  it("doesn't allow extensions to contain duplicate members", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      interface Bar { bar(): int32 }
      interface Baz { bar(): int32 }
      @test interface Foo extends Bar, Baz { }
      `
    );

    const diagnostics = await testHost.diagnose("./");
    expectDiagnostics(diagnostics, {
      code: "extends-interface-duplicate",
      message: "Interface extends cannot have duplicate members. The duplicate member is named bar",
    });
  });

  it("allows overriding extended interface members", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      interface Bar { bar(): int32 }
      @test interface Foo extends Bar { bar(): string }
      `
    );

    const { Foo } = (await testHost.compile("./")) as {
      Foo: Interface;
    };
    strictEqual(Foo.operations.size, 1);
    ok(Foo.operations.get("bar"));
    strictEqual((Foo.operations.get("bar")!.returnType as Model).name, "string");
  });

  it("doesn't allow extending non-interfaces", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      model Bar { }
      @test interface Foo extends Bar { bar(): string }
      `
    );

    const diagnostics = await testHost.diagnose("./");
    expectDiagnostics(diagnostics, {
      code: "extends-interface",
      message: "Interfaces can only extend other interfaces",
    });
  });

  it("doesn't invoke decorators on uninstantiated templates", async () => {
    const blues = new WeakSet();
    let calls = 0;
    testHost.addJsFile("dec.js", {
      $blue(p: any, t: Type) {
        calls++;
        blues.add(t);
      },
    });
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      import "./dec.js";
      @blue interface A<T> { @blue foo(): int32}
      `
    );
    await testHost.compile("./");
    strictEqual(calls, 0);
  });

  describe("templated operations", () => {
    it("can instantiate template operation inside non-templated interface", async () => {
      const { Foo, bar } = (await runner.compile(`
      @test interface Foo {
        @test bar<T>(): T;
      }

      alias Bar = Foo.bar<int32>;
      `)) as {
        Foo: Interface;
        bar: Operation;
      };

      strictEqual(Foo.operations.size, 1);
      ok(isTemplateDeclaration(Foo.operations.get("bar")!));

      const returnType = bar.returnType;
      strictEqual(returnType.kind, "Scalar" as const);
      strictEqual(returnType.name, "int32");
    });

    it("can instantiate template operation inside templated interface", async () => {
      const { Foo, bar } = (await runner.compile(`
      @test interface Foo<A> {
        @test bar<B>(input: A): B;
      }

      alias MyFoo = Foo<string>;
      alias Bar = MyFoo.bar<int32>;
      `)) as {
        Foo: Interface;
        bar: Operation;
      };

      strictEqual(Foo.operations.size, 1);
      ok(
        isTemplateDeclaration(Foo.operations.get("bar")!),
        "Operation inside MyFoo interface is still a template"
      );

      const input = bar.parameters.properties.get("input")!.type;
      strictEqual(input.kind, "Scalar" as const);
      strictEqual(input.name, "string");

      const returnType = bar.returnType;
      strictEqual(returnType.kind, "Scalar" as const);
      strictEqual(returnType.name, "int32");
    });

    it("cache templated operations", async () => {
      const { Index } = (await runner.compile(`
      @test interface Foo<A> {
        @test bar<B>(input: A): B;
      }

      alias MyFoo = Foo<string>;
      @test model Index {
        a: MyFoo.bar<string>;
        b: MyFoo.bar<string>;
      }
      `)) as {
        Index: Model;
      };
      const a = Index.properties.get("a");
      const b = Index.properties.get("b");
      ok(a);
      ok(b);

      strictEqual(a.type, b.type);
    });

    it("can extend an interface with templated operations", async () => {
      const { Foo, myBar: bar } = (await runner.compile(`
      interface Base<A> {
        bar<B>(input: A): B;
      }

      @test interface Foo extends Base<string> {
      }

      @test op myBar is Foo.bar<int32>;
      `)) as {
        Foo: Interface;
        myBar: Operation;
      };

      strictEqual(Foo.operations.size, 1);
      ok(
        isTemplateDeclaration(Foo.operations.get("bar")!),
        "Operation inside MyFoo interface is still a template"
      );

      const input = bar.parameters.properties.get("input")!.type;
      strictEqual(input.kind, "Scalar" as const);
      strictEqual(input.name, "string");

      const returnType = bar.returnType;
      strictEqual(returnType.kind, "Scalar" as const);
      strictEqual(returnType.name, "int32");
    });

    it("emit warning if shadowing parent templated type", async () => {
      const diagnostics = await runner.diagnose(`
      interface Base<A> {
        bar<A>(input: A): A;
      }
      `);

      expectDiagnostics(diagnostics, {
        code: "shadow",
        message: `Shadowing parent template parmaeter with the same name "A"`,
      });
    });

    it("emit diagnostic if trying to instantiate non templated operation", async () => {
      const diagnostics = await runner.diagnose(`
      interface Base<A> {
        bar(input: A): void;
      }

      alias MyBase = Base<string>;

      op myBar is MyBase.bar<int32>;
      `);

      expectDiagnostics(diagnostics, {
        code: "invalid-template-args",
        message: `Can't pass template arguments to non-templated type`,
      });
    });
  });
});
