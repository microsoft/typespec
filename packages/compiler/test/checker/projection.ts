import { ok, strictEqual } from "assert";
import { Program } from "../../core/program.js";
import {
  IntrinsicType,
  ModelType,
  NumericLiteralType,
  StringLiteralType,
  Type,
  UnionType,
} from "../../core/types.js";
import { createTestHost, TestHost } from "../test-host.js";

describe("cadl: projections", () => {
  let testHost: TestHost;

  beforeEach(async () => {
    testHost = await createTestHost();
  });

  it("takes parameters", async () => {
    testHost.addCadlFile(
      "main.cadl",
      `
      @test model Foo {
        a: int32;
        b: int16;
        c: string;
      }

      projection Foo#v {
        to(version) {
          if version <= 1 {
            self.deleteProperty("c");
          };

          if version <= 2 {
            self.deleteProperty("b");
          };
        }
      }
    `
    );

    const { Foo } = (await testHost.compile("main.cadl")) as { Foo: ModelType };

    let result = testHost.program.checker!.project(Foo, Foo.projections[0].to!, [1]) as ModelType;
    strictEqual(result.properties.size, 1);

    let result2 = testHost.program.checker!.project(Foo, Foo.projections[0].to!, [2]) as ModelType;
    strictEqual(result2.properties.size, 2);
  });

  describe("models", () => {
    it("works for versioning", async () => {
      const addedOnKey = Symbol();
      const removedOnKey = Symbol();
      const renamedFromKey = Symbol();
      testHost.addJsFile("versioning.js", {
        $added(p: Program, t: Type, v: NumericLiteralType) {
          p.stateMap(addedOnKey).set(t, v);
        },
        $removed(p: Program, t: Type, v: NumericLiteralType) {
          p.stateMap(removedOnKey).set(t, v);
        },
        $renamedFrom(p: Program, t: Type, v: NumericLiteralType, oldName: StringLiteralType) {
          const record = { v, oldName };
          p.stateMap(renamedFromKey).set(t, record);
        },
        getAddedOn(p: Program, t: Type) {
          return p.stateMap(addedOnKey).get(t) || -1;
        },
        getRemovedOn(p: Program, t: Type) {
          return p.stateMap(removedOnKey).get(t) || Infinity;
        },
        getRenamedFromVersion(p: Program, t: Type) {
          return p.stateMap(renamedFromKey).get(t)?.v ?? -1;
        },
        getRenamedFromOldName(p: Program, t: Type) {
          return p.stateMap(renamedFromKey).get(t)?.oldName || "";
        },
      });

      testHost.addCadlFile(
        "main.cadl",
        `
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

        projection model#v {
          to(version) {
            if getAddedOn(self) > version {
              return void;
            } else {
              self.properties.forEach((p) => {
                if getAddedOn(p) > version {
                  self.deleteProperty(p.name);
                } else if getRemovedOn(p) <= version {
                  self.deleteProperty(p.name);
                } else if getRenamedFromVersion(p) > version {
                  self.renameProperty(p.name, getRenamedFromOldName(p));
                } else {
                  self.projectProperty(p.name, v, version);
                };
              });
            };
          }
          from(version) {
          }
        }
      `
      );

      const { Foo } = (await testHost.compile("main.cadl")) as { Foo: ModelType };
      const toVersion = Foo.projections[0].to!;

      let result = testHost.program.checker!.project(Foo, toVersion, [1]) as ModelType;
      strictEqual(result.properties.size, 4);
      let resultNested = result.properties.get("e")!.type as ModelType;
      strictEqual(resultNested.properties.size, 1);

      let result2 = testHost.program.checker!.project(Foo, toVersion, [2]) as ModelType;
      strictEqual(result2.properties.size, 4);
      let resultNested2 = result2.properties.get("e")!.type as ModelType;
      strictEqual(resultNested2.properties.size, 2);
    });

    it("can recursively apply projections to nested models", async () => {
      testHost.addCadlFile(
        "main.cadl",
        `
        @test model Foo {
          prop_one: {
            nested_prop: string;
          };
        }
        
        projection model#camelCase {
          to {
            self.properties.forEach((p) => {
              self.renameProperty(p.name, p.name.toCamelCase());
              p.setType(p.type#camelCase);
            });
          }
          from {
            self.properties.forEach((p) => {
              self.renameProperty(p.name, p.name.toSnakeCase());
              p.setType(p.type#camelCase);
            });
          }
        }
        `
      );

      const { Foo } = (await testHost.compile("main.cadl")) as { Foo: ModelType };
      let result = testHost.program.checker!.project(Foo, Foo.projections[0].to!, [1]) as ModelType;
      const propOne = result.properties.get("propOne")!;
      ok(propOne, "has propOne");
      const nestedProp = (propOne.type as ModelType).properties.get("nestedProp")!;
      ok(nestedProp, "has nestedProp");

      const backResult = testHost.program.checker!.project(result, Foo.projections[0].from!, [
        1,
      ]) as ModelType;
      const prop_one = backResult.properties.get("prop_one")!;
      ok(prop_one, "has prop_one");
      const nested_prop = (prop_one.type as ModelType).properties.get("nested_prop")!;
      ok(nested_prop, "has nested_prop");
    });

    it("can replace itself", async () => {
      testHost.addCadlFile(
        "main.cadl",
        `
      @test model Foo {
        prop: string;
      }
      
      projection model#deleted {
        to {
          if 1 {
            return void;
          };
        }
        from {
          return void;
        }
      }
      `
      );
      const { Foo } = (await testHost.compile("main.cadl")) as { Foo: ModelType };
      let result = testHost.program.checker!.project(Foo, Foo.projections[0].to!, [
        1,
      ]) as IntrinsicType;
      strictEqual(result.kind, "Intrinsic");
      strictEqual(result.name, "void");
    });

    it("imported js functions are in-scope", async () => {
      testHost.addJsFile("test.js", {
        foo() {
          return 1;
        },
      });

      const result = await doProjection("model Foo { }", `self.addProperty("value", foo());`, [
        "./test.js",
      ]);
      const value = result.properties.get("value");
      ok(value);
      strictEqual(value.type.kind, "Number");
    });

    describe("renaming properties", () => {
      const testModel = `model Foo {
      foo_prop: string;
      bar_prop: string;
    }`;

      it("can round trip", async () => {
        testHost.addCadlFile(
          "main.cadl",
          `
          @test model Foo {
            foo_prop: string;
            bar_prop: int32;
          }

          projection model#toCamelCase {
            to {
              self.properties.forEach((p) => {
                self.renameProperty(p.name, p.name.toCamelCase());
              });
            }
            from {
              self.properties.forEach((p) => {
                self.renameProperty(p.name, p.name.toSnakeCase());
              });
            }
          }
          `
        );

        const { Foo } = (await testHost.compile("main.cadl")) as { Foo: ModelType };
        const toCase = Foo.projections[0].to!;
        const fromCase = Foo.projections[0].from!;
        const cased = testHost.program.checker!.project(Foo, toCase) as ModelType;
        const uncased = testHost.program.checker!.project(cased, fromCase) as ModelType;

        Foo.properties.forEach((prop) => {
          ok(uncased.properties.has(prop.name));
        });
      });

      it("can camel case", async () => {
        const projected = await doProjection(
          testModel,
          `self.properties.forEach((p) => {
          self.renameProperty(p.name, p.name.toCamelCase());
        });`
        );

        strictEqual(projected.properties.size, 2);
        const foo = projected.properties.get("fooProp");
        ok(foo);
        strictEqual(foo.name, "fooProp");
        const bar = projected.properties.get("barProp");
        ok(bar);
        strictEqual(bar.name, "barProp");
      });

      it("can pascal case", async () => {
        const projected = await doProjection(
          testModel,
          `self.properties.forEach((p) => {
          self.renameProperty(p.name, p.name.toPascalCase());
        });`
        );

        strictEqual(projected.properties.size, 2);
        const foo = projected.properties.get("FooProp");
        ok(foo);
        strictEqual(foo.name, "FooProp");
        const bar = projected.properties.get("BarProp");
        ok(bar);
        strictEqual(bar.name, "BarProp");
      });

      it("can snake case", async () => {
        const projected = await doProjection(
          `model Foo { fooProp: string, barProp: string }`,
          `self.properties.forEach((p) => {
            self.renameProperty(p.name, p.name.toSnakeCase());
          });`
        );

        strictEqual(projected.properties.size, 2);
        const foo = projected.properties.get("foo_prop");
        ok(foo);
        strictEqual(foo.name, "foo_prop");
        const bar = projected.properties.get("bar_prop");
        ok(bar);
        strictEqual(bar.name, "bar_prop");
      });

      it("can kebab case", async () => {
        const projected = await doProjection(
          `model Foo { fooProp: string, barProp: string }`,
          `self.properties.forEach((p) => {
          self.renameProperty(p.name, p.name.toKebabCase());
        });`
        );

        strictEqual(projected.properties.size, 2);
        const foo = projected.properties.get("foo-prop");
        ok(foo);
        strictEqual(foo.name, "foo-prop");
        const bar = projected.properties.get("bar-prop");
        ok(bar);
        strictEqual(bar.name, "bar-prop");
      });
    });

    async function doProjection(
      model: string,
      projection: string,
      imports: string[] = []
    ): Promise<ModelType> {
      testHost.addCadlFile(
        "main.cadl",
        `
      ${imports.map((v) => `import "${v}";`).join("\n")}
      @test ${model}
      projection model #test {
        to {
          ${projection}
        }
      }
      `
      );
      const { Foo } = (await testHost.compile("main.cadl")) as { Foo: ModelType };
      return testHost.program.checker!.project(Foo, Foo.projections[0].to!) as ModelType;
    }
  });

  describe("unions", () => {
    const testModel = `
      @test union Foo {
        bar_prop: int32;
        baz_prop: string;
      }
    `;

    async function project(code: string, additionalCode = "") {
      testHost.addCadlFile(
        "main.cadl",
        `
        ${testModel}
        
        projection union#project {
          to {
            ${code}
          }
        }

        ${additionalCode}
        `
      );
      const { Foo } = (await testHost.compile("main.cadl")) as { Foo: UnionType };
      return testHost.program.checker!.project(Foo, Foo.projections[0].to!) as UnionType;
    }

    function assertHasVariant(union: UnionType, name: string) {
      const variant = union.variants.get(name);
      ok(variant, `Union ${union.name ?? "anonymous"} should have variant named ${name}`);
      strictEqual(variant.name, name);
    }

    function assertVariantType(union: UnionType, variantName: string, typeName: string) {
      assertHasVariant(union, variantName);
      const variant = union.variants.get(variantName)!;
      strictEqual((variant.type as ModelType).name, typeName);
    }

    it("can rename variants", async () => {
      const result = await project(`
        self.variants.forEach((v) => {
          self.renameVariant(v.name, v.name.toCamelCase());
        });
      `);

      assertHasVariant(result, "barProp");
      assertHasVariant(result, "bazProp");
    });

    it("can set variant types", async () => {
      const result = await project(`
        self.getVariant("bar_prop").setType(int16);
      `);

      assertVariantType(result, "bar_prop", "int16");
    });
    it("can add variant types", async () => {
      const result = await project(`
        self.addVariant("new", int16);
      `);

      assertVariantType(result, "new", "int16");
    });
    it("can remove variant types", async () => {
      const result = await project(`
        self.deleteVariant("bar_prop");
      `);

      ok(!result.variants.has("bar_prop"));
    });

    it("can project variant types", async () => {
      const result = await project(
        `
        self.projectVariant("bar_prop", addModelProp);
      `,
        `
      projection model#addModelProp {
        to {
          self.addProperty("hi", int32);
        }
      }
      `
      );

      const variant = result.variants.get("bar_prop")!;
      const variantType = result.variants.get("bar_prop")!.type as ModelType;
      ok(variantType.properties.has("hi"));
    });
  });

  describe("projection instructions", () => {
    it("can emit instructions for rename", async () => {
      testHost.addCadlFile(
        "main.cadl",
        `
      @test model Foo {
        prop_one: {
          nested_prop: string;
        };
      }
      
      projection model#camelCase {
        to {
          self.properties.forEach((p) => {
            self.projectProperty(p.name, camelCase);
            self.renameProperty(p.name, p.name.toCamelCase());
          });
        }
        from {
          self.properties.forEach((p) => {
            self.projectProperty(p.name, camelCase);
            self.renameProperty(p.name, p.name.toSnakeCase());
          });
        }
      }
      `
      );

      const { Foo } = (await testHost.compile("main.cadl")) as { Foo: ModelType };
      let result = testHost.program.checker!.getProjectionInstructions(Foo, Foo.projections[0].to!);
      console.log(JSON.stringify(result, null, 4));
    });

    it("can emit instructions for versioning", async () => {
      const addedOnKey = Symbol();
      const removedOnKey = Symbol();
      const renamedFromKey = Symbol();
      testHost.addJsFile("versioning.js", {
        $added(p: Program, t: Type, v: NumericLiteralType) {
          p.stateMap(addedOnKey).set(t, v);
        },
        $removed(p: Program, t: Type, v: NumericLiteralType) {
          p.stateMap(removedOnKey).set(t, v);
        },
        $renamedFrom(p: Program, t: Type, v: NumericLiteralType, oldName: StringLiteralType) {
          const record = { v, oldName };
          p.stateMap(renamedFromKey).set(t, record);
        },
        getAddedOn(p: Program, t: Type) {
          return p.stateMap(addedOnKey).get(t) || -1;
        },
        getRemovedOn(p: Program, t: Type) {
          return p.stateMap(removedOnKey).get(t) || Infinity;
        },
        getRenamedFromVersion(p: Program, t: Type) {
          return p.stateMap(renamedFromKey).get(t)?.v ?? -1;
        },
        getRenamedFromOldName(p: Program, t: Type) {
          return p.stateMap(renamedFromKey).get(t)?.oldName || "";
        },
      });

      testHost.addCadlFile(
        "main.cadl",
        `
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

        projection model#v {
          to(version) {
            if getAddedOn(self) > version {
              return never;
            } else {
              self.properties.forEach((p) => {
                if getAddedOn(p) > version {
                  self.deleteProperty(p.name);
                } else if getRemovedOn(p) <= version {
                  self.deleteProperty(p.name);
                } else if getRenamedFromVersion(p) > version {
                  self.renameProperty(p.name, getRenamedFromOldName(p));
                } else {
                  self.projectProperty(p.name, v, version);
                };
              });
            };
          }
        }`
      );

      const { Foo } = (await testHost.compile("main.cadl")) as { Foo: ModelType };
      const toVersion = Foo.projections[0].to!;

      let result = testHost.program.checker!.getProjectionInstructions(Foo, toVersion, [1]);
      strictEqual(result[0].op, "deleteProperty");
      strictEqual(result[1].op, "deleteProperty");
      strictEqual(result[2].op, "projectProperty");
      strictEqual(result[3].op, "renameProperty");

      result = testHost.program.checker!.getProjectionInstructions(Foo, toVersion, [2]);
      strictEqual(result[0].op, "deleteProperty");
      strictEqual(result[1].op, "deleteProperty");
    });
  });
});
