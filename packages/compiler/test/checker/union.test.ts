import { ok, strictEqual } from "assert";
import { beforeEach, describe, it } from "vitest";
import { Model, Union, UnionVariant } from "../../src/core/types.js";
import { TestHost, createTestHost, expectTypeEquals, t } from "../../src/testing/index.js";
import { Tester } from "../tester.js";

describe("declarations", () => {
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
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      import "./test.js";
      @test @blue union Foo { @blue x: int32; y: int16 };
      `,
    );

    const { Foo } = (await testHost.compile("./")) as { Foo: Union };
    ok(Foo);
    ok(blues.has(Foo));
    strictEqual(Foo.variants.size, 2);
    const varX = Foo.variants.get("x")!;
    ok(blues.has(varX));
    const varY = Foo.variants.get("y")!;
    const varXType = (varX as UnionVariant).type;
    const varYType = (varY as UnionVariant).type;

    strictEqual(varX.kind, "UnionVariant");
    strictEqual(varY.kind, "UnionVariant");

    strictEqual(varXType.kind, "Scalar");
    strictEqual(varYType.kind, "Scalar");
  });

  it("can omit union variant names", async () => {
    const blues = new WeakSet();
    testHost.addJsFile("test.js", {
      $blue(p: any, t: Union | UnionVariant) {
        blues.add(t);
      },
    });
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      import "./test.js";
      @test union Foo<T> { 
        @blue x: int32;
        @blue int16;
        @blue T;
      };

      alias T = Foo<string>;
      `,
    );

    const { Foo } = (await testHost.compile("./")) as { Foo: Union };
    const variants = Array.from(Foo.variants.values());
    ok(blues.has(variants[0]));
    ok(blues.has(variants[1]));
    ok(blues.has(variants[2]));

    strictEqual(variants[0].name, "x");
    ok(typeof variants[1].name === "symbol");
    ok(typeof variants[2].name === "symbol");
  });

  it("can be templated", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      @test union Foo<T> { x: T };
      alias T = Foo<int32>;
      `,
    );

    const { Foo } = (await testHost.compile("./")) as { Foo: Union };

    const varX = Foo.variants.get("x")!;
    const varXType = (varX as UnionVariant).type as Model;

    strictEqual(varX.kind, "UnionVariant");
    strictEqual(varXType.kind, "Scalar");
    strictEqual(varXType.name, "int32");
  });
});

describe("expressions", () => {
  it("reduces union expressions and gives them symbol keys", async () => {
    const { Foo } = await Tester.compile(t.code`
      alias Temp<T, U> = T | U;
      alias ${t.union("Foo")} = Temp<int16 | int32, string | int8>;
    `);

    strictEqual(Foo.variants.size, 4);
    for (const key of Foo.variants.keys()) {
      strictEqual(typeof key, "symbol");
    }
  });

  it("doesn't reduce union statements", async () => {
    const { Foo } = await Tester.compile(t.code`
      alias Temp<T, U> = T | U;
      union Bar { x: int16, y: int32 };
      alias ${t.union("Foo")} = Temp<Bar, string | int8>;
    `);
    strictEqual(Foo.variants.size, 3);
    for (const key of Foo.variants.keys()) {
      strictEqual(typeof key, "symbol");
    }
  });

  it("reduces nevers", async () => {
    const { Foo } = await Tester.compile(t.code`
      alias ${t.union("Foo")} = string | never;  
    `);
    strictEqual(Foo.variants.size, 1);
  });

  it("set namespace", async () => {
    const { Foo, MyNs } = await Tester.compile(t.code`
      namespace ${t.namespace("MyNs")};
      alias ${t.union("Foo")} = string | int32;  
    `);
    expectTypeEquals(Foo.namespace, MyNs);
  });
});
