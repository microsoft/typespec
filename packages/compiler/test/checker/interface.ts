import { match, ok, strictEqual } from "assert";
import { InterfaceType, ModelType, Type } from "../../core/types.js";
import { createTestHost, TestHost } from "../test-host.js";

describe("cadl: interfaces", () => {
  let testHost: TestHost;

  beforeEach(async () => {
    testHost = await createTestHost();
  });

  it("works", async () => {
    const blues = new Set<Type>();
    testHost.addJsFile("test.js", {
      $blue(p: any, t: InterfaceType) {
        blues.add(t);
      },
    });
    testHost.addCadlFile(
      "main.cadl",
      `
      import "./test.js";
      @test @blue interface Foo {
        @blue bar(): string;
      }
      `
    );

    const { Foo } = (await testHost.compile("./")) as {
      Foo: InterfaceType;
    };

    strictEqual(Foo.namespace, testHost.program.checker!.getGlobalNamespaceType());
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
    testHost.addCadlFile(
      "main.cadl",
      `
      @test interface Foo {
        bar(): string;
        bar(): int32;
      }
      `
    );

    const diagnostics = await testHost.diagnose("./");
    strictEqual(diagnostics.length, 1);
    match(diagnostics[0].message, /Interface already has a member/);
  });

  it("can be templated", async () => {
    testHost.addCadlFile(
      "main.cadl",
      `
      @test interface Foo<T> {
        bar(): T;
      }

      alias Bar = Foo<int32>;
      `
    );

    const { Foo } = (await testHost.compile("./")) as {
      Foo: InterfaceType;
    };

    strictEqual(Foo.operations.size, 1);
    const returnType: ModelType = Foo.operations.get("bar")!.returnType as ModelType;
    strictEqual(returnType.kind, "Model");
    strictEqual(returnType.name, "int32");
  });

  it("can mix in one other interfaces", async () => {
    testHost.addCadlFile(
      "main.cadl",
      `
      interface Bar<T> { bar(): T }
      @test interface Foo<T> mixes Bar<T> {
        foo(): T;
      }

      alias Baz = Foo<int32>;
      `
    );

    const { Foo } = (await testHost.compile("./")) as {
      Foo: InterfaceType;
    };
    strictEqual(Foo.operations.size, 2);
    ok(Foo.operations.get("foo"));
    ok(Foo.operations.get("bar"));
    strictEqual((Foo.operations.get("bar")!.returnType as ModelType).name, "int32");
  });

  it("can mix in two other interfaces", async () => {
    testHost.addCadlFile(
      "main.cadl",
      `
      interface Bar<T> { bar(): T }
      interface Baz<T> { baz(): T }
      @test interface Foo<T> mixes Bar<T>, Baz<T> {
        foo(): T;
      }

      alias Qux = Foo<int32>;
      `
    );

    const { Foo } = (await testHost.compile("./")) as {
      Foo: InterfaceType;
    };
    strictEqual(Foo.operations.size, 3);
    ok(Foo.operations.get("foo"));
    ok(Foo.operations.get("bar"));
    ok(Foo.operations.get("baz"));
    strictEqual((Foo.operations.get("bar")!.returnType as ModelType).name, "int32");
  });

  it("doesn't copy interface decorators down when using mixes", async () => {
    const blues = new Set<Type>();
    testHost.addJsFile("test.js", {
      $blue(p: any, t: InterfaceType) {
        blues.add(t);
      },
    });

    testHost.addCadlFile(
      "main.cadl",
      `
      import "./test.js";
      @blue interface Foo { foo(): int32 }
      @test interface Bar mixes Foo {
        bar(): int32;
      }
      `
    );

    const { Bar } = (await testHost.compile("./")) as {
      Bar: InterfaceType;
    };

    ok(!blues.has(Bar));
    strictEqual(Bar.operations.size, 2);
  });

  it("clones mixed operations", async () => {
    const blues = new Set<Type>();
    let calls = 0;
    testHost.addJsFile("test.js", {
      $blue(p: any, t: InterfaceType) {
        calls++;
        blues.add(t);
      },
    });

    testHost.addCadlFile(
      "main.cadl",
      `
      import "./test.js";
      interface Foo { @blue foo(): int32 }
      @test interface Bar mixes Foo {}
      `
    );

    const { Bar } = (await testHost.compile("./")) as {
      Bar: InterfaceType;
    };

    strictEqual(calls, 2);
    ok(blues.has(Bar.operations.get("foo")!));
  });

  it("doesn't allow mixins to contain duplicate members", async () => {
    testHost.addCadlFile(
      "main.cadl",
      `
      interface Bar { bar(): int32 }
      interface Baz { bar(): int32 }
      @test interface Foo mixes Bar, Baz { }
      `
    );

    const diagnostics = await testHost.diagnose("./");
    strictEqual(diagnostics.length, 1);
    match(diagnostics[0].message, /Interface mixes cannot have duplicate members/);
  });

  it("allows overriding mixed interface members", async () => {
    testHost.addCadlFile(
      "main.cadl",
      `
      interface Bar { bar(): int32 }
      @test interface Foo mixes Bar { bar(): string }
      `
    );

    const { Foo } = (await testHost.compile("./")) as {
      Foo: InterfaceType;
    };
    strictEqual(Foo.operations.size, 1);
    ok(Foo.operations.get("bar"));
    strictEqual((Foo.operations.get("bar")!.returnType as ModelType).name, "string");
  });

  it("doesn't allow mixing non-interfaces", async () => {
    testHost.addCadlFile(
      "main.cadl",
      `
      model Bar { }
      @test interface Foo mixes Bar { bar(): string }
      `
    );

    const diagnostics = await testHost.diagnose("./");
    strictEqual(diagnostics.length, 1);
    match(diagnostics[0].message, /Interfaces can only mix other interfaces/);
  });

  it("doesn't invoke decorators on uninstantiated templates", async () => {
    let blues = new WeakSet();
    let calls = 0;
    testHost.addJsFile("dec.js", {
      $blue(p: any, t: Type) {
        calls++;
        blues.add(t);
      },
    });
    testHost.addCadlFile(
      "main.cadl",
      `
      import "./dec.js";
      @blue interface A<T> { @blue foo(): int32}
      `
    );
    await testHost.compile("./");
    strictEqual(calls, 0);
  });
});
