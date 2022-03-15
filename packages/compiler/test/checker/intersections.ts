import { ok, strictEqual } from "assert";
import { ModelType } from "../../core/index.js";
import {
  BasicTestRunner,
  createTestHost,
  createTestWrapper,
  expectDiagnostics,
} from "../../testing/index.js";

describe.only("compiler: intersections", () => {
  let runner: BasicTestRunner;

  beforeEach(async () => {
    const host = await createTestHost();
    runner = createTestWrapper(host, (code) => code);
  });

  it("intersect 2 models", async () => {
    const { Foo } = (await runner.compile(`
      @test model Foo {
        prop: {a: string} & {b: string};
      }
    `)) as { Foo: ModelType };

    const prop = Foo.properties.get("prop")!.type as ModelType;
    strictEqual(prop.kind, "Model");
    strictEqual(prop.properties.size, 2);
    ok(prop.properties.has("a"));
    ok(prop.properties.has("b"));
  });

  it("allow intersections of template params", async () => {
    const { Foo } = (await runner.compile(`
      model Bar<A, B> {
        prop: A & B;
      }
      @test model Foo {
        prop: Bar<{a: string}, {b: string}>;
      }
    `)) as { Foo: ModelType };

    const Bar = Foo.properties.get("prop")!.type as ModelType;
    const prop = Bar.properties.get("prop")!.type as ModelType;
    strictEqual(prop.kind, "Model");
    strictEqual(prop.properties.size, 2);
    ok(prop.properties.has("a"));
    ok(prop.properties.has("b"));
  });

  it("emit diagnostic if one of the intersected type is not a model", async () => {
    const diagnostics = await runner.diagnose(`
      @test model Foo {
        prop: {a: string} & "string literal";
      }
    `);

    expectDiagnostics(diagnostics, {
      code: "intersect-non-model",
      message: "Cannot intersect non-model types (including union types).",
    });
  });
});
