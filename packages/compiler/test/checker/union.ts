import { ok, strictEqual } from "assert";
import { ModelType, UnionType, UnionTypeVariant } from "../../core/types.js";
import { createTestHost, TestHost } from "../test-host.js";

describe("cadl: union declarations", () => {
  let testHost: TestHost;

  beforeEach(async () => {
    testHost = await createTestHost();
  });

  it("can be declared and decorated", async () => {
    let blues = new WeakSet();
    testHost.addJsFile("test.js", {
      $blue(p: any, t: UnionType | UnionTypeVariant) {
        console.log("WTF?");
        blues.add(t);
      },
    });
    testHost.addCadlFile(
      "main.cadl",
      `
      import "./test.js";
      @test @blue union Foo { @blue x: int32; y: int16 };
      `
    );

    const { Foo } = (await testHost.compile("./")) as { Foo: UnionType };
    ok(Foo);
    ok(blues.has(Foo));
    strictEqual(Foo.options.length, 2);
    const varX = Foo.variants.get("x")!;
    ok(blues.has(varX));
    const varY = Foo.variants.get("y")!;
    const varXType = (varX as UnionTypeVariant).type;
    const varYType = (varY as UnionTypeVariant).type;

    strictEqual(varX.kind, "UnionVariant");
    strictEqual(varY.kind, "UnionVariant");

    strictEqual(varXType.kind, "Model");
    strictEqual(varYType.kind, "Model");
  });

  it("can be templated", async () => {
    testHost.addCadlFile(
      "main.cadl",
      `
      @test union Foo<T> { x: T };
      alias T = Foo<int32>;
      `
    );

    const { Foo } = (await testHost.compile("./")) as { Foo: UnionType };

    const varX = Foo.variants.get("x")!;
    const varXType = (varX as UnionTypeVariant).type as ModelType;

    strictEqual(varX.kind, "UnionVariant");
    strictEqual(varXType.kind, "Model");
    strictEqual(varXType.name, "int32");
  });

  it("reduces union expressions and gives them symbol keys", async () => {
    testHost.addCadlFile(
      "main.cadl",
      `
      @test model Foo<T, U> { x: T | U };
      alias T = Foo<int16 | int32, string | int8>;
      `
    );

    const { Foo } = (await testHost.compile("./")) as { Foo: ModelType };
    const type = Foo.properties.get("x")!.type as UnionType;
    strictEqual(type.options.length, 4);
    for (const key of type.variants.keys()) {
      strictEqual(typeof key, "symbol");
    }
  });

  it("doesn't reduce union statements", async () => {
    testHost.addCadlFile(
      "main.cadl",
      `
      @test model Foo<T, U> { x: T | U };
      union Bar { x: int16, y: int32 };
      alias T = Foo<Bar, string | int8>;
      `
    );

    const { Foo } = (await testHost.compile("./")) as { Foo: ModelType };
    const type = Foo.properties.get("x")!.type as UnionType;
    strictEqual(type.options.length, 3);
    for (const key of type.variants.keys()) {
      strictEqual(typeof key, "symbol");
    }
  });
});
