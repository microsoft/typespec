import { ok, strictEqual } from "assert";
import { Enum, Interface, Model, Operation, UnionVariant } from "../../core/types.js";
import { createTestHost, expectDiagnostics, TestHost } from "../../testing/index.js";

describe("compiler: references", () => {
  let testHost: TestHost;
  beforeEach(async () => {
    testHost = await createTestHost();
  });
  describe("model properties", () => {
    it("can reference model properties", async () => {
      testHost.addCadlFile(
        "main.cadl",
        `
      @test model Bar {
        x: string;
      }
      @test model Foo { y: Bar.x }
      `
      );

      const { Foo, Bar } = (await testHost.compile("./main.cadl")) as {
        Foo: Model;
        Bar: Model;
      };
      strictEqual(Foo.properties.get("y")!.type, Bar.properties.get("x"));
    });

    it("can reference spread model properties", async () => {
      testHost.addCadlFile(
        "main.cadl",
        `
      model Spreadable {
        y: string;
      }

      // Define a reference before the type is declared to make sure type is resolved completely.
      @test model Foo { x: Bar.x, y: Bar.y }

      @test model Bar {
        x: string;
        ... Spreadable;
      }
      `
      );

      const { Foo, Bar } = (await testHost.compile("./main.cadl")) as {
        Foo: Model;
        Bar: Model;
      };

      strictEqual(Foo.properties.get("y")!.type, Bar.properties.get("y"));
    });

    it("can reference spread model properties via alias", async () => {
      testHost.addCadlFile(
        "main.cadl",
        `
      model Spreadable {
        y: string;
      }

      alias SpreadAlias = Spreadable;

      @test model Bar {
        x: string;
        ... SpreadAlias;
      }

      @test model Foo { x: Bar.x, y: Bar.y }
      `
      );

      const { Foo, Bar } = (await testHost.compile("./main.cadl")) as {
        Foo: Model;
        Bar: Model;
      };

      strictEqual(Foo.properties.get("y")!.type, Bar.properties.get("y"));
    });

    it("can reference spread templated model properties", async () => {
      testHost.addCadlFile(
        "main.cadl",
        `
      model Spreadable<T> {
        y: T;
      }

      @test model Bar {
        x: string;
        ... Spreadable<string>;
      }

      @test model Foo { x: Bar.x, y: Bar.y }
      `
      );

      const { Foo, Bar } = (await testHost.compile("./main.cadl")) as {
        Foo: Model;
        Bar: Model;
      };

      strictEqual(Foo.properties.get("y")!.type, Bar.properties.get("y"));
    });

    it("can reference spread template properties", async () => {
      testHost.addCadlFile(
        "main.cadl",
        `
      model B {
        b: string;
      }

      @test model Spreadable<T> {
        a: string;
        ...T;
      }

      alias Spread = Spreadable<B>;
      @test model Foo { b: Spread.b }
      `
      );

      const { Foo, Spreadable } = (await testHost.compile("./main.cadl")) as {
        Foo: Model;
        Spreadable: Model;
      };

      strictEqual(Foo.properties.get("b")!.type, Spreadable.properties.get("b"));
    });

    it("can reference model is properties", async () => {
      testHost.addCadlFile(
        "main.cadl",
        `
      model Base {
        y: string;
      }

      @test model Bar is Base {
        x: string;
      }

      @test model Foo { x: Bar.x, y: Bar.y }
      `
      );

      const { Foo, Bar } = (await testHost.compile("./main.cadl")) as {
        Foo: Model;
        Bar: Model;
      };

      strictEqual(Foo.properties.get("y")!.type, Bar.properties.get("y"));
    });

    it("can reference inherited model properties", async () => {
      testHost.addCadlFile(
        "main.cadl",
        `
      @test model Base {
        y: string;
      }

      @test model Bar extends Base {
        x: string;
      }

      @test model Foo { x: Bar.x, y: Bar.y }
      `
      );

      const { Foo, Bar, Base } = (await testHost.compile("./main.cadl")) as {
        Foo: Model;
        Bar: Model;
        Base: Model;
      };

      strictEqual(Foo.properties.get("x")!.type, Bar.properties.get("x"));
      strictEqual(Foo.properties.get("y")!.type, Base.properties.get("y"));
    });

    it("can reference properties from declaration aliases", async () => {
      testHost.addCadlFile(
        "main.cadl",
        `
      @test model Bar {
        x: string;
      }

      alias BarAlias = Bar;

      @test model Foo {
        y: BarAlias.x,
      }
      `
      );

      const { Foo, Bar } = (await testHost.compile("./main.cadl")) as {
        Foo: Model;
        Bar: Model;
      };

      strictEqual(Foo.properties.get("y")!.type, Bar.properties.get("x"));
    });

    it("can reference properties from instantiated aliases", async () => {
      testHost.addCadlFile(
        "main.cadl",
        `
        @test model Bar<T> {
          x: T;
        }
  
        alias BarT = Bar<string>;
  
        @test model Foo {
          y: BarT.x,
        }
        `
      );

      const { Foo, Bar } = (await testHost.compile("./main.cadl")) as {
        Foo: Model;
        Bar: Model;
      };

      strictEqual(Foo.properties.get("y")!.type, Bar.properties.get("x"));
    });

    it("can reference spread property from instantiated aliases", async () => {
      testHost.addCadlFile(
        "main.cadl",
        `
        model Base<T> {
          x: T
        }

        @test model Bar<T> {
          ...Base<T>
        }
  
        alias BarT = Bar<string>;
  
        @test model Foo {
          y: BarT.x,
        }
        `
      );

      const { Foo, Bar } = (await testHost.compile("./main.cadl")) as {
        Foo: Model;
        Bar: Model;
      };

      strictEqual(Foo.properties.get("y")!.type, Bar.properties.get("x"));
    });

    it("can reference another model property defined before", async () => {
      testHost.addCadlFile(
        "main.cadl",
        `
      @test model Foo {
        a: string;
        b: Foo.a;
      }
      `
      );

      const { Foo } = (await testHost.compile("./main.cadl")) as {
        Foo: Model;
      };
      strictEqual(Foo.properties.get("b")!.type, Foo.properties.get("a"));
    });

    it("can reference another model property defined after", async () => {
      testHost.addCadlFile(
        "main.cadl",
        `
      @test model Foo {
        a: Foo.b;
        b: string;
      }
      `
      );

      const { Foo } = (await testHost.compile("./main.cadl")) as {
        Foo: Model;
      };
      strictEqual(Foo.properties.get("a")!.type, Foo.properties.get("b"));
    });
  });
  describe("enum members", () => {
    it("can reference enum members", async () => {
      testHost.addCadlFile(
        "main.cadl",
        `
      @test enum Foo {
        x, y, z
      };

      @test op Bar(arg: Foo.x): void;

      `
      );

      const { Foo, Bar } = (await testHost.compile("./main.cadl")) as {
        Foo: Enum;
        Bar: Operation;
      };

      strictEqual(Foo.members.get("x"), Bar.parameters.properties.get("arg")!.type);
    });

    it("can reference spread enum members", async () => {
      testHost.addCadlFile(
        "main.cadl",
        `

      enum Base {
        x, y
      }

      // Define a reference before the type is declared to make sure type is resolved completely.
      @test op Bar(arg: Foo.x): void;

      @test enum Foo {
        ...Base, z
      };

      `
      );

      const { Foo, Bar } = (await testHost.compile("./main.cadl")) as {
        Foo: Enum;
        Bar: Operation;
      };

      strictEqual(Foo.members.get("x"), Bar.parameters.properties.get("arg")!.type);
    });

    it("can reference aliased enum members", async () => {
      testHost.addCadlFile(
        "main.cadl",
        `
      @test enum Foo {
        x, y, z
      };

      alias FooAlias = Foo;
      @test op Bar(arg: FooAlias.x): void;
      `
      );

      const { Foo, Bar } = (await testHost.compile("./main.cadl")) as {
        Foo: Enum;
        Bar: Operation;
      };

      strictEqual(Foo.members.get("x"), Bar.parameters.properties.get("arg")!.type);
    });

    describe("reference in namespace decorator", () => {
      let taggedValue: Model | undefined;

      beforeEach(() => {
        taggedValue = undefined;
        testHost.addJsFile("collect.js", {
          $collect: (_: any, t: any, value: any) => (taggedValue = value),
        });
      });

      it("can reference enum resolved in a namespace decorator", async () => {
        testHost.addCadlFile(
          "main.cadl",
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
      `
        );

        const { MyEnum } = (await testHost.compile("./main.cadl")) as { MyEnum: Enum };

        ok(taggedValue);
        const t = taggedValue.properties.get("t")?.type;
        strictEqual(t?.kind, "Model" as const);
        strictEqual(t.properties.get("type")?.type.kind, "EnumMember" as const);
        strictEqual(t.properties.get("type")?.type, MyEnum.members.get("b"));
      });

      it("alias don't conflict", async () => {
        testHost.addCadlFile(
          "main.cadl",
          `
        import "./collect.js";
        
        @collect(Foo.a)
        namespace MyService;

        interface Base<TResource extends object> {}
        
        alias ViaAlias = Base<{}>;
        
        interface MyInterface extends ViaAlias {}
        
        @test enum Foo {
          a,
        }
        
      `
        );

        const { Foo } = (await testHost.compile("./main.cadl")) as {
          Foo: Enum;
        };

        strictEqual(taggedValue, Foo.members.get("a"));
      });
    });
  });

  describe("union variants", () => {
    it("can reference union variants", async () => {
      testHost.addCadlFile(
        "main.cadl",
        `
      union Foo {
        @test("x") x: string
      }

      @test model Bar { prop: Foo.x };
      `
      );

      const { x, Bar } = (await testHost.compile("./main.cadl")) as {
        x: UnionVariant;
        Bar: Model;
      };

      strictEqual(x, Bar.properties.get("prop")!.type);
    });

    it("can reference templated union variants", async () => {
      testHost.addCadlFile(
        "main.cadl",
        `
      union Foo<T> {
        @test("x") x: T
      }

      alias FooT = Foo<string>;

      @test model Bar { prop: FooT.x };
      `
      );

      const { x, Bar } = (await testHost.compile("./main.cadl")) as {
        x: UnionVariant;
        Bar: Model;
      };

      strictEqual(x, Bar.properties.get("prop")!.type);
    });
  });
  describe("interface members", () => {
    it("can reference interface members", async () => {
      testHost.addCadlFile(
        "main.cadl",
        `
      interface Foo {
        @test operation(): void;
      };

      @test model Bar { prop: Foo.operation };
      `
      );

      const { operation, Bar } = (await testHost.compile("./main.cadl")) as {
        operation: Operation;
        Bar: Model;
      };

      strictEqual(operation, Bar.properties.get("prop")!.type);
    });

    it("can reference aliased interface members", async () => {
      testHost.addCadlFile(
        "main.cadl",
        `
      interface Foo {
        @test operation(): void;
      };

      alias AliasFoo = Foo;

      @test model Bar { prop: AliasFoo.operation };
      `
      );

      const { operation, Bar } = (await testHost.compile("./main.cadl")) as {
        operation: Operation;
        Bar: Model;
      };

      strictEqual(operation, Bar.properties.get("prop")!.type);
    });

    it("can reference instantiated interface members", async () => {
      testHost.addCadlFile(
        "main.cadl",
        `
      interface Foo<T> {
        @test operation(): T;
      };

      alias AliasFoo = Foo<string>;

      @test model Bar { prop: AliasFoo.operation };
      `
      );

      const { operation, Bar } = (await testHost.compile("./main.cadl")) as {
        operation: Operation;
        Bar: Model;
      };

      strictEqual(operation, Bar.properties.get("prop")!.type);
    });

    it("can reference interface members included via extends", async () => {
      testHost.addCadlFile(
        "main.cadl",
        `
      interface Base {
        y(): void;
      }

      @test interface Bar extends Base {
        x(): void;
      }

      @test model Foo { y: Bar.y }
      `
      );

      const { Foo, Bar } = (await testHost.compile("./main.cadl")) as {
        Foo: Model;
        Bar: Interface;
      };

      strictEqual(Foo.properties.get("y")!.type, Bar.operations.get("y"));
    });

    describe("reference other members", () => {
      let linkedValue: Operation | undefined;
      beforeEach(() => {
        testHost.addJsFile("./test-link.js", {
          $testLink: (_: any, t: any, value: Operation) => {
            linkedValue;
          },
        });
      });
      it("defined before", async () => {
        testHost.addCadlFile(
          "main.cadl",
          `
        import "./test-link.js";
        @test interface Foo {
          one(): void;
          @testLink(Foo.one)
          two(): void;
        }
      `
        );

        const { Foo } = (await testHost.compile("./main.cadl")) as {
          Foo: Interface;
        };
        strictEqual(linkedValue, Foo.operations.get("a"));
      });

      it("defined after", async () => {
        testHost.addCadlFile(
          "main.cadl",
          `
        import "./test-link.js";
        @test interface Foo {
          @testLink(Foo.two) // <- No issues here!
          one(): void;
          two(): void;
        }
      `
        );

        const { Foo } = (await testHost.compile("./main.cadl")) as {
          Foo: Interface;
        };
        strictEqual(linkedValue, Foo.operations.get("a"));
      });
    });
  });

  it("throws proper diagnostics", async () => {
    testHost.addCadlFile(
      "main.cadl",
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
      `
    );

    const diagnostics = await testHost.diagnose("./main.cadl");

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
});
