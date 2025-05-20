import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { Model, ModelProperty, Program, Scalar, Union } from "../../src/index.js";
import { createTestRunner } from "../../src/testing/test-host.js";
import { BasicTestRunner } from "../../src/testing/types.js";
import { $ } from "../../src/typekit/index.js";
import { createContextMock } from "./utils.js";

let program: Program;
beforeAll(async () => {
  // need the side effect of creating the program.
  const context = await createContextMock();
  program = context.program;
});

it("can get the builtin string type", async () => {
  const stringType = $(program).builtin.string;
  expect(stringType).toBeDefined();
  expect(stringType.name).toBe("string");
});

it("can get the builtin boolean type", async () => {
  const booleanType = $(program).builtin.boolean;
  expect(booleanType).toBeDefined();
  expect(booleanType.name).toBe("boolean");
});

it("can get the builtin numeric type", async () => {
  const numericType = $(program).builtin.numeric;
  expect(numericType).toBeDefined();
  expect(numericType.name).toBe("numeric");
});

it("can get the builtin int32 type", async () => {
  const int32Type = $(program).builtin.int32;
  expect(int32Type).toBeDefined();
  expect(int32Type.name).toBe("int32");
});

it("can get the builtin int64 type", async () => {
  const int64Type = $(program).builtin.int64;
  expect(int64Type).toBeDefined();
  expect(int64Type.name).toBe("int64");
});

it("can get the builtin float32 type", async () => {
  const float32Type = $(program).builtin.float32;
  expect(float32Type).toBeDefined();
  expect(float32Type.name).toBe("float32");
});

it("can get the builtin float64 type", async () => {
  const float64Type = $(program).builtin.float64;
  expect(float64Type).toBeDefined();
  expect(float64Type.name).toBe("float64");
});

it("can get the builtin bytes type", async () => {
  const bytesType = $(program).builtin.bytes;
  expect(bytesType).toBeDefined();
  expect(bytesType.name).toBe("bytes");
});

it("can get the builtin decimal type", async () => {
  const decimalType = $(program).builtin.decimal;
  expect(decimalType).toBeDefined();
  expect(decimalType.name).toBe("decimal");
});

it("can get the builtin decimal128 type", async () => {
  const decimal128Type = $(program).builtin.decimal128;
  expect(decimal128Type).toBeDefined();
  expect(decimal128Type.name).toBe("decimal128");
});

it("can get the builtin duration type", async () => {
  const durationType = $(program).builtin.duration;
  expect(durationType).toBeDefined();
  expect(durationType.name).toBe("duration");
});

it("can get the builtin float type", async () => {
  const floatType = $(program).builtin.float;
  expect(floatType).toBeDefined();
  expect(floatType.name).toBe("float");
});

it("can get the builtin int8 type", async () => {
  const int8Type = $(program).builtin.int8;
  expect(int8Type).toBeDefined();
  expect(int8Type.name).toBe("int8");
});

it("can get the builtin int16 type", async () => {
  const int16Type = $(program).builtin.int16;
  expect(int16Type).toBeDefined();
  expect(int16Type.name).toBe("int16");
});

it("can get the builtin integer type", async () => {
  const integerType = $(program).builtin.integer;
  expect(integerType).toBeDefined();
  expect(integerType.name).toBe("integer");
});

it("can get the builtin offsetDateTime type", async () => {
  const offsetDateTimeType = $(program).builtin.offsetDateTime;
  expect(offsetDateTimeType).toBeDefined();
  expect(offsetDateTimeType.name).toBe("offsetDateTime");
});

it("can get the builtin plainDate type", async () => {
  const plainDateType = $(program).builtin.plainDate;
  expect(plainDateType).toBeDefined();
  expect(plainDateType.name).toBe("plainDate");
});

it("can get the builtin plainTime type", async () => {
  const plainTimeType = $(program).builtin.plainTime;
  expect(plainTimeType).toBeDefined();
  expect(plainTimeType.name).toBe("plainTime");
});

