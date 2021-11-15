import { ok, strictEqual } from "assert";
import { Program } from "../../core/program.js";
import { ModelType, NumericLiteralType, StringLiteralType, Type } from "../../core/types.js";
import { createTestHost, TestHost } from "../test-host.js";

describe.only("cadl: projections", () => {
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

      @versions(1 | 2 | 3)
      namespace My.Service;

      @test model Foo {
        a: int32;
        @added(2) b: int16;
        @added(3) c: string;
        @removed(2) d: string;
        @renamedFrom(2, "oldName") newName: string;
      }

      projection model#v {
        to(version) {
          self.properties.forEach((p) => {
            if getAddedOn(p) > version {
              self.deleteProperty(p.name);
            };

            if getRemovedOn(p) <= version {
              self.deleteProperty(p.name);
            };

            if getRenamedFromVersion(p) > version {
              self.renameProperty(p.name, getRenamedFromOldName(p));
            };
          });
        }
        from(version) {
          Foo.properties.forEach((p) => {
            if getAddedOn(p) > version {
              self.addProperty(p.name, p.type);
            };

            if getRemovedOn(p) <= version {
              self.addProperty(p.name, p.type);
            };

            if getRenamedFromVersion(p) > version {
              self.renameProperty(getRenamedFromOldName(p), p.name);
            };
          });
        }
      }
    `
    );

    const { Foo } = (await testHost.compile("main.cadl")) as { Foo: ModelType };
    const toVersion = Foo.projections[0].to!;
    const fromVersion = Foo.projections[0].from!;

    let result = testHost.program.checker!.project(Foo, toVersion, [1]) as ModelType;
    strictEqual(result.properties.size, 3);

    let result2 = testHost.program.checker!.project(Foo, toVersion, [2]) as ModelType;
    strictEqual(result2.properties.size, 3);
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

  it.only("can replace itself", async () => {
    testHost.addCadlFile(
      "main.cadl",
      `
      @test model Foo {
        prop: string;
      }
      
      projection model#deleted {
        to {
          return;
        }
        from {
          return model;
        }
      }
      `
    );
    const { Foo } = (await testHost.compile("main.cadl")) as { Foo: ModelType };
    let result = testHost.program.checker!.project(Foo, Foo.projections[0].to!, [1]) as ModelType;
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

        projection Foo#toCamelCase {
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
