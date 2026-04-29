import { deepStrictEqual, notStrictEqual, ok, strictEqual } from "assert";
import { describe, expect, it } from "vitest";
import { DecoratorContext, IntrinsicType, Type } from "../../src/core/types.js";
import { getDoc } from "../../src/index.js";
import { expectDiagnostics, mockFile, t } from "../../src/testing/index.js";
import { Tester } from "../tester.js";

describe("compiler: operations", () => {
  it("can return void", async () => {
    const { foo } = await Tester.compile(t.code`
      op ${t.op("foo")}(): void;
    `);
    strictEqual(foo.returnType.kind, "Intrinsic");
    strictEqual((foo.returnType as IntrinsicType).name, "void");
  });

  it("keeps reference to source operation", async () => {
    const { a, b } = await Tester.compile(t.code`
      op ${t.op("a")}(): void;
      op ${t.op("b")} is a;
    `);
    strictEqual(b.sourceOperation, a);
  });

  it("operation reference parameters are spread in target operation", async () => {
    const { a, b } = await Tester.compile(t.code`
      op ${t.op("a")}(one: string, two: string): void;
      op ${t.op("b")} is a;
    `);
    notStrictEqual(b.parameters, a.parameters);
    notStrictEqual(b.parameters.properties.get("one"), a.parameters.properties.get("one"));
    notStrictEqual(b.parameters.properties.get("two"), a.parameters.properties.get("two"));
    strictEqual(
      b.parameters.properties.get("one")?.sourceProperty,
      a.parameters.properties.get("one"),
    );
    strictEqual(
      b.parameters.properties.get("two")?.sourceProperty,
      a.parameters.properties.get("two"),
    );
  });

  describe("js special words for parameter names", () => {
    it.each(["constructor", "toString"])("%s", async (name) => {
      const { a } = await Tester.compile(t.code`
        op ${t.op("a")}(${name}: string): void;
      `);
      ok(a.parameters.properties.has(name));
    });
  });

  it("can decorate operation parameters independently", async () => {
    const { a, b, program } = await Tester.compile(t.code`
      op ${t.op("a")}(@doc("base doc") one: string): void;
      op ${t.op("b")} is a;

      @@doc(b::parameters.one, "override for b");
    `);
    strictEqual(getDoc(program, b.parameters.properties.get("one")!), "override for b");
    strictEqual(getDoc(program, a.parameters.properties.get("one")!), "base doc");
  });

  it("can decorate operation parameters independently from a template operation", async () => {
    const { b, c, program } = await Tester.compile(t.code`
      op a<T>(@doc("base doc") one: T): void;
      op ${t.op("b")} is a<string>;
      op ${t.op("c")} is a<string>;

      @@doc(b::parameters.one, "override for b");
    `);
    strictEqual(getDoc(program, b.parameters.properties.get("one")!), "override for b");
    strictEqual(getDoc(program, c.parameters.properties.get("one")!), "base doc");
  });

  it("can be templated and referenced to define other operations", async () => {
    const { newFoo } = await Tester.compile(t.code`
      op Foo<TName, TPayload>(name: TName, payload: TPayload): boolean;

      op ${t.op("newFoo")} is Foo<string, string>;
    `);

    strictEqual(newFoo.parameters.properties.size, 2);
    const props = Array.from(newFoo.parameters.properties.values());

    strictEqual(props[0].name, "name");
    strictEqual(props[0].type.kind, "Scalar");
    strictEqual(props[1].name, "payload");
    strictEqual(props[1].type.kind, "Scalar");
  });

  it("can be defined based on other operation references", async () => {
    const { newFoo } = await Tester.compile(t.code`
      op Foo<TName, TPayload>(name: TName, payload: TPayload): boolean;
      op NewFooBase<TPayload> is Foo<string, TPayload>;

      op ${t.op("newFoo")} is NewFooBase<string>;
    `);

    strictEqual(newFoo.parameters.properties.size, 2);
    const props = Array.from(newFoo.parameters.properties.values());

    strictEqual(props[0].name, "name");
    strictEqual(props[0].type.kind, "Scalar");
    strictEqual(props[1].name, "payload");
    strictEqual(props[1].type.kind, "Scalar");
  });

  it("can reference an operation when being defined in an interface", async () => {
    const { newFoo } = await Tester.compile(t.code`
      op Foo<TName, TPayload>(name: TName, payload: TPayload): boolean;

      interface Test {
        ${t.op("newFoo")} is Foo<string, string>;
      }
    `);
    strictEqual(newFoo.parameters.properties.size, 2);
    const props = Array.from(newFoo.parameters.properties.values());

    strictEqual(props[0].name, "name");
    strictEqual(props[0].type.kind, "Scalar");
    strictEqual(props[1].name, "payload");
    strictEqual(props[1].type.kind, "Scalar");
  });

  it("can reference an operation defined inside an interface", async () => {
    const { newFoo } = await Tester.compile(t.code`
      interface Foo {
        bar(): boolean;
      }
      
      op ${t.op("newFoo")} is Foo.bar;
    `);

    strictEqual(newFoo.returnType.kind, "Scalar" as const);
    strictEqual(newFoo.returnType.name, "boolean");
  });

  it("can reference an operation defined in the same interface", async () => {
    const { newFoo } = await Tester.compile(t.code`
      interface Foo {
        bar(): boolean;
        op ${t.op("newFoo")} is Foo.bar;
      }
    `);

    strictEqual(newFoo.returnType.kind, "Scalar" as const);
    strictEqual(newFoo.returnType.name, "boolean");
  });

  it("doesn't apply operation decorators to referenced signature", async () => {
    const { Foo } = await Tester.files({
      "test.js": mockFile.js({
        $alpha() {},
        $beta() {},
      }),
    }).compile(t.code`
      import "./test.js";
      @alpha
      op ${t.op("Foo")}<T>(): T;

      @beta
      op bar is Foo<string>;
    `);
    deepStrictEqual(
      Foo.decorators.map((x) => x.decorator.name),
      ["$alpha"],
    );
  });

  it("applies the decorators of the referenced operation and its transitive references", async () => {
    const alphaTargets = new Map<Type, Type>();
    const betaTargets = new Set<Type>();
    const gammaTargets = new Set<Type>();

    const { newFoo } = await Tester.files({
      "test.js": mockFile.js({
        $alpha(context: DecoratorContext, target: Type, param: Type) {
          alphaTargets.set(target, param);
        },

        $beta(context: DecoratorContext, target: Type) {
          betaTargets.add(target);
        },

        $gamma(context: DecoratorContext, target: Type) {
          gammaTargets.add(target);
        },
      }),
    }).compile(t.code`
      import "./test.js";
      @alpha(TPayload)
      op Foo<TName, TPayload>(name: TName, payload: TPayload): boolean;

      @beta
      op NewFooBase<TPayload> is Foo<string, TPayload>;

      @gamma
      op ${t.op("newFoo")} is NewFooBase<string>;
    `);
    strictEqual(newFoo.parameters.properties.size, 2);

    // Check that the decorators were applied correctly to `newFoo`
    strictEqual(alphaTargets.get(newFoo)?.kind, "Scalar");
    ok(betaTargets.has(newFoo));
    ok(gammaTargets.has(newFoo));
  });

  // Regression test for https://github.com/microsoft/typespec/issues/3199
  it("produce an empty interface operation in template when op is reference is invalid", async () => {
    const [{ test }, diagnostics] = await Tester.compileAndDiagnose(t.code`
      op ${t.op("test")} is IFace.Action<int32>;

      interface IFace {
        Action<T> is string;
      }
    `);
    expectDiagnostics(diagnostics, [
      {
        code: "is-operation",
        message: "Operation can only reuse the signature of another operation.",
      },
      {
        code: "is-operation",
        message: "Operation can only reuse the signature of another operation.",
      },
    ]);
    strictEqual(test.kind, "Operation");
    strictEqual(test.parameters.name, "");
    strictEqual(test.parameters.properties.size, 0);
    strictEqual(test.returnType.kind, "Intrinsic");
    strictEqual((test.returnType as IntrinsicType).name, "void");
  });

  it("emit diagnostic when operation is referencing itself as signature", async () => {
    const diagnostics = await Tester.diagnose(`
      op foo is foo;
    `);
    expectDiagnostics(diagnostics, [
      {
        code: "circular-op-signature",
        message: "Operation 'foo' recursively references itself.",
      },
    ]);
  });

  it("emit error when extends circular reference with alias", async () => {
    const diagnostics = await Tester.diagnose(`
      op a is b;
      op c is a;
      alias b = c;
    `);
    expectDiagnostics(diagnostics, {
      code: "circular-op-signature",
      message: `Operation 'a' recursively references itself.`,
    });
  });

  it("emit diagnostic when operation(in interface) is referencing itself as signature", async () => {
    const diagnostics = await Tester.diagnose(`
      interface Group {
        foo is Group.foo;
      }
    `);
    expectDiagnostics(diagnostics, {
      code: "circular-op-signature",
      message: "Operation 'foo' recursively references itself.",
    });
  });

  it("emit diagnostic when operations reference each other using signature", async () => {
    const diagnostics = await Tester.diagnose(`
      op foo is bar;
      op bar is foo;
    `);
    expectDiagnostics(diagnostics, [
      {
        code: "circular-op-signature",
        message: "Operation 'foo' recursively references itself.",
      },
    ]);
  });

  it("emit diagnostic when operations(in same interface) reference each other using signature", async () => {
    const diagnostics = await Tester.diagnose(`
      interface Group {
        foo is Group.bar;
        bar is Group.foo;
      }
    `);
    expectDiagnostics(diagnostics, [
      {
        code: "circular-op-signature",
        message: "Operation 'foo' recursively references itself.",
      },
    ]);
  });

  describe("circular ref in decorators", () => {
    it("operation can reference itself in a decorator", async () => {
      const tracked: any[] = [];
      const { foo } = await Tester.files({
        "track.js": mockFile.js({
          $track: (context: DecoratorContext, ...args: any[]) => {
            tracked.push(args);
          },
        }),
      }).compile(t.code`
        import "./track.js";
        @track(foo)
        op ${t.op("foo")}(): void;
      `);

      deepStrictEqual(tracked, [[foo, foo]]);
    });

    it("operation can reference another operation which reference back to this one", async () => {
      const tracked: any[] = [];
      const { foo, bar } = await Tester.files({
        "track.js": mockFile.js({
          $track: (context: DecoratorContext, ...args: any[]) => {
            tracked.push(args);
          },
        }),
      }).compile(t.code`
        import "./track.js";
        @track(foo)
        op ${t.op("bar")}(): void;

        @track(bar)
        op ${t.op("foo")}(): void;
      `);

      deepStrictEqual(tracked, [
        [foo, bar],
        [bar, foo],
      ]);
    });
  });
});

describe("ensure the parameters are fully resolved before marking the operation as resolved", () => {
  it("declared before", async () => {
    const { myOp } = await Tester.compile(t.code`
      model B {
        prop: myOp;
      }
      op Base(...B): void;
      op ${t.op("myOp")} is Base;
    `);
    expect(myOp.parameters.properties.has("prop")).toBe(true);
  });

  it("declared after", async () => {
    const { myOp } = await Tester.compile(t.code`
      op ${t.op("myOp")} is Base;
      op Base(...B): void;
      model B {
        prop: myOp;
      }
    `);
    expect(myOp.parameters.properties.has("prop")).toBe(true);
  });
});
