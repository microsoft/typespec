import { deepStrictEqual, notStrictEqual, ok, strictEqual } from "assert";
import { describe, expect, it, vi } from "vitest";
import { isTemplateDeclaration } from "../../src/core/type-utils.js";
import { Interface, Model, Type } from "../../src/core/types.js";
import { getDoc } from "../../src/index.js";
import { expectDiagnostics, mockFile, t } from "../../src/testing/index.js";
import { Tester } from "../tester.js";

describe("compiler: interfaces", () => {
  it("works", async () => {
    const blues = new Set<Type>();
    const { Foo, program } = await Tester.files({
      "test.js": mockFile.js({
        $blue(p: any, target: Interface) {
          blues.add(target);
        },
      }),
    }).import("./test.js").compile(t.code`
      @blue interface ${t.interface("Foo")} {
        @blue bar(): string;
      }
      `);

    strictEqual(Foo.namespace, program.checker.getGlobalNamespaceType());
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
    const diagnostics = await Tester.diagnose(`
      interface Foo {
        bar(): string;
        bar(): int32;
      }
      `);
    expectDiagnostics(diagnostics, {
      code: "interface-duplicate",
      message: "Interface already has a member named bar",
    });
  });

  it("can be templated", async () => {
    const { Foo, bar } = await Tester.compile(t.code`
      interface ${t.interface("Foo")}<T> {
        bar(): T;
      }

      alias MyFoo = Foo<int32>;
      op ${t.op("bar")} is MyFoo.bar;
      `);

    strictEqual(Foo.operations.size, 1);
    const returnType = bar.returnType;
    strictEqual(returnType.kind, "Scalar" as const);
    strictEqual(returnType.name, "int32");
  });

  it("can extend one other interfaces", async () => {
    const { Foo, bar } = await Tester.compile(t.code`
      interface Bar<T> { bar(): T }
      interface ${t.interface("Foo")}<T> extends Bar<T> {
        foo(): T;
      }

      alias Baz = Foo<int32>;
      op ${t.op("bar")} is Baz.bar;
      `);

    deepStrictEqual(
      Foo.sourceInterfaces.map((i) => i.name),
      ["Bar"],
    );
    strictEqual(Foo.operations.size, 2);
    ok(Foo.operations.get("foo"));
    ok(Foo.operations.get("bar"));
    strictEqual((bar.returnType as Model).name, "int32");
  });

  it("can extend two other interfaces", async () => {
    const { Foo, bar } = await Tester.compile(t.code`
      interface Bar<T> { bar(): T }
      interface Baz<T> { baz(): T }
      interface ${t.interface("Foo")}<T> extends Bar<T>, Baz<T> {
        foo(): T;
      }

      alias Qux = Foo<int32>;
      op ${t.op("bar")} is Qux.bar;
      `);

    deepStrictEqual(
      Foo.sourceInterfaces.map((i) => i.name),
      ["Bar", "Baz"],
    );
    strictEqual(Foo.operations.size, 3);
    ok(Foo.operations.get("foo"));
    ok(Foo.operations.get("bar"));
    ok(Foo.operations.get("baz"));
    strictEqual((bar.returnType as Model).name, "int32");
  });

  it("doesn't copy interface decorators down when using extends", async () => {
    const blues = new Set<Type>();
    const { Bar } = await Tester.files({
      "test.js": mockFile.js({
        $blue(p: any, target: Interface) {
          blues.add(target);
        },
      }),
    }).import("./test.js").compile(t.code`
      @blue interface Foo { foo(): int32 }
      interface ${t.interface("Bar")} extends Foo {
        bar(): int32;
      }
      `);

    ok(!blues.has(Bar));
    strictEqual(Bar.operations.size, 2);
  });

  it("clones extended operations", async () => {
    const blues = new Set<Type>();
    let calls = 0;
    const { Bar } = await Tester.files({
      "test.js": mockFile.js({
        $blue(p: any, target: Interface) {
          calls++;
          blues.add(target);
        },
      }),
    }).import("./test.js").compile(t.code`
      interface Foo { @blue foo(): int32 }
      interface ${t.interface("Bar")} extends Foo {}
      `);

    strictEqual(calls, 2);
    ok(blues.has(Bar.operations.get("foo")!));
  });

  it("doesn't allow extensions to contain duplicate members", async () => {
    const diagnostics = await Tester.diagnose(`
      interface Bar { bar(): int32 }
      interface Baz { bar(): int32 }
      interface Foo extends Bar, Baz { }
      `);

    expectDiagnostics(diagnostics, {
      code: "extends-interface-duplicate",
      message: "Interface extends cannot have duplicate members. The duplicate member is named bar",
    });
  });

  it("allows overriding extended interface members", async () => {
    const { Foo } = await Tester.compile(t.code`
      interface Bar { bar(): int32 }
      interface ${t.interface("Foo")} extends Bar { bar(): string }
      `);

    strictEqual(Foo.operations.size, 1);
    ok(Foo.operations.get("bar"));
    strictEqual((Foo.operations.get("bar")!.returnType as Model).name, "string");
  });

  it("doesn't allow extending non-interfaces", async () => {
    const diagnostics = await Tester.diagnose(`
      model Bar { }
      interface Foo extends Bar { bar(): string }
      `);

    expectDiagnostics(diagnostics, {
      code: "extends-interface",
      message: "Interfaces can only extend other interfaces",
    });
  });

  it("report error if trying to instantiate a templated interface without providing type arguments", async () => {
    const [{ pos }, diagnostics] = await Tester.compileAndDiagnose(`
      interface Base<T> {
        bar(): T;
      }
      op test is /*Base*/Base.bar;
    `);

    expectDiagnostics(diagnostics, {
      code: "invalid-template-args",
      message: "Template argument 'T' is required and not specified.",
      pos: pos.Base.pos,
    });
  });

  describe("report error if trying to reference another op in the same template", () => {
    it("before", async () => {
      const [{ pos }, diagnostics] = await Tester.compileAndDiagnose(`
      interface Base<A> {
        Custom<T>(): T;
        Default is /*Base*/Base.Custom<A>;
      }
    `);

      expectDiagnostics(diagnostics, [
        {
          code: "invalid-template-args",
          message: "Template argument 'A' is required and not specified.",
          pos: pos.Base.pos,
        },
      ]);
    });

    it("after", async () => {
      const [{ pos }, diagnostics] = await Tester.compileAndDiagnose(`
      interface Base<A> {
        Default is /*Base*/Base.Custom<A>;
        Custom<T>(): T;
      }
    `);

      expectDiagnostics(diagnostics, [
        {
          code: "invalid-template-args",
          message: "Template argument 'A' is required and not specified.",
          pos: pos.Base.pos,
        },
      ]);
    });
  });

  describe("templated operations", () => {
    it("can instantiate template operation inside non-templated interface", async () => {
      const { Foo, bar } = await Tester.compile(t.code`
      interface ${t.interface("Foo")} {
        bar<T>(): T;
      }

      op ${t.op("bar")} is Foo.bar<int32>;
      `);

      strictEqual(Foo.operations.size, 1);
      ok(isTemplateDeclaration(Foo.operations.get("bar")!));

      const returnType = bar.returnType;
      strictEqual(returnType.kind, "Scalar" as const);
      strictEqual(returnType.name, "int32");
    });

    it("can instantiate template operation inside templated interface", async () => {
      const { Foo, bar } = await Tester.compile(t.code`
      interface ${t.interface("Foo")}<A> {
        bar<B>(input: A): B;
      }

      alias MyFoo = Foo<string>;
      op ${t.op("bar")} is MyFoo.bar<int32>;
      `);

      strictEqual(Foo.operations.size, 1);

      const input = bar.parameters.properties.get("input")!.type;
      strictEqual(input.kind, "Scalar" as const);
      strictEqual(input.name, "string");

      const returnType = bar.returnType;
      strictEqual(returnType.kind, "Scalar" as const);
      strictEqual(returnType.name, "int32");
    });

    it("can instantiate template operation inside templated interface (inverted order)", async () => {
      const { Foo, bar } = await Tester.compile(t.code`
      op ${t.op("bar")} is MyFoo.bar<int32>;

      alias MyFoo = Foo<string>;
      
      interface ${t.interface("Foo")}<A> {
        bar<B>(input: A): B;
      }
      `);

      strictEqual(Foo.operations.size, 1);
      const input = bar.parameters.properties.get("input")!.type;
      strictEqual(input.kind, "Scalar" as const);
      strictEqual(input.name, "string");

      const returnType = bar.returnType;
      strictEqual(returnType.kind, "Scalar" as const);
      strictEqual(returnType.name, "int32");
    });

    it("cache templated operations", async () => {
      const { Index } = await Tester.compile(t.code`
      interface Foo<A> {
        bar<B>(input: A): B;
      }

      alias MyFoo = Foo<string>;
      model ${t.model("Index")} {
        a: MyFoo.bar<string>;
        b: MyFoo.bar<string>;
      }
      `);
      const a = Index.properties.get("a");
      const b = Index.properties.get("b");
      ok(a);
      ok(b);

      strictEqual(a.type, b.type);
    });

    it("templated interface with different args but templated operations with the same arg shouldn't be the same", async () => {
      const { Index } = await Tester.compile(t.code`
      interface Foo<A> {
        bar<B>(input: A): B;
      }

      alias MyFoo8 = Foo<int8>;
      alias MyFoo16 = Foo<int16>;
      model ${t.model("Index")} {
        a: MyFoo8.bar<string>;
        b: MyFoo16.bar<string>;
      }
      `);
      const a = Index.properties.get("a");
      const b = Index.properties.get("b");
      ok(a);
      ok(b);

      notStrictEqual(a.type, b.type);
    });

    it("can extend an interface with templated operations", async () => {
      const { Foo, myBar: bar } = await Tester.compile(t.code`
      interface Base<A> {
        bar<B>(input: A): B;
      }

      interface ${t.interface("Foo")} extends Base<string> {
      }

      op ${t.op("myBar")} is Foo.bar<int32>;
      `);

      strictEqual(Foo.operations.size, 1);

      const input = bar.parameters.properties.get("input")!.type;
      strictEqual(input.kind, "Scalar" as const);
      strictEqual(input.name, "string");

      const returnType = bar.returnType;
      strictEqual(returnType.kind, "Scalar" as const);
      strictEqual(returnType.name, "int32");
    });

    it("instantiating an templated interface doesn't finish template operation inside", async () => {
      const _track = vi.fn();
      await Tester.files({
        "dec.js": mockFile.js({
          $track() {
            _track();
          },
        }),
      }).import("./dec.js").compile(`
        interface Base<A> {
          @track bar<B>(input: A): B;
        }

        alias My = Base<string>;
        `);
      expect(_track).not.toHaveBeenCalled();
    });

    it("templated interface extending another templated interface doesn't run decorator on extended interface operations", async () => {
      const $track = vi.fn();
      await Tester.files({
        "dec.js": mockFile.js({ $track }),
      }).import("./dec.js").compile(`
        interface Base<T> {
          @track bar(): T;
        }

        interface Foo<T> extends Base<T> {}
        `);
      expect($track).not.toHaveBeenCalled();
    });

    it("emit warning if shadowing parent templated type", async () => {
      const diagnostics = await Tester.diagnose(`
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
      const diagnostics = await Tester.diagnose(`
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
      const { myBar } = await Tester.compile(t.code`
      interface Foo<A> {
        bar<B>(input: A): B;
      }

      alias MyFoo = Foo<string>;
      op ${t.op("myBar")} is MyFoo.bar<int32>;
      `);

      const input = myBar.parameters.properties.get("input")!.type;
      strictEqual(input.kind, "Scalar" as const);
      strictEqual(input.name, "string");

      const returnType = myBar.returnType;
      strictEqual(returnType.kind, "Scalar" as const);
      strictEqual(returnType.name, "int32");
    });
  });

  it("can decorate extended operations independently", async () => {
    const { Base, Extending, program } = await Tester.compile(t.code`
      interface ${t.interface("Base")} {@doc("base doc") one(): void}
      interface ${t.interface("Extending")} extends Base {}
      @@doc(Extending.one, "override for spread");
      `);
    strictEqual(getDoc(program, Extending.operations.get("one")!), "override for spread");
    strictEqual(getDoc(program, Base.operations.get("one")!), "base doc");
  });
});
