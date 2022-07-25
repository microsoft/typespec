import assert from "assert";
import { ModelType, Type } from "../../core/types.js";
import { createTestHost, TestHost } from "../../testing/index.js";

function assertModel(type?: Type): asserts type is ModelType {
  assert(type?.kind === "Model");
}

describe("compiler: model circular references", () => {
  let testHost: TestHost;

  beforeEach(async () => {
    testHost = await createTestHost();
  });

  it("model can reference itself", async () => {
    testHost.addCadlFile(
      "main.cadl",
      `@test model M {
        self: M;
      }
      `
    );
    const records = await testHost.compile("./");

    const m = records["M"];
    assertModel(m);
    assert(m.properties.get("self")?.type === m);
  });

  it("model can reference itself in an array", async () => {
    testHost.addCadlFile(
      "main.cadl",
      `@test model M {
        selfs: M[];
      }
      `
    );
    const records = await testHost.compile("./");

    const m = records["M"];
    assertModel(m);
    const propType = m.properties.get("selfs")!.type;
    assertModel(propType);
    assert(propType.indexer!.value === m);
  });

  it("models can reference each other", async () => {
    testHost.addCadlFile(
      "main.cadl",
      `
      @test model Parent {
        child: Child;
      }

      @test model Child {
        parent: Parent;
      }
      `
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
    testHost.addCadlFile(
      "main.cadl",
      `
      @test model Templated<T> {
        value: T;
        parent?: Templated<T>;
        parents: Templated<T>[];
      }

      op test(): Templated<string>;
      `
    );
    const records = await testHost.compile("./");
    const model = records["Templated"];
    assertModel(model);
    const parentType = model.properties.get("parent")?.type;
    assertModel(parentType);
    assert(parentType.templateNode === model.node);
  });

  it("models can reference each other in different namespace with the same name", async () => {
    testHost.addCadlFile(
      "main.cadl",
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
      `
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