it("can get the builtin safeInt type", async () => {
  const safeIntType = $(program).builtin.safeInt;
  expect(safeIntType).toBeDefined();
  expect(safeIntType.name).toBe("safeint");
});

it("can get the builtin uint8 type", async () => {
  const uint8Type = $(program).builtin.uint8;
  expect(uint8Type).toBeDefined();
  expect(uint8Type.name).toBe("uint8");
});

it("can get the builtin uint16 type", async () => {
  const uint16Type = $(program).builtin.uint16;
  expect(uint16Type).toBeDefined();
  expect(uint16Type.name).toBe("uint16");
});

it("can get the builtin uint32 type", async () => {
  const uint32Type = $(program).builtin.uint32;
  expect(uint32Type).toBeDefined();
  expect(uint32Type.name).toBe("uint32");
});

it("can get the builtin uint64 type", async () => {
  const uint64Type = $(program).builtin.uint64;
  expect(uint64Type).toBeDefined();
  expect(uint64Type.name).toBe("uint64");
});

it("can get the builtin url type", async () => {
  const urlType = $(program).builtin.url;
  expect(urlType).toBeDefined();
  expect(urlType.name).toBe("url");
});

it("can get the builtin utcDateTime type", async () => {
  const utcDateTimeType = $(program).builtin.utcDateTime;
  expect(utcDateTimeType).toBeDefined();
  expect(utcDateTimeType.name).toBe("utcDateTime");
});

