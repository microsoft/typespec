/* eslint-disable vitest/valid-describe-callback */
import { ok, strictEqual } from "assert";
import { beforeEach, describe, it } from "vitest";
import { Enum, Interface, Model, Operation, Type } from "../../src/core/types.js";
import { TestHost, createTestHost, expectDiagnostics } from "../../src/testing/index.js";

describe("compiler: references", () => {
  let testHost: TestHost;
  beforeEach(async () => {
    testHost = await createTestHost();
  });

  function itCanReference({
    code,
    ref,
    resolveTarget,
  }: {
    code: string;
    ref: string;
    resolveTarget?: (target: any) => Type | undefined;
  }) {
    async function runTest(code: string) {
      testHost.addTypeSpecFile("main.tsp", code);
      const { RefContainer, target } = (await testHost.compile("./main.tsp")) as {
        RefContainer: Model;
        target: any;
      };
      const expectedTarget = resolveTarget ? resolveTarget(target) : target;
      strictEqual(RefContainer.properties.get("y")!.type, expectedTarget);
    }
    const refCode = `
      @test model RefContainer { y: ${ref} }
    `;
    it("reference before declaration", () => runTest(`${refCode}\n${code}`));

    it("reference after declaration", () => runTest(`${code}\n${refCode}`));
  }

  describe("model properties", () => {
    describe("simple property", () =>
      itCanReference({
        code: `
      model MyModel {
        @test("target") x: string;
      }`,
        ref: "MyModel.x",
      }));

    describe("member of alias of alias of model", () =>
      itCanReference({
        code: `
          model MyModel {
            @test("target") x: string;
          }
          alias Alias1  = MyModel;
          alias MyModelAlias  = Alias1;
        `,
        ref: "MyModelAlias.x",
      }));

    describe("spread property from model defined before", () =>
      itCanReference({
        code: `
          model Spreadable {
            y: string;
          }
    
          @test("target") model MyModel {
            x: string;
            ... Spreadable;
          }`,
        ref: "MyModel.y",
        resolveTarget: (target: Model) => target.properties.get("y"),
      }));

    describe("spread property from model defined after", () =>
      itCanReference({
        code: `
          @test("target") model MyModel {
            x: string;
            ... Spreadable;
          }
          
          model Spreadable {
            y: string;
          }`,
        ref: "MyModel.y",
        resolveTarget: (target: Model) => target.properties.get("y"),
      }));

    describe("spread property via alias", () =>
      itCanReference({
        code: `
          model Spreadable {
            y: string;
          }
    
          alias SpreadAlias = Spreadable;
    
          @test("target") model MyModel {
            x: string;
            ... SpreadAlias;
          }
        `,
        ref: "MyModel.y",
        resolveTarget: (target: Model) => target.properties.get("y"),
      }));

    describe("spread property via alias of alias", () =>
      itCanReference({
        code: `
          model Spreadable {
            y: string;
          }
    
          alias SpreadAlias1 = Spreadable;
          alias SpreadAlias2 = SpreadAlias1;
          alias SpreadAlias3 = SpreadAlias2;
    
          @test("target") model MyModel {
            x: string;
            ... SpreadAlias3;
          }
        `,
        ref: "MyModel.y",
        resolveTarget: (target: Model) => target.properties.get("y"),
      }));

    describe("spread property from a templated model", () =>
      itCanReference({
        code: `
          model Spreadable<T> {
            y: T;
          }
    
    
          @test("target") model MyModel {
            x: string;
            ... Spreadable<string>;
          }
        `,
        ref: "MyModel.y",
        resolveTarget: (target: Model) => target.properties.get("y"),
      }));

    describe("spread property from a template parameter", () =>
      itCanReference({
        code: `
          model B {
            b: string;
          }
    
          @test("target") model Spreadable<T> {
            a: string;
            ...T;
          }
    
          alias Spread = Spreadable<B>;
        `,
        ref: "Spread.b",
        resolveTarget: (target: Model) => target.properties.get("b"),
      }));

    describe("property from `model is`", () =>
      itCanReference({
        code: `
          model Base {
            y: string;
          }
    
          @test("target") model MyModel is Base {
            x: string;
          }`,
        ref: "MyModel.y",
        resolveTarget: (target: Model) => target.properties.get("y"),
      }));

    describe("inherited property", () =>
      itCanReference({
        code: `
          // Here the base model property is what ends up being referenced.
          @test("target") model Base {
            y: string;
          }
    
          model MyModel extends Base {
            x: string;
          }`,
        ref: "MyModel.y",
        resolveTarget: (base: Model) => base.properties.get("y"),
      }));

    describe("property from template instance alias", () =>
      itCanReference({
        code: `
          @test("target") model Template<T> {
            y: T;
          }
    
          alias MyModel = Template<string>;
        `,
        ref: "MyModel.y",
        resolveTarget: (target: Model) => target.properties.get("y"),
      }));

    describe("spread property from template instance alias", () =>
      itCanReference({
        code: `
          model Base<T> {
            y: T
          }

          @test("target") model Template<T> {
            ...Base<T>
          }
    
          alias MyModel = Template<string>;
        `,
        ref: "MyModel.y",
        resolveTarget: (target: Model) => target.properties.get("y"),
      }));

    describe("sibling property", () => {
      it("can reference sibling property defined before", async () => {
        testHost.addTypeSpecFile(
          "main.tsp",
          `
      @test model Foo {
        a: string;
        b: Foo.a;
      }
      `,
        );

        const { Foo } = (await testHost.compile("./main.tsp")) as {
          Foo: Model;
        };
        strictEqual(Foo.properties.get("b")!.type, Foo.properties.get("a"));
      });

      it("can reference sibling property defined after", async () => {
        testHost.addTypeSpecFile(
          "main.tsp",
          `
      @test model Foo {
        a: Foo.b;
        b: string;
      }
      `,
        );

        const { Foo } = (await testHost.compile("./main.tsp")) as {
          Foo: Model;
        };
        strictEqual(Foo.properties.get("a")!.type, Foo.properties.get("b"));
      });
    });
  });

  describe("enum members", () => {
    describe("simple enum member", () =>
      itCanReference({
        code: `
          enum MyEnum {
            @test("target") x, y, z
          }
        `,
        ref: "MyEnum.x",
      }));

    describe("spread member", () =>
      itCanReference({
        code: `
          enum Spreadable {
            x, y
          }
    
          @test("target") enum MyEnum {
            ... Spreadable,
            z
          }`,
        ref: "MyEnum.y",
        resolveTarget: (target: Enum) => target.members.get("y"),
      }));

    describe("alias enum, member", () =>
      itCanReference({
        code: `
          enum MyEnum {
            x, @test("target") y
          }
    
          alias MyEnumAlias = MyEnum;
        `,
        ref: "MyEnumAlias.y",
      }));

    describe("reference in namespace decorator", () => {
      let taggedValue: Model | undefined;

      beforeEach(() => {
        taggedValue = undefined;
        testHost.addJsFile("collect.js", {
          $collect: (_: any, t: any, value: any) => (taggedValue = value),
        });
      });

      it("can reference enum resolved in a namespace decorator", async () => {
        testHost.addTypeSpecFile(
          "main.tsp",
          `
          import "./collect.js";
          @test enum MyEnum { a, b }

          model Template<T extends AorB> {
            t: T;
          }

          alias AorB = A | B;

          model A {
            type: MyEnum.a;
          }

          model B {
            type: MyEnum.b;
          }

          model My {
            type: MyEnum.b;
          }

          @collect(Template<My>)
          namespace Test { }
      `,
        );

        const { MyEnum } = (await testHost.compile("./main.tsp")) as { MyEnum: Enum };

        ok(taggedValue);
        const t = taggedValue.properties.get("t")?.type;
        strictEqual(t?.kind, "Model" as const);
        strictEqual(t.properties.get("type")?.type.kind, "EnumMember" as const);
        strictEqual(t.properties.get("type")?.type, MyEnum.members.get("b"));
      });

      it("alias don't conflict", async () => {
        testHost.addTypeSpecFile(
          "main.tsp",
          `
        import "./collect.js";
        
        @collect(Foo.a)
        namespace MyService;

        interface Base<TResource> {}
        
        alias ViaAlias<T> = Base<T>;
        alias ViaAlias2 = ViaAlias<string>;
        
        interface MyInterface extends ViaAlias2 {}
        
        @test enum Foo {
          a,
        }
        
      `,
        );

        const { Foo } = (await testHost.compile("./main.tsp")) as {
          Foo: Enum;
        };

        strictEqual(taggedValue, Foo.members.get("a"));
      });
    });
  });

  describe("union variants", () => {
    describe("simple variant", () =>
      itCanReference({
        code: `
          union MyUnion {
            @test("target") x: string;
          }
        `,
        ref: "MyUnion.x",
      }));

    describe("variant in alias union", () =>
      itCanReference({
        code: `
          union MyUnion {
            @test("target") x: string;
          }

          alias MyUnionAlias = MyUnion;
        `,
        ref: "MyUnionAlias.x",
      }));

    describe("variant in template union instance", () =>
      itCanReference({
        code: `
          union MyUnion<T> {
            @test("target") x: T;
          }

          alias MyUnionT = MyUnion<string>;

        `,
        ref: "MyUnionT.x",
      }));
  });

  describe("interface members", () => {
    describe("simple member", () =>
      itCanReference({
        code: `
          interface MyInterface {
            @test("target") operation(): void;
          }
        `,
        ref: "MyInterface.operation",
      }));

    describe("member of alias interface", () =>
      itCanReference({
        code: `
          interface MyInterface {
            @test("target") operation(): void;
          }
          alias MyInterfaceAlias  = MyInterface;
        `,
        ref: "MyInterfaceAlias.operation",
      }));

    describe("member of alias of alias of interface", () =>
      itCanReference({
        code: `
          interface MyInterface {
            @test("target") operation(): void;
          }
          alias MyInterfaceAlias1  = MyInterface;
          alias MyInterfaceAlias  = MyInterfaceAlias1;
        `,
        ref: "MyInterfaceAlias.operation",
      }));

    describe("member of templated interface instance", () =>
      itCanReference({
        code: `
          interface MyInterface<T> {
            @test("target") operation(): T;
          }
          alias MyInterfaceT  = MyInterface<string>;
        `,
        ref: "MyInterfaceT.operation",
      }));

    describe("member from `interface extends`", () =>
      itCanReference({
        code: `
          interface Base {
            operation(): void;
          }
    
          @test("target") interface MyInterface extends Base {
            x(): void;
          }
        `,
        ref: "MyInterface.operation",
        resolveTarget: (target: Interface) => target.operations.get("operation"),
      }));

    describe("reference sibling members", () => {
      let linkedValue: Operation | undefined;
      beforeEach(() => {
        testHost.addJsFile("./test-link.js", {
          $testLink: (_: any, t: any, value: Operation) => {},
        });
      });
      it("defined before", async () => {
        testHost.addTypeSpecFile(
          "main.tsp",
          `
        import "./test-link.js";
        @test interface Foo {
          one(): void;
          @testLink(Foo.one)
          two(): void;
        }
      `,
        );

        const { Foo } = (await testHost.compile("./main.tsp")) as {
          Foo: Interface;
        };
        strictEqual(linkedValue, Foo.operations.get("a"));
      });

      it("defined after", async () => {
        testHost.addTypeSpecFile(
          "main.tsp",
          `
        import "./test-link.js";
        @test interface Foo {
          @testLink(Foo.two) // <- No issues here!
          one(): void;
          two(): void;
        }
      `,
        );

        const { Foo } = (await testHost.compile("./main.tsp")) as {
          Foo: Interface;
        };
        strictEqual(linkedValue, Foo.operations.get("a"));
      });
    });
  });

  it("throws proper diagnostics", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      model M { }
      interface I { }
      union U { }
      enum E { }

      model Test {
        m: M.x;
        i: I.x;
        u: U.x;
        e: E.x;
      }
      `,
    );

    const diagnostics = await testHost.diagnose("./main.tsp");

    expectDiagnostics(diagnostics, [
      {
        code: "invalid-ref",
        message: `Model doesn't have member x`,
      },
      {
        code: "invalid-ref",
        message: `Interface doesn't have member x`,
      },
      {
        code: "invalid-ref",
        message: `Union doesn't have member x`,
      },
      {
        code: "invalid-ref",
        message: `Enum doesn't have member x`,
      },
    ]);
  });

  it("referencing alias that reference an invalid ref should emit diagnostic", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      alias A = NotDefined;
      alias B = A;
      `,
    );

    const diagnostics = await testHost.diagnose("./main.tsp");

    expectDiagnostics(diagnostics, [
      {
        code: "unknown-identifier",
        message: `Unknown identifier NotDefined`,
      },
    ]);
  });

  describe("Meta types", () => {
    describe("ModelProperty::type that is an expression", () =>
      itCanReference({
        code: `
          model Person {
            address: {
              @test("target") city: string
            }
          }
        `,
        ref: "Person.address::type.city",
      }));

    describe("ModelProperty::type that is a type reference", () =>
      itCanReference({
        code: `
          model Person {
            address: Address
          }
          model Address {
            @test("target") city: string
          }
        `,
        ref: "Person.address::type.city",
      }));
    describe("Operation::returnType", () =>
      itCanReference({
        code: `
          op testOp(): {@test("target")status: 200};
        `,
        ref: "testOp::returnType.status",
      }));

    describe("Operation::parameters", () =>
      itCanReference({
        code: `
          op testOp(@test("target") select: string, other: string): void;
        `,
        ref: "testOp::parameters.select",
      }));

    it("emits a diagnostic when referencing a non-existent meta type property", async () => {
      testHost.addTypeSpecFile(
        "main.tsp",
        `
        model A {
          name: string;
        }

        model B {
          a: A;
        }

        op testOp(...B::foo): void;
        `,
      );

      const diagnostics = await testHost.diagnose("./main.tsp");

      expectDiagnostics(diagnostics, [
        {
          code: "invalid-ref",
          message: `Model doesn't have meta property foo`,
        },
      ]);
    });

    // Error should be removed when this is fixed https://github.com/microsoft/typespec/issues/2213
    it("(TEMP) emits a diagnostic when referencing a non-resolved meta type property", async () => {
      testHost.addTypeSpecFile(
        "main.tsp",
        `
        model A {
          name: string;
        }

        model B {
          a: A;
        }

        model Spread {
          ... B.a::type;
        }
        `,
      );

      const diagnostics = await testHost.diagnose("./main.tsp");

      expectDiagnostics(diagnostics, [
        {
          code: "invalid-ref",
          message: `ModelProperty doesn't have meta property type`,
        },
      ]);
    });
  });
});
