import assert, { strictEqual } from "assert";
import { beforeEach, describe, it } from "vitest";
import { Model, Type } from "../../src/core/types.js";
import { TestHost, createTestHost } from "../../src/testing/index.js";

function assertModel(type?: Type): asserts type is Model {
  assert(type?.kind === "Model");
}

describe("compiler: model circular references", () => {
  let testHost: TestHost;

  beforeEach(async () => {
    testHost = await createTestHost();
  });

  it("model can reference itself", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `@test model M {
        self: M;
      }
      `,
    );
    const records = await testHost.compile("./");

    const m = records["M"];
    assertModel(m);
    assert(m.properties.get("self")?.type === m);
  });

  it("model can reference itself in an array", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `@test model M {
        selfs: M[];
      }
      `,
    );
    const records = await testHost.compile("./");

    const m = records["M"];
    assertModel(m);
    const propType = m.properties.get("selfs")!.type;
    assertModel(propType);
    assert(propType.indexer!.value === m);
  });

  it("models can reference each other", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      @test model Parent {
        child: Child;
      }

      @test model Child {
        parent: Parent;
      }
      `,
    );
    const records = await testHost.compile("./");

    const parent = records["Parent"];
    const child = records["Child"];
    assertModel(parent);
    assertModel(child);
    assert(parent.properties.get("child")?.type === child);
    assert(child.properties.get("parent")?.type === parent);
  });

  it("template model can reference itself", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      @test model Templated<T> {
        value: T;
        parent?: Templated<T>;
        parents: Templated<T>[];
      }

      op test(): Templated<string>;
      `,
    );
    const records = await testHost.compile("./");
    const model = records["Templated"];
    assertModel(model);
    const parentType = model.properties.get("parent")?.type;
    assertModel(parentType);
    strictEqual(parentType, model);
  });

  it("template model can reference each other", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      @test model A<T> {
        value: T;
        b?: B<T>;
      }
      @test model B<T> {
        value: T;
        a?: A<T>;
      }

      op test(): A<string>;
      `,
    );
    const records = await testHost.compile("./");
    const model = records["A"];
    assertModel(model);
    const bType = model.properties.get("b")?.type;
    assertModel(bType);
    const aTypeViaB = bType.properties.get("a")?.type;
    assertModel(aTypeViaB);

    strictEqual(model, aTypeViaB);
  });

  it("models can reference each other in different namespace with the same name", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      namespace Foo {
        namespace Nested {
          @test model Some {
            self: Some;
            related: Bar.Nested.Some;
          }
        }
      }

      namespace Bar {
        namespace Nested {
          model Some {
            self: Some;
            related: Foo.Nested.Some;
          }
        }
      }
      `,
    );

    const records = await testHost.compile("./");

    const fooSome = records["Some"];
    assertModel(fooSome);
    assert(fooSome.properties.get("self")?.type === fooSome);

    const barSome = fooSome.properties.get("related")!.type;
    assertModel(barSome);
    assert(barSome !== fooSome);
    assert(barSome.properties.get("self")?.type === barSome);
    assert(barSome.properties.get("related")?.type === fooSome);
  });
});
