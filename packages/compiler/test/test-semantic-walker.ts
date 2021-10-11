import assert from "assert";
import {
  ModelType,
  ModelTypeProperty,
  NamespaceType,
  OperationType,
  UnionType,
} from "../core/index.js";
import { navigateProgram } from "../core/semantic-walker.js";
import { createTestHost, TestHost } from "./test-host.js";

describe("SemanticWalker", () => {
  let host: TestHost;

  beforeEach(async () => {
    host = await createTestHost();
  });

  async function runNavigator(cadl: string) {
    host.addCadlFile("main.adl", cadl);

    await host.compile("main.adl", { nostdlib: true });

    const result = {
      models: [] as ModelType[],
      modelProperties: [] as ModelTypeProperty[],
      namespaces: [] as NamespaceType[],
      operations: [] as OperationType[],
      unions: [] as UnionType[],
    };

    navigateProgram(host.program, {
      namespace: (x) => result.namespaces.push(x),
      operation: (x) => result.operations.push(x),
      model: (x) => result.models.push(x),
      modelProperty: (x) => result.modelProperties.push(x),
      union: (x) => result.unions.push(x),
    });

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

    assert.strictEqual(result.models.length, 3);
    assert.strictEqual(result.models[0].name, "Foo");
    assert.strictEqual(result.models[1].name, "", "Inline models don't have name");
    assert.strictEqual(result.models[2].name, "Bar");
  });

  it("finds operations", async () => {
    const result = await runNavigator(`
      op foo(): true;

      namespace Nested {
        op bar(): true;
      }
    `);

    assert.strictEqual(result.operations.length, 2);
    assert.strictEqual(result.operations[0].name, "foo");
    assert.strictEqual(result.operations[1].name, "bar");
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

    assert.deepStrictEqual(
      result.namespaces.map((x) => host.program.checker!.getNamespaceString(x)),
      ["", "Global", "Global.My", "Global.My.Simple", "Global.My.Parent", "Global.My.Parent.Child"]
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

    assert.strictEqual(result.modelProperties.length, 3);
    assert.strictEqual(result.modelProperties[0].name, "nested");
    assert.strictEqual(result.modelProperties[1].name, "inline");
    assert.strictEqual(result.modelProperties[2].name, "name");
  });

  it("finds unions", async () => {
    const result = await runNavigator(`
      union A {
        x: true;
      }
    `);

    assert.strictEqual(result.unions.length, 1);
    assert.strictEqual(result.unions[0].name!, "A");
  });
});
