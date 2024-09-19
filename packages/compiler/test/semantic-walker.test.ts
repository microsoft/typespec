import { deepStrictEqual, ok, strictEqual } from "assert";
import { beforeEach, describe, it } from "vitest";
import {
  Interface,
  ListenerFlow,
  Model,
  ModelProperty,
  Namespace,
  Operation,
  SemanticNodeListener,
  Union,
  UnionVariant,
  getNamespaceFullName,
} from "../src/core/index.js";
import {
  getProperty,
  navigateProgram,
  navigateTypesInNamespace,
} from "../src/core/semantic-walker.js";
import { TestHost, createTestHost } from "../src/testing/index.js";

describe("compiler: semantic walker", () => {
  let host: TestHost;

  beforeEach(async () => {
    host = await createTestHost();
  });

  function createCollector(customListener?: SemanticNodeListener) {
    const result = {
      models: [] as Model[],
      exitModels: [] as Model[],
      modelProperties: [] as ModelProperty[],
      exitModelProperties: [] as ModelProperty[],
      namespaces: [] as Namespace[],
      operations: [] as Operation[],
      exitOperations: [] as Operation[],
      interfaces: [] as Interface[],
      unions: [] as Union[],
      unionVariants: [] as UnionVariant[],
    };

    const listener: SemanticNodeListener = {
      namespace: (x) => {
        result.namespaces.push(x);
        return customListener?.namespace?.(x);
      },
      operation: (x) => {
        result.operations.push(x);
        return customListener?.operation?.(x);
      },
      exitOperation: (x) => {
        result.exitOperations.push(x);
        return customListener?.exitOperation?.(x);
      },
      model: (x) => {
        result.models.push(x);
        return customListener?.model?.(x);
      },
      exitModel: (x) => {
        result.exitModels.push(x);
        return customListener?.exitModel?.(x);
      },
      modelProperty: (x) => {
        result.modelProperties.push(x);
        return customListener?.modelProperty?.(x);
      },
      exitModelProperty: (x) => {
        result.exitModelProperties.push(x);
        return customListener?.exitModelProperty?.(x);
      },
      union: (x) => {
        result.unions.push(x);
        return customListener?.union?.(x);
      },
      interface: (x) => {
        result.interfaces.push(x);
        return customListener?.interface?.(x);
      },
      unionVariant: (x) => {
        result.unionVariants.push(x);
        return customListener?.unionVariant?.(x);
      },
    };
    return [result, listener] as const;
  }

  async function runNavigator(typespec: string, customListener?: SemanticNodeListener) {
    host.addTypeSpecFile("main.tsp", typespec);

    await host.compile("main.tsp", { nostdlib: true });

    const [result, listener] = createCollector(customListener);
    navigateProgram(host.program, listener);

    return result;
  }

  it("finds models", async () => {
    const result = await runNavigator(`
      model Foo {
        nested: {
          inline: true
        }
      }

      model Bar {
        name: Foo;
      }
    `);

    strictEqual(result.models.length, 3);
    strictEqual(result.models[0].name, "Foo");
    strictEqual(result.models[1].name, "", "Inline models don't have name");
    strictEqual(result.models[2].name, "Bar");
  });

  it("finds exit models", async () => {
    const result = await runNavigator(`
      model Foo {
        nested: {
          inline: true
        }
      }

      model Bar {
        name: Foo;
      }
    `);

    strictEqual(result.exitModels.length, 3);
    strictEqual(result.exitModels[0].name, "", "Inline models don't have name");
    strictEqual(result.exitModels[1].name, "Foo");
    strictEqual(result.exitModels[2].name, "Bar");
  });

  it("finds operations", async () => {
    const result = await runNavigator(`
      op foo(): true;

      namespace Nested {
        op bar(): true;
      }
    `);

    strictEqual(result.operations.length, 2);
    strictEqual(result.operations[0].name, "foo");
    strictEqual(result.operations[1].name, "bar");
  });

  it("finds exit operations", async () => {
    const result = await runNavigator(`
      op foo(): true;

      namespace Nested {
        op bar(): true;
      }
    `);

    strictEqual(result.exitOperations.length, 2);
    strictEqual(result.exitOperations[0].name, "foo");
    strictEqual(result.exitOperations[1].name, "bar");
  });

  it("finds namespaces", async () => {
    const result = await runNavigator(`
      namespace Global.My;
      namespace Simple {
      }
      namespace Parent {
        namespace Child {
        }
      }
    `);

    deepStrictEqual(
      result.namespaces.map((x) => getNamespaceFullName(x)),
      [
        "",
        "TypeSpec",
        "Global",
        "Global.My",
        "Global.My.Simple",
        "Global.My.Parent",
        "Global.My.Parent.Child",
      ],
    );
  });

  it("finds model properties", async () => {
    const result = await runNavigator(`
      model Foo {
        nested: {
          inline: true
        }
      }

      model Bar {
        name: Foo;
      }
    `);

    strictEqual(result.modelProperties.length, 3);
    strictEqual(result.modelProperties[0].name, "nested");
    strictEqual(result.modelProperties[1].name, "inline");
    strictEqual(result.modelProperties[2].name, "name");
  });

  it("finds exit model properties", async () => {
    const result = await runNavigator(`
      model Foo {
        nested: {
          inline: true
        }
      }

      model Bar {
        name: Foo;
      }
    `);

    strictEqual(result.exitModelProperties.length, 3);
    strictEqual(result.exitModelProperties[0].name, "inline");
    strictEqual(result.exitModelProperties[1].name, "nested");
    strictEqual(result.exitModelProperties[2].name, "name");
  });

  it("finds unions", async () => {
    const result = await runNavigator(`
      union A {
        x: true;
      }
    `);

    strictEqual(result.unions.length, 1);
    strictEqual(result.unions[0].name!, "A");
    strictEqual(result.unionVariants.length, 1);
    strictEqual(result.unionVariants[0].name!, "x");
  });

  it("finds interfaces", async () => {
    const result = await runNavigator(`
      model B { };
      interface A {
        a(): true;
      }
    `);

    strictEqual(result.interfaces.length, 1, "finds interfaces");
    strictEqual(result.interfaces[0].name, "A");
    strictEqual(result.operations.length, 1, "finds operations");
    strictEqual(result.operations[0].name, "a");
  });

  it("finds owned or inherited properties", async () => {
    const result = await runNavigator(`
      model Pet {
        name: true;
      }

      model Cat extends Pet {
        meow: true;
      }
    `);

    strictEqual(result.models.length, 2);
    strictEqual(result.models[0].name, "Pet");
    strictEqual(result.models[1].name, "Cat");
    ok(getProperty(result.models[1], "meow"));
    ok(getProperty(result.models[1], "name"));
    strictEqual(getProperty(result.models[1], "bark"), undefined);
  });

  it("stop navigation of children when returning NoRecursion from callback", async () => {
    const result = await runNavigator(
      `
      model A {
        shouldNotNavigate: true;
      }

      model B {
        shouldNavigate: true;
      }
    `,
      { model: (x) => (x.name === "A" ? ListenerFlow.NoRecursion : undefined) },
    );

    strictEqual(result.modelProperties.length, 1);
    strictEqual(result.modelProperties[0].name, "shouldNavigate");
  });

  describe("findInNamespace", () => {
    async function runFindInNamespace(code: string) {
      host.addTypeSpecFile("main.tsp", code);
      await host.compile("main.tsp", { nostdlib: true });

      const TargetNs = host.program.getGlobalNamespaceType().namespaces.get("TargetNs");
      ok(TargetNs, "Should have a namespace called TargetNs");
      const [result, listener] = createCollector();
      navigateTypesInNamespace(TargetNs, listener);

      return result;
    }

    it("find models only in given namespace", async () => {
      const results = await runFindInNamespace(`
        namespace TargetNs {
          model A {}
        }

        model B {}

        namespace Other {
          model C {}
        }
      `);
      strictEqual(results.models.length, 1);
      strictEqual(results.models[0].name, "A");
    });

    it("find models in sub namespace", async () => {
      const results = await runFindInNamespace(`
        namespace TargetNs {
          model A {}

          namespace Sub {
            model B {}
          }
        }
      `);
      strictEqual(results.models.length, 2);
      strictEqual(results.models[0].name, "A");
      strictEqual(results.models[1].name, "B");
    });
  });
});
