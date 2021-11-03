import { ok, strictEqual } from "assert";
import { Program } from "../../core/program.js";
import { ModelType, NumericLiteralType, Type } from "../../core/types.js";
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
    let result = Foo.project(Foo, Foo.projections[0].to!, [1]) as ModelType;
    strictEqual(result.properties.size, 1);

    let result2 = Foo.project(Foo, Foo.projections[0].to!, [2]) as ModelType;
    console.log(result2.properties);
    strictEqual(result2.properties.size, 2);
  });

  it.only("works for versioning", async () => {
    const addedOnKey = Symbol();
    const removedOnKey = Symbol();

    testHost.addJsFile("versioning.js", {
      $added(p: Program, t: Type, v: NumericLiteralType) {
        p.stateMap(addedOnKey).set(t, v);
      },
      $removed(p: Program, t: Type, v: NumericLiteralType) {
        p.stateMap(removedOnKey).set(t, v);
      },
      getAddedOn(p: Program, t: Type) {
        return p.stateMap(addedOnKey).get(t) || -1;
      },
      getRemovedOn(p: Program, t: Type) {
        return p.stateMap(removedOnKey).get(t) || Infinity;
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
          });
        }
      }
    `
    );

    const { Foo } = (await testHost.compile("main.cadl")) as { Foo: ModelType };

    let result = Foo.project(Foo, Foo.projections[0].to!, [1]) as ModelType;
    strictEqual(result.properties.size, 2);
    console.log("Projected v1 keys:", Array.from(result.properties.keys()));
    let resultBack = Foo.project(result, Foo.projections[0].from!, [1]) as ModelType;
    console.log("Projected back:", Array.from(resultBack.properties.keys()));

    let result2 = Foo.project(Foo, Foo.projections[0].to!, [2]) as ModelType;
    console.log("Projected v2 keys:", Array.from(result2.properties.keys()));
    strictEqual(result2.properties.size, 2);
    let resultBack2 = Foo.project(result2, Foo.projections[0].from!, [2]) as ModelType;
    console.log("Projected back:", Array.from(resultBack2.properties.keys()));
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
    return Foo.project(Foo, Foo.projections[0].to!) as ModelType;
  }
});