describe("builtin.is() tests", () => {
  let runner: BasicTestRunner;

  beforeEach(async () => {
    runner = await createTestRunner();
  });

  it("simple model with a string property", async () => {
    // ------------------------------------------------------------
    //   - Foo (Model)                     → false
    //   - Foo.bar (ModelProperty)         → false
    //   - type of Foo.bar (intrinsic)     → true
    // ------------------------------------------------------------
    const { Foo, bar } = (await runner.compile(
      `
      @test model Foo {
        @test bar: string;
      }
    `,
    )) as { Foo: Model; bar: ModelProperty };

    program = runner.program;
    const _$ = $(program);

    expect(_$.builtin.is(Foo)).toBe(false);
    expect(_$.builtin.is(bar)).toBe(false);
    expect(_$.builtin.is(bar.type)).toBe(true);
  });

  it("model property is a union of string | int32", async () => {
    // ------------------------------------------------------------
    //   - Foo (Model)                             → false
    //   - Foo.bar (ModelProperty)                 → false
    //   - Foo.bar.type (Union)                    → false
    //   - each variant (UnionVariant)             → false
    //   - variant.type (intrinsic)                → true
    // ------------------------------------------------------------
    const { Foo, bar } = (await runner.compile(
      `
      @test model Foo {
        @test bar: string | int32;
      }
    `,
    )) as { Foo: Model; bar: ModelProperty };

    program = runner.program;
    const _$ = $(program);

    expect(_$.builtin.is(Foo)).toBe(false);
    expect(_$.builtin.is(bar)).toBe(false);
    expect(_$.builtin.is(bar.type)).toBe(false);
    const [variant1, variant2] = [...(bar.type as Union).variants.values()];
    expect(_$.builtin.is(variant1)).toBe(false);
    expect(_$.builtin.is(variant2)).toBe(false);
    expect(_$.builtin.is(variant1.type)).toBe(true);
    expect(_$.builtin.is(variant2.type)).toBe(true);
  });

  it("works with enums and models", async () => {
    // -------------------------------------------------------------------
    //   - FooEnum (Enum variants)               → false
    //   - Foo.bar (ModelProperty of FooEnum)    → false
    //   - Foo.bar.type (Enum)                   → false
    //   - Baz.baz (ModelProperty of FooEnum.one)→ false
    //   - Baz.baz.type (EnumMember)             → false
    // -------------------------------------------------------------------
    const { Foo, bar, Baz } = (await runner.compile(
      `
      @test enum FooEnum {
        one: "1";
        two: "2";
      };

      @test model Foo {
        @test bar: FooEnum;
      }
      @test model Baz {
        @test baz: FooEnum.one;
      }
    `,
    )) as { Foo: Model; bar: ModelProperty; Baz: Model };

    program = runner.program;
    const _$ = $(program);

    expect(_$.builtin.is(Foo)).toBe(false);
    expect(_$.builtin.is(bar)).toBe(false);
    expect(_$.builtin.is(bar.type)).toBe(false);
    expect(_$.builtin.is(Baz)).toBe(false);
    expect(_$.builtin.is(Baz.properties.get("baz")!)).toBe(false);
    expect(_$.builtin.is(Baz.properties.get("baz")!.type)).toBe(false);
  });

  it("scalar extends an intrinsic (string)", async () => {
    // ------------------------------------------------------------
    //   - NotBuiltin (Scalar)             → false
    //   - NotBuiltin.baseScalar (string)  → true
    // ------------------------------------------------------------
    const { NotBuiltin } = (await runner.compile(
      `
      @test scalar NotBuiltin extends string; 
      `,
    )) as { NotBuiltin: Scalar };

    program = runner.program;
    const _$ = $(program);
    expect(_$.builtin.is(NotBuiltin)).toBe(false);
    expect(_$.builtin.is(NotBuiltin.baseScalar!)).toBe(true);
  });

  it("alias an intrinsic then extend it", async () => {
    // ------------------------------------------------------------
    //   - NotBuiltin (Scalar extends alias)  → false
    //   - NotBuiltin.baseScalar (int builtin)→ true
    // ------------------------------------------------------------
    const { NotBuiltin } = (await runner.compile(
      `
      alias UnixTimeStamp32 = unixTimestamp32;
      @test scalar NotBuiltin extends UnixTimeStamp32;
      `,
    )) as { NotBuiltin: Scalar };

    program = runner.program;
    const _$ = $(program);
    expect(_$.builtin.is(NotBuiltin)).toBe(false);
    expect(_$.builtin.is(NotBuiltin.baseScalar!)).toBe(true);
  });

  it("should recognize a model in global.TypeSpec", async () => {
    // ------------------------------------------------------------
    // Define a direct child of the root namespace called "TypeSpec"
    // ------------------------------------------------------------
    const { InTypeSpec } = (await runner.compile(`
      @test namespace TypeSpec {
        @test model InTypeSpec {
          @test foo: string;
        }
      }
    `)) as { InTypeSpec: Model };

    const program = runner.program;
    const _$ = $(program);

    expect(_$.builtin.is(InTypeSpec)).toBe(true);

    const prop = InTypeSpec.properties.get("foo")!;
    expect(_$.builtin.is(prop)).toBe(true);

    expect(_$.builtin.is(prop.type)).toBe(true);
  });

  it("should NOT recognize a nested TypeSpec namespace", async () => {
    // ----------------------------------------------------------------
    // A namespace called "TypeSpec" but nested inside another namespace
    // ----------------------------------------------------------------
    const { InNested } = (await runner.compile(`
      @test namespace Outer {
        @test namespace TypeSpec {
          @test model InNested {
            @test bar: int32;
          }
        }
      }
    `)) as { InNested: Model };

    const program = runner.program;
    const _$ = $(program);

    // Although the local namespace is called "TypeSpec",
    // it's not direct child of the global namespace → false
    expect(_$.builtin.is(InNested)).toBe(false);
  });

  it("should always return true for pure intrinsics", async () => {
    const _$ = $(program);
    const stringType = _$.builtin.string;

    expect(_$.builtin.is(stringType)).toBe(true);

    const int32Type = _$.builtin.int32;
    expect(_$.builtin.is(int32Type)).toBe(true);
  });
});
