import assert, { strictEqual } from "assert";
import { describe, it } from "vitest";
import { Model, Type } from "../../src/core/types.js";
import { t } from "../../src/testing/index.js";
import { Tester } from "../tester.js";

function assertModel(type?: Type): asserts type is Model {
  assert(type?.kind === "Model");
}

describe("compiler: model circular references", () => {
  it("model can reference itself", async () => {
    const { M } = await Tester.compile(t.code`model ${t.model("M")} {
        self: M;
      }
      `);

    assertModel(M);
    assert(M.properties.get("self")?.type === M);
  });

  it("model can reference itself in an array", async () => {
    const { M } = await Tester.compile(t.code`model ${t.model("M")} {
        selfs: M[];
      }
      `);

    assertModel(M);
    const propType = M.properties.get("selfs")!.type;
    assertModel(propType);
    assert(propType.indexer!.value === M);
  });

  it("models can reference each other", async () => {
    const { Parent, Child } = await Tester.compile(t.code`
      model ${t.model("Parent")} {
        child: Child;
      }

      model ${t.model("Child")} {
        parent: Parent;
      }
      `);

    assertModel(Parent);
    assertModel(Child);
    assert(Parent.properties.get("child")?.type === Child);
    assert(Child.properties.get("parent")?.type === Parent);
  });

  it("template model can reference itself", async () => {
    const { test } = await Tester.compile(t.code`
      model Templated<T> {
        value: T;
        parent?: Templated<T>;
        parents: Templated<T>[];
      }

      op ${t.op("test")}(): Templated<string>;
      `);

    const Templated = test.returnType;
    assertModel(Templated);
    const parentType = Templated.properties.get("parent")?.type;
    assertModel(parentType);
    strictEqual(parentType, Templated);
  });

  it("template model can reference each other", async () => {
    const { test } = await Tester.compile(t.code`
      model A<T> {
        value: T;
        b?: B<T>;
      }
      model B<T> {
        value: T;
        a?: A<T>;
      }

      op ${t.op("test")}(): A<string>;
      `);

    const A = test.returnType;
    assertModel(A);
    const bType = A.properties.get("b")?.type;
    assertModel(bType);
    const aTypeViaB = bType.properties.get("a")?.type;
    assertModel(aTypeViaB);

    strictEqual(A, aTypeViaB);
  });

  it("models can reference each other in different namespace with the same name", async () => {
    const { Some: fooSome } = await Tester.compile(t.code`
      namespace Foo {
        namespace Nested {
          model ${t.model("Some")} {
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
      `);

    assertModel(fooSome);
    assert(fooSome.properties.get("self")?.type === fooSome);

    const barSome = fooSome.properties.get("related")!.type;
    assertModel(barSome);
    assert(barSome !== fooSome);
    assert(barSome.properties.get("self")?.type === barSome);
    assert(barSome.properties.get("related")?.type === fooSome);
  });
});
