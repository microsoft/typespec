import { deepStrictEqual, notStrictEqual, ok, strictEqual } from "assert";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { isTemplateDeclaration } from "../../src/core/type-utils.js";
import { Interface, Model, Operation, Type } from "../../src/core/types.js";
import { getDoc } from "../../src/index.js";
import {
  BasicTestRunner,
  TestHost,
  createTestHost,
  createTestRunner,
  expectDiagnostics,
} from "../../src/testing/index.js";

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
      `,
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
      `,
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
      `,
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
      `,
    );

    const { Foo } = (await testHost.compile("./")) as {
      Foo: Interface;
    };
    deepStrictEqual(
      Foo.sourceInterfaces.map((i) => i.name),
      ["Bar"],
    );
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
      `,
    );

    const { Foo } = (await testHost.compile("./")) as {
      Foo: Interface;
    };
    deepStrictEqual(
      Foo.sourceInterfaces.map((i) => i.name),
      ["Bar", "Baz"],
    );
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
      `,
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
      `,
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
      `,
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
      `,
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
      `,
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
      `,
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

      const input = bar.parameters.properties.get("input")!.type;
      strictEqual(input.kind, "Scalar" as const);
      strictEqual(input.name, "string");

      const returnType = bar.returnType;
      strictEqual(returnType.kind, "Scalar" as const);
      strictEqual(returnType.name, "int32");
    });

    it("can instantiate template operation inside templated interface (inverted order)", async () => {
      const { Foo, bar } = (await runner.compile(`
      alias Bar = MyFoo.bar<int32>;

      alias MyFoo = Foo<string>;
      
      @test interface Foo<A> {
        @test bar<B>(input: A): B;
      }
      `)) as {
        Foo: Interface;
        bar: Operation;
      };

      strictEqual(Foo.operations.size, 1);
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

    it("templated interface with different args but templated operations with the same arg shouldn't be the same", async () => {
      const { Index } = (await runner.compile(`
      @test interface Foo<A> {
        @test bar<B>(input: A): B;
      }

      alias MyFoo8 = Foo<int8>;
      alias MyFoo16 = Foo<int16>;
      @test model Index {
        a: MyFoo8.bar<string>;
        b: MyFoo16.bar<string>;
      }
      `)) as {
        Index: Model;
      };
      const a = Index.properties.get("a");
      const b = Index.properties.get("b");
      ok(a);
      ok(b);

      notStrictEqual(a.type, b.type);
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

      const input = bar.parameters.properties.get("input")!.type;
      strictEqual(input.kind, "Scalar" as const);
      strictEqual(input.name, "string");

      const returnType = bar.returnType;
      strictEqual(returnType.kind, "Scalar" as const);
      strictEqual(returnType.name, "int32");
    });

    it("instantiating an templated interface doesn't finish template operation inside", async () => {
      const $track = vi.fn();
      testHost.addJsFile("dec.js", { $track });
      testHost.addTypeSpecFile(
        "main.tsp",
        `
        import "./dec.js";
         
         interface Base<A> {
          @track bar<B>(input: A): B;
        }

        alias My = Base<string>;
        `,
      );
      await testHost.compile("./");
      expect($track).not.toHaveBeenCalled();
    });

    it("templated interface extending another templated interface doesn't run decorator on extended interface operations", async () => {
      const $track = vi.fn();
      testHost.addJsFile("dec.js", { $track });
      testHost.addTypeSpecFile(
        "main.tsp",
        `
        import "./dec.js";
         
        interface Base<T> {
          @track bar(): T;
        }

        interface Foo<T> extends Base<T> {}
        `,
      );
      await testHost.compile("./");
      expect($track).not.toHaveBeenCalled();
    });

    it("emit warning if shadowing parent templated type", async () => {
      const diagnostics = await runner.diagnose(`
      interface Base<A> {
        bar<A>(input: A): A;
      }
      `);

      expectDiagnostics(diagnostics, {
        code: "shadow",
        message: `Shadowing parent template parameter with the same name "A"`,
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

    // https://github.com/microsoft/typespec/pull/2617
    it("can 'op is' a templated operation inside templated interface", async () => {
      const { myBar } = (await runner.compile(`
      interface Foo<A> {
        bar<B>(input: A): B;
      }

      alias MyFoo = Foo<string>;
      @test op myBar is MyFoo.bar<int32>;
      `)) as {
        myBar: Operation;
      };

      const input = myBar.parameters.properties.get("input")!.type;
      strictEqual(input.kind, "Scalar" as const);
      strictEqual(input.name, "string");

      const returnType = myBar.returnType;
      strictEqual(returnType.kind, "Scalar" as const);
      strictEqual(returnType.name, "int32");
    });
  });

  it("can decorate extended operations independently", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      @test interface Base {@doc("base doc") one(): void}
      @test interface Extending extends Base {}
      @@doc(Extending.one, "override for spread");
      `,
    );
    const { Base, Extending } = (await testHost.compile("main.tsp")) as {
      Base: Interface;
      Extending: Interface;
    };
    strictEqual(getDoc(testHost.program, Extending.operations.get("one")!), "override for spread");
    strictEqual(getDoc(testHost.program, Base.operations.get("one")!), "base doc");
  });
});
