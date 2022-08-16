import { ok, strictEqual } from "assert";
import { Model, Union, UnionVariant } from "../../core/types.js";
import { createTestHost, TestHost } from "../../testing/index.js";

describe("compiler: union declarations", () => {
  let testHost: TestHost;

  beforeEach(async () => {
    testHost = await createTestHost();
  });

  it("can be declared and decorated", async () => {
    const blues = new WeakSet();
    testHost.addJsFile("test.js", {
      $blue(p: any, t: Union | UnionVariant) {
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

    const { Foo } = (await testHost.compile("./")) as { Foo: Union };
    ok(Foo);
    ok(blues.has(Foo));
    strictEqual(Foo.options.length, 2);
    const varX = Foo.variants.get("x")!;
    ok(blues.has(varX));
    const varY = Foo.variants.get("y")!;
    const varXType = (varX as UnionVariant).type;
    const varYType = (varY as UnionVariant).type;

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

    const { Foo } = (await testHost.compile("./")) as { Foo: Union };

    const varX = Foo.variants.get("x")!;
    const varXType = (varX as UnionVariant).type as Model;

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

    const { Foo } = (await testHost.compile("./")) as { Foo: Model };
    const type = Foo.properties.get("x")!.type as Union;
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

    const { Foo } = (await testHost.compile("./")) as { Foo: Model };
    const type = Foo.properties.get("x")!.type as Union;
    strictEqual(type.options.length, 3);
    for (const key of type.variants.keys()) {
      strictEqual(typeof key, "symbol");
    }
  });

  it("reduces nevers", async () => {
    testHost.addCadlFile(
      "main.cadl",
      `
      @test model Foo { x: int32 | never };
      `
    );

    const { Foo } = (await testHost.compile("./")) as { Foo: Model };
    const type = Foo.properties.get("x")!.type as Union;
    strictEqual(type.options.length, 1);
  });
});
