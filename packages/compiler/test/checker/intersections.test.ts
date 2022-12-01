import { ok, strictEqual } from "assert";
import { Model } from "../../core/index.js";
import {
  BasicTestRunner,
  createTestHost,
  createTestWrapper,
  expectDiagnostics,
  extractSquiggles,
} from "../../testing/index.js";

describe("compiler: intersections", () => {
  let runner: BasicTestRunner;

  beforeEach(async () => {
    const host = await createTestHost();
    runner = createTestWrapper(host);
  });

  it("intersect 2 models", async () => {
    const { Foo } = (await runner.compile(`
      @test model Foo {
        prop: {a: string} & {b: string};
      }
    `)) as { Foo: Model };

    const prop = Foo.properties.get("prop")!.type as Model;
    strictEqual(prop.kind, "Model");
    strictEqual(prop.properties.size, 2);
    ok(prop.properties.has("a"));
    ok(prop.properties.has("b"));
  });

  it("intersection type belong to namespace it is declared in", async () => {
    const { Foo } = (await runner.compile(`
      namespace A {
        model ModelA {name: string}
      }
      namespace B {
        model ModelB {age: int32}
      }
      namespace C {
        @test model Foo {
          prop: A.ModelA & B.ModelB;
        }
      }
    `)) as { Foo: Model };

    const prop = Foo.properties.get("prop")!.type as Model;
    strictEqual(prop.kind, "Model");
    ok(prop.namespace);
    strictEqual(prop.namespace.name, "C");
  });

  it("allow intersections of template params", async () => {
    const { Foo } = (await runner.compile(`
      model Bar<A, B> {
        prop: A & B;
      }
      @test model Foo {
        prop: Bar<{a: string}, {b: string}>;
      }
    `)) as { Foo: Model };

    const Bar = Foo.properties.get("prop")!.type as Model;
    const prop = Bar.properties.get("prop")!.type as Model;
    strictEqual(prop.kind, "Model");
    strictEqual(prop.properties.size, 2);
    ok(prop.properties.has("a"));
    ok(prop.properties.has("b"));
  });

  it("emit diagnostic if one of the intersected type is not a model", async () => {
    const { source, pos, end } = extractSquiggles(`
      @test model Foo {
        prop: {a: string} & ~~~"string literal"~~~
      }
    `);

    const diagnostics = await runner.diagnose(source);
    expectDiagnostics(diagnostics, {
      code: "intersect-non-model",
      message: "Cannot intersect non-model types (including union types).",
      pos,
      end,
    });
  });
});
