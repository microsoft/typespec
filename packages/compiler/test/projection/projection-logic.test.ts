import { deepStrictEqual, fail, ok, strictEqual } from "assert";
import { beforeEach, describe, it } from "vitest";
import type { Program } from "../../src/core/program.js";
import { createProjector } from "../../src/core/projector.js";
import type {
  DecoratorArgumentValue,
  DecoratorContext,
  Enum,
  EnumMember,
  Interface,
  Model,
  Namespace,
  NumericLiteral,
  Operation,
  ProjectionApplication,
  StringLiteral,
  Type,
  Union,
} from "../../src/core/types.js";
import { projectProgram } from "../../src/index.js";
import { getDoc } from "../../src/lib/decorators.js";
import { TestHost, createTestHost } from "../../src/testing/index.js";

describe("compiler: projections: logic", () => {
  let testHost: TestHost;

  beforeEach(async () => {
    testHost = await createTestHost();
  });

  it("projects nested namespaces", async () => {
    const code = `
     namespace Bar.Baz;
     @test model Foo {
       a: string;
       b: int32;
     }

     #suppress "projections-are-experimental"
     projection Foo#v {
        to(version) {
          if version <= 1 {
            self::deleteProperty("a");
          };

          if version <= 2 {
            self::deleteProperty("b");
          };
        }
      }
     `;
    const result = (await testProjection(code, [projection("v", 1)])) as Model;
    strictEqual(
      result.namespace?.namespace?.name,
      "Bar",
      "Projections do not preserve Namespace parent relationships.",
    );
  });

  it("projects nested namespaces with decorator refering to another namespace", async () => {
    testHost.addJsFile("./ref.js", {
      $ref: () => null,
    });
    const code = `
    import "./ref.js";
     @ref(Other.MyModel)
     namespace MyOrg.MyService {
      @test model Foo {}
     }

     namespace Other {
      model MyModel {}
     }
     `;
    const result = (await testProjection(code, [projection("v", 1)])) as Model;
    strictEqual(result.namespace?.namespace?.name, "MyOrg");
  });

  // Test for https://github.com/microsoft/typespec/issues/786
  it("projects nested namespaces with common parent and decorator referencing each others content", async () => {
    const sym = Symbol("test-ref");
    testHost.addJsFile("./ref.js", {
      $ref: (context: DecoratorContext, target: Namespace, value: Type) =>
        context.program.stateMap(sym).set(target, value),
    });
    const code = `
    import "./ref.js";

     @ref(Lib.One.MyModel)
     namespace MyOrg.MyService {
      @test model Foo {}
     }

     namespace Lib.One {
      model MyModel {}
     }

     @ref(Lib.One.MyModel)
     namespace Lib.Two {

     }
     `;
    const result = (await testProjection(code, [projection("v", 1)])) as Model;
    strictEqual(result.namespace?.namespace?.name, "MyOrg");
    const map = testHost.program.stateMap(sym);
    const myModelProjected = testHost.program
      .getGlobalNamespaceType()
      .namespaces.get("Lib")
      ?.namespaces.get("One")
      ?.models.get("MyModel");
    const refs = [...map.values()];
    strictEqual(myModelProjected, refs[0]);
    strictEqual(myModelProjected, refs[1]);
  });

  it("takes parameters", async () => {
    const code = `
      @test model Foo {
        a: int32;
        b: int16;
        c: string;
      }

      #suppress "projections-are-experimental"
      projection Foo#v {
        to(version) {
          if version <= 1 {
            self::deleteProperty("c");
          };

          if version <= 2 {
            self::deleteProperty("b");
          };
        }
      }
    `;

    const result = (await testProjection(code, [projection("v", 1)])) as Model;
    strictEqual(result.properties.size, 1);

    const result2 = (await testProjection(code, [projection("v", 2)])) as Model;
    strictEqual(result2.properties.size, 2);
  });

  it("can call decorators", async () => {
    const code = `
      @test model Foo {
        a: int32;
      }

      #suppress "projections-are-experimental"
      projection Foo#test {
        to {
          @doc(self, "This is a model Foo");
          @doc(self.a, "Prop");
        }
      }
    `;
    const result = (await testProjection(code)) as Model;
    strictEqual(getDoc(testHost.program, result), "This is a model Foo");
    strictEqual(getDoc(testHost.program, result.properties.get("a")!), "Prop");
  });

  it("projects decorated types before projecting", async () => {
    let props;
    testHost.addJsFile("test.js", {
      $checkPropCount(_: Program, t: Model) {
        props = t.properties.size;
      },
    });
    const code = `
      import "./test.js";
      model Bar {
        a: int32;
      }

      #suppress "projections-are-experimental"
      projection Bar#munge {
        to {
         self::deleteProperty("a");
        }
      }

      @checkPropCount(Bar) @test model Foo { };
    `;

    await testProjection(code);
    strictEqual(props, 0);
  });

  it("imported js functions are in-scope", async () => {
    testHost.addJsFile("test.js", {
      foo() {
        return 1;
      },
    });

    const code = `
        import "./test.js";
        @test model Foo { }

        #suppress "projections-are-experimental"
        projection Foo#test {
          to {
            self::addProperty("value", foo());
          }
        }
      `;

    const result = (await testProjection(code)) as Model;
    const value = result.properties.get("value");
    ok(value);
    strictEqual(value.type.kind, "Number");
  });

  describe("models", () => {
    it("works for versioning", async () => {
      const addedOnKey = Symbol("addedOn");
      const removedOnKey = Symbol("removedOn");
      const renamedFromKey = Symbol("renamedFrom");
      testHost.addJsFile("versioning.js", {
        $added({ program }: DecoratorContext, t: Type, v: NumericLiteral) {
          program.stateMap(addedOnKey).set(t, v);
        },
        $removed({ program }: DecoratorContext, t: Type, v: NumericLiteral) {
          program.stateMap(removedOnKey).set(t, v);
        },
        $renamedFrom(
          { program }: DecoratorContext,
          t: Type,
          v: NumericLiteral,
          oldName: StringLiteral,
        ) {
          const record = { v, oldName };
          program.stateMap(renamedFromKey).set(t, record);
        },
        getAddedOn(p: Program, t: Type) {
          return p.stateMap(addedOnKey).get(t) || -1;
        },
        getRemovedOn(p: Program, t: Type) {
          return p.stateMap(removedOnKey).get(t) || Number.MAX_SAFE_INTEGER;
        },
        getRenamedFromVersions(p: Program, t: Type) {
          return p.stateMap(renamedFromKey).get(t)?.v ?? -1;
        },
        getNameAtVersion(p: Program, t: Type) {
          return p.stateMap(renamedFromKey).get(t)?.oldName || "";
        },
        getRenamedFromNewName(p: Program, t: Type) {
          return p.stateMap(renamedFromKey).get(t)?.newName || "";
        },
      });

      const code = `
        import "./versioning.js";

        @test model Foo {
          a: int32;
          @added(2) b: int16;
          @added(3) c: string;
          @removed(2) d: string;
          e: {
            x: string;
            @added(2) y: string;
          };
          @renamedFrom(2, "oldName") newName: string;
        }

        #suppress "projections-are-experimental"
        projection model#v {
          to(version) {
            if getAddedOn(self) > version {
              return void;
            } else {
              self::properties::forEach((p) => {
                if getAddedOn(p) > version {
                  self::deleteProperty(p::name);
                } else if getRemovedOn(p) <= version {
                  self::deleteProperty(p::name);
                } else if getRenamedFromVersions(p) > version {
                  self::renameProperty(p::name, getNameAtVersion(p, version));
                };
              });
            };
          }
          from(version) {
          }
        }
      `;

      const result = (await testProjection(code, [projection("v", 1)])) as Model;
      strictEqual(result.properties.size, 4);
      const resultNested = result.properties.get("e")!.type as Model;
      strictEqual(resultNested.properties.size, 1);

      const result2 = (await testProjection(code, [projection("v", 2)])) as Model;
      strictEqual(result2.properties.size, 4);
      const resultNested2 = result2.properties.get("e")!.type as Model;
      strictEqual(resultNested2.properties.size, 2);
    });

    it("can recursively apply projections to nested models", async () => {
      const code = `
        @test model Foo {
          prop_one: {
            nested_prop: string;
          };
        }
        
        #suppress "projections-are-experimental"
        projection model#test {
          to {
            self::properties::forEach((p) => {
              self::renameProperty(p::name, p::name::toCamelCase());
            });
          }
          from {
            self::properties::forEach((p) => {
              self::renameProperty(p::name, p::name::toSnakeCase());
            });
          }
        }
        `;

      const result = (await testProjection(code)) as Model;
      const propOne = result.properties.get("propOne")!;
      ok(propOne, "has propOne");
      const nestedProp = (propOne.type as Model).properties.get("nestedProp")!;
      ok(nestedProp, "has nestedProp");

      const backResult = (await testProjection(
        code,
        [projection("test", [], "from")],
        result,
      )) as Model;

      const prop_one = backResult.properties.get("prop_one")!;
      ok(prop_one, "has prop_one");
      const nested_prop = (prop_one.type as Model).properties.get("nested_prop")!;
      ok(nested_prop, "has nested_prop");
    });

    it("can rename itself", async () => {
      const code = `
        @test model Foo {
          prop: string;
        }
        
        #suppress "projections-are-experimental"
        projection Foo#test {
          to {
            self::rename("Bar");
          }
        }`;

      const result = (await testProjection(code)) as Model;
      strictEqual(result.kind, "Model");
      strictEqual(result.name, "Bar");
      strictEqual(result.namespace!.models.get("Bar"), result);
    });

    it("can replace itself", async () => {
      const code = `
        @test model Foo {
          prop: string;
        }
        
        #suppress "projections-are-experimental"
        projection Foo#test {
          to {
            if 1 {
              return void;
            };
          }
          from {
            return void;
          }
        }`;

      const result = (await testProjection(code)) as Model;
      strictEqual(result.kind, "Intrinsic");
      strictEqual(result.name, "void");
    });

    describe("renaming properties", () => {
      async function testRenameProjection(verb: string, modelCode?: string): Promise<Model> {
        const defaultModelCode = `
          @test model Foo {
            foo_prop: string;
            bar_prop: string;
          }
        `;
        const code = `
          ${modelCode ?? defaultModelCode}
          #suppress "projections-are-experimental"
          projection Foo#test {
            to {
              self::properties::forEach((p) => {
                self::renameProperty(p::name, p::name::${verb}());
              });
            }
          }
        `;
        return (await testProjection(code)) as Model;
      }

      it("can round trip", async () => {
        const code = `
          @test model Foo {
            foo_prop: string;
            bar_prop: int32;
          }

          #suppress "projections-are-experimental"
          projection model#toCamelCase {
            to {
              self::properties::forEach((p) => {
                self::renameProperty(p::name, p::name::toCamelCase());
              });
            }
            from {
              self::properties::forEach((p) => {
                self::renameProperty(p::name, p::name::toSnakeCase());
              });
            }
          }
          `;
        const cased = (await testProjection(code, [projection("toCamelCase")])) as Model;
        ok(cased.properties.has("fooProp"));
        ok(cased.properties.has("barProp"));
        const uncased = (await testProjection(
          code,
          [projection("toCamelCase", [], "from")],
          cased,
        )) as Model;
        ok(uncased.properties.has("foo_prop"));
        ok(uncased.properties.has("bar_prop"));
      });

      it("can camel case", async () => {
        const projected = await testRenameProjection("toCamelCase");
        strictEqual(projected.properties.size, 2);
        const foo = projected.properties.get("fooProp");
        ok(foo);
        strictEqual(foo.name, "fooProp");
        const bar = projected.properties.get("barProp");
        ok(bar);
        strictEqual(bar.name, "barProp");

        deepStrictEqual(
          Array.from(projected.properties.values()).map((o) => o.name),
          ["fooProp", "barProp"], // ensure not re-ordered by rename
        );
      });

      it("can pascal case", async () => {
        const projected = await testRenameProjection("toPascalCase");

        strictEqual(projected.properties.size, 2);
        const foo = projected.properties.get("FooProp");
        ok(foo);
        strictEqual(foo.name, "FooProp");
        const bar = projected.properties.get("BarProp");
        ok(bar);
        strictEqual(bar.name, "BarProp");

        deepStrictEqual(
          Array.from(projected.properties.values()).map((o) => o.name),
          ["FooProp", "BarProp"], // ensure not re-ordered by rename
        );
      });

      it("can snake case", async () => {
        const projected = await testRenameProjection(
          "toSnakeCase",
          `@test model Foo { fooProp: string, barProp: string }`,
        );

        strictEqual(projected.properties.size, 2);
        const foo = projected.properties.get("foo_prop");
        ok(foo);
        strictEqual(foo.name, "foo_prop");
        const bar = projected.properties.get("bar_prop");
        ok(bar);
        strictEqual(bar.name, "bar_prop");

        deepStrictEqual(
          Array.from(projected.properties.values()).map((o) => o.name),
          ["foo_prop", "bar_prop"], // ensure not re-ordered by rename
        );
      });

      it("can kebab case", async () => {
        const projected = await testRenameProjection("toKebabCase");

        strictEqual(projected.properties.size, 2);
        const foo = projected.properties.get("foo-prop");
        ok(foo);
        strictEqual(foo.name, "foo-prop");
        const bar = projected.properties.get("bar-prop");
        ok(bar);
        strictEqual(bar.name, "bar-prop");

        deepStrictEqual(
          Array.from(projected.properties.values()).map((o) => o.name),
          ["foo-prop", "bar-prop"], // ensure not re-ordered by rename
        );
      });
    });
  });

  describe("unions", () => {
    const unionCode = `
      @test union Foo {
        bar_prop: int32;
        baz_prop: string;
      }
    `;

    const defaultCode = (body: string) => `
      ${unionCode}
      ${projectionCode(body)}
    `;

    function assertHasVariant(union: Union, name: string) {
      const variant = union.variants.get(name);
      ok(variant, `Union ${union.name ?? "anonymous"} should have variant named ${name}`);
      strictEqual(variant.name, name);
    }

    function assertVariantType(union: Union, variantName: string, typeName: string) {
      assertHasVariant(union, variantName);
      const variant = union.variants.get(variantName)!;
      strictEqual((variant.type as Model).name, typeName);
    }

    it("can rename itself", async () => {
      const code = `
       ${unionCode}
        
        #suppress "projections-are-experimental"
        projection Foo#test {
          to {
            self::rename("Bar");
          }
        }`;

      const result = (await testProjection(code)) as Model;
      strictEqual(result.kind, "Union");
      strictEqual(result.name, "Bar");
      strictEqual(result.namespace!.unions.get("Bar"), result);
    });

    it("can rename variants", async () => {
      const code = defaultCode(`
        self::variants::forEach((v) => {
          self::renameVariant(v::name, v::name::toCamelCase());
        });
      `);

      const result = (await testProjection(code)) as Union;
      assertHasVariant(result, "barProp");
      assertHasVariant(result, "bazProp");

      deepStrictEqual(
        Array.from(result.variants.values()).map((o) => o.name),
        ["barProp", "bazProp"], // ensure not re-ordered by rename
      );
    });

    it("can set variant types", async () => {
      const code = defaultCode(`
        self.bar_prop::setType(int16);
      `);
      const result = (await testProjection(code)) as Union;
      assertVariantType(result, "bar_prop", "int16");
    });
    it("can add variant types", async () => {
      const code = defaultCode(`
        self::addVariant("new", int16);
      `);
      const result = (await testProjection(code)) as Union;
      assertVariantType(result, "new", "int16");
    });
    it("can remove variant types", async () => {
      const code = defaultCode(`
        self::deleteVariant("bar_prop");
      `);
      const result = (await testProjection(code)) as Union;
      ok(!result.variants.has("bar_prop"));
    });

    it("removes variants projected to never", async () => {
      const code = `
        model Bar { }
        @test union Foo {
          a: string;
          b: Bar;
        }
        #suppress "projections-are-experimental"
        projection Bar#test {
          to {
            return never;
          }
        }
      `;

      const result = (await testProjection(code)) as Union;
      strictEqual(result.variants.size, 1);
      ok(result.variants.has("a"));
      ok(!result.variants.has("b"));
    });
  });

  describe("operations", () => {
    it("can access parameters and return type", async () => {
      testHost.addTypeSpecFile(
        "main.tsp",
        `
        @test op Foo(): void;
        
        #suppress "projections-are-experimental"
        projection op#test {
          to {
            return { x: self::parameters, y: self::returnType };
          }
        }
        `,
      );
      const { Foo } = (await testHost.compile("main.tsp")) as { Foo: Operation };
      const result = testHost.program.checker.project(
        Foo,
        Foo.projections.find((x) => x.id.sv === "test")!.to!,
      ) as Model;
      strictEqual(result.properties.get("x")!.type.kind, "Model");
      strictEqual(result.properties.get("y")!.type.kind, "Intrinsic");
    });

    it("can rename itself", async () => {
      const code = `
        @test op Foo(): string;
        
        #suppress "projections-are-experimental"
        projection Foo#test {
          to {
            self::rename("Bar");
          }
        }`;

      const result = (await testProjection(code)) as Model;
      strictEqual(result.kind, "Operation");
      strictEqual(result.name, "Bar");
      strictEqual(result.namespace!.operations.get("Bar"), result);
    });
  });

  describe("interfaces", () => {
    const interfaceCode = `
      @test interface Foo {
        op1(): void;
        op2(): void;
      }
    `;

    const defaultCode = (body: string) => `
      ${interfaceCode}
      ${projectionCode(body)}
    `;

    it("can rename itself", async () => {
      const code = `
        ${interfaceCode}
        
        #suppress "projections-are-experimental"
        projection Foo#test {
          to {
            self::rename("Bar");
          }
        }`;

      const result = (await testProjection(code)) as Model;
      strictEqual(result.kind, "Interface");
      strictEqual(result.name, "Bar");
      strictEqual(result.namespace!.interfaces.get("Bar"), result);
    });

    it("can add members", async () => {
      const code = defaultCode(`self::addOperation("bar", {param: string}, void);`);
      const FooProj = (await testProjection(code)) as Interface;
      const newOp = FooProj.operations.get("bar");
      ok(newOp);
      strictEqual(newOp.parameters.properties.size, 1);
      strictEqual(newOp.returnType.kind, "Intrinsic");
    });

    it("can remove members", async () => {
      const code = defaultCode(`self::deleteOperation("op1");`);
      const FooProj = (await testProjection(code)) as Interface;

      strictEqual(FooProj.operations.size, 1);
    });

    it("can rename members", async () => {
      const code = defaultCode(`self::renameOperation("op1", "op1_renamed");`);
      const FooProj = (await testProjection(code)) as Interface;

      deepStrictEqual(
        Array.from(FooProj.operations.values()).map((o) => o.name),
        ["op1_renamed", "op2"], // ensure not re-ordered by rename
      );
    });
  });

  describe("enums", () => {
    const enumCode = `
      @test enum Foo {
        one: 1;
        two: 2;
      }
    `;

    const defaultCode = (body: string) => `
      ${enumCode}
      ${projectionCode(body)}
    `;

    it("can rename itself", async () => {
      const code = `
        ${enumCode}
        
        #suppress "projections-are-experimental"
        projection Foo#test {
          to {
            self::rename("Bar");
          }
        }`;

      const result = (await testProjection(code)) as Model;
      strictEqual(result.kind, "Enum");
      strictEqual(result.name, "Bar");
      strictEqual(result.namespace!.enums.get("Bar"), result);
    });

    it("can add members", async () => {
      const code = defaultCode(`self::addMember("three", 3);`);
      const result = (await testProjection(code)) as Enum;
      strictEqual(result.members.size, 3);
      const newMember = result.members.get("three")!;
      strictEqual(newMember.name, "three");
      strictEqual(newMember.value, 3);
    });
    it("can delete members", async () => {
      const code = defaultCode(`self::deleteMember("two");`);
      const result = (await testProjection(code)) as Enum;
      strictEqual(result.members.size, 1);
    });

    it("can rename members", async () => {
      const code = defaultCode(`self::renameMember("one", "mewone");`);
      const result = (await testProjection(code)) as Enum;
      const newMember = result.members.get("mewone")!;
      strictEqual(newMember.name, "mewone");
      deepStrictEqual(
        Array.from(result.members.values()).map((o) => o.name),
        ["mewone", "two"], // ensure not re-ordered by rename
      );
    });

    // Issue here happens when an enum member gets referenced before the enum and so gets projected before the enum creating a different projected type as the projected enum.
    it("project enum correctly when enum member is referenced first", async () => {
      const result = (await testProjection(`
        @test model Foo {
          a: Bar.a;
          bar: Bar;
        }
        
        enum Bar {a, b}
      
      `)) as Model;

      const a = result.properties.get("a")!.type as EnumMember;
      const Bar = result.properties.get("bar")!.type;
      strictEqual(a.enum, Bar);
    });
  });

  // TODO with realm move that to realm testing area.
  it("[REALM] any program/projected program get access to every type state", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      @doc("abc")
      @test model Foo {}

      #suppress "projections-are-experimental"
      projection Foo#test {
        to { self::rename("Bar"); }
      }
    `,
    );
    const { Foo } = await testHost.compile("main.tsp");
    const program = testHost.program;
    strictEqual(getDoc(program, Foo), "abc");

    const projectedProgram = projectProgram(program, [{ projectionName: "test", arguments: [] }]);
    const ProjectedFoo = projectedProgram.projector.projectedTypes.get(Foo);
    ok(ProjectedFoo);
    strictEqual(
      getDoc(projectedProgram, Foo),
      "abc",
      "Can access state from a non projected type using a projected program",
    );
    strictEqual(
      getDoc(program, ProjectedFoo),
      "abc",
      "Can access state from a projected type using the original program",
    );
    strictEqual(
      getDoc(projectedProgram, ProjectedFoo),
      "abc",
      "Can access state from a projected type using a projected program",
    );
  });

  describe("template types", () => {
    describe("does NOT run decorators when projecting template declarations", () => {
      async function expectMarkDecoratorNotCalled(code: string) {
        testHost.addJsFile("mark.js", {
          $mark: () => fail("Should not have called decorator"),
        });

        const fullCode = `
      import "./mark.js";

      ${code}

      #suppress "projections-are-experimental"
      projection model#test {
          to {
            
          }
        }
     `;
        await testProjection(fullCode, [projection("test")]);
      }

      it("on model", async () => {
        await expectMarkDecoratorNotCalled(`
          model Foo<T> {
            @mark(T)
            prop: string;
          }
        `);
      });

      it("on model properties", async () => {
        await expectMarkDecoratorNotCalled(`
          model Foo<T> {
            @mark(T)
            prop: string;
          }
        `);
      });

      it("on model properties (on operation)", async () => {
        await expectMarkDecoratorNotCalled(`
          op foo<T>(): {
            @mark(T)
            prop: string;
          };
        `);
      });

      it("on model properties (nested)", async () => {
        await expectMarkDecoratorNotCalled(`
          model Foo<T> {
            nested: {
              @mark(T)
              prop: string;
            }
          }
        `);
      });
    });

    describe("run decorators when projecting template instance", () => {
      async function expectMarkDecoratorCalledTimes(code: string, amount: number) {
        let run = 0;

        testHost.addJsFile("mark.js", {
          $mark: () => {
            run++;
          },
        });

        testHost.addTypeSpecFile(
          "main.tsp",
          `
        import "./mark.js";
  
        ${code}
  
        #suppress "projections-are-experimental"
        projection model#test {
            to {
              
            }
          }
       `,
        );
        await testHost.compile("main.tsp");
        run = 0; // reset we only intrested after projection
        createProjector(testHost.program, [
          {
            arguments: [],
            projectionName: "test",
          },
        ]);
        strictEqual(run, amount);
      }

      it("on model", async () => {
        await expectMarkDecoratorCalledTimes(
          `
          model Foo<T> {
            @mark(T)
            prop: string;
          }

          model Instance {prop: Foo<string>};
        `,
          1,
        );
      });

      it("on model properties", async () => {
        await expectMarkDecoratorCalledTimes(
          `
          model Foo<T> {
            @mark(T)
            prop: string;
          }
          model Instance {prop: Foo<string>};
        `,
          1,
        );
      });

      it("on model properties (on operation)", async () => {
        await expectMarkDecoratorCalledTimes(
          `
          op foo<T>(): {
            @mark(T)
            prop: string;
          };

          op instance is foo<string>;
        `,
          1,
        );
      });
    });
  });
  describe("project decorator referencing target in argument", () => {
    async function checkSelfRefInDecorator(code: string) {
      testHost.addJsFile("self-ref.js", {
        $selfRef: () => {},
      });

      testHost.addTypeSpecFile(
        "main.tsp",
        `
        import "./self-ref.js";
  
        ${code}
  
        #suppress "projections-are-experimental"
        projection model#test {
            to {
              
            }
          }
       `,
      );
      await testHost.compile("main.tsp");
      createProjector(testHost.program, [
        {
          arguments: [],
          projectionName: "test",
        },
      ]);
    }

    it("on model", () => checkSelfRefInDecorator(`@selfRef(Foo) model Foo {}`));
    it("on scalar", () => checkSelfRefInDecorator(`@selfRef(foo) scalar foo;`));
    it("on operation", () => checkSelfRefInDecorator(`@selfRef(foo) op foo(): void;`));
    it("on interface", () => checkSelfRefInDecorator(`@selfRef(Foo) interface Foo {} `));
    it("on enum", () => checkSelfRefInDecorator(`@selfRef(Foo) enum Foo {} `));
    it("on union", () => checkSelfRefInDecorator(`@selfRef(Foo) union Foo {} `));
  });
  const projectionCode = (body: string) => `
      #suppress "projections-are-experimental"
      projection Foo#test {
        to {
          ${body}
        }
      }

    `;
  async function testProjection(
    code: string,
    projections: ProjectionApplication[] = [
      {
        arguments: [],
        projectionName: "test",
      },
    ],
    startNode?: Type,
  ): Promise<Type> {
    testHost.addTypeSpecFile("main.tsp", code);
    const { Foo } = await testHost.compile("main.tsp");
    const projector = createProjector(testHost.program, projections, startNode).projector;
    return projector.projectedTypes.get(startNode ?? Foo)!;
  }
});

function projection(
  projectionName: string,
  args: DecoratorArgumentValue[] | DecoratorArgumentValue = [],
  direction: "to" | "from" = "to",
): ProjectionApplication {
  return {
    arguments: Array.isArray(args) ? args : [args],
    projectionName,
    direction,
  };
}
