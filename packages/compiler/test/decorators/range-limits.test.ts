import { strictEqual } from "assert";
import { beforeEach, describe, it } from "vitest";
import {
  getMaxItems,
  getMaxLength,
  getMaxValue,
  getMinItems,
  getMinLength,
  getMinValue,
} from "../../src/core/intrinsic-type-state.js";
import { Model } from "../../src/core/types.js";
import { BasicTestRunner, createTestRunner, expectDiagnostics } from "../../src/testing/index.js";

describe("compiler: range limiting decorators", () => {
  let runner: BasicTestRunner;

  beforeEach(async () => {
    runner = await createTestRunner();
  });

  it("applies @minimum and @maximum decorators", async () => {
    const { A, B } = (await runner.compile(
      `
      @test model A { @minValue(15) foo: int32; @maxValue(55) boo: float32; }
      @test model B { @maxValue(20) bar: int64; @minValue(23) car: float64; }
      `,
    )) as { A: Model; B: Model };

    strictEqual(getMinValue(runner.program, A.properties.get("foo")!), 15);
    strictEqual(getMaxValue(runner.program, A.properties.get("boo")!), 55);
    strictEqual(getMaxValue(runner.program, B.properties.get("bar")!), 20);
    strictEqual(getMinValue(runner.program, B.properties.get("car")!), 23);
  });

  describe("@minValue, @maxValue", () => {
    it("applies on ints", async () => {
      const { Foo } = (await runner.compile(`
        @test model Foo {
          @minValue(2)
          @maxValue(10)
          floor: int32;
        }
      `)) as { Foo: Model };
      const floorProp = Foo.properties.get("floor")!;

      strictEqual(getMinValue(runner.program, floorProp), 2);
      strictEqual(getMaxValue(runner.program, floorProp), 10);
    });

    it("applies on float", async () => {
      const { Foo } = (await runner.compile(`
        @test model Foo {
          @minValue(2.5)
          @maxValue(32.9)
          percent: float64;
        }
      `)) as { Foo: Model };
      const percentProp = Foo.properties.get("percent")!;

      strictEqual(getMinValue(runner.program, percentProp), 2.5);
      strictEqual(getMaxValue(runner.program, percentProp), 32.9);
    });

    it("applies on nullable numeric", async () => {
      const { Foo } = (await runner.compile(`
        @test model Foo {
          @minValue(2.5)
          @maxValue(32.9)
          percent: float64 | null;
        }
      `)) as { Foo: Model };
      const percentProp = Foo.properties.get("percent")!;

      strictEqual(getMinValue(runner.program, percentProp), 2.5);
      strictEqual(getMaxValue(runner.program, percentProp), 32.9);
    });

    it("emit diagnostic if @minValue used on non numeric type", async () => {
      const diagnostics = await runner.diagnose(`
      @test model Foo {
        @minValue(2)
        name: string;
      }
    `);
      expectDiagnostics(diagnostics, {
        code: "decorator-wrong-target",
        message: "Cannot apply @minValue decorator to type it is not a numeric",
      });
    });

    it("emit diagnostic if @maxValue used on non numeric type", async () => {
      const diagnostics = await runner.diagnose(`
      @test model Foo {
        @maxValue(2)
        name: string;
      }
    `);
      expectDiagnostics(diagnostics, {
        code: "decorator-wrong-target",
        message: "Cannot apply @maxValue decorator to type it is not a numeric",
      });
    });

    it("emit diagnostic if @minValue is more than @maxValue", async () => {
      const diagnostics = await runner.diagnose(`
      @test model Foo {
        @minValue(3)
        @maxValue(2)
        name: int32;
      }
    `);
      expectDiagnostics(diagnostics, {
        code: "invalid-range",
        message: `Range "3..2" is invalid.`,
      });
    });
  });

  describe("@minLength, @maxLength", () => {
    it("applies @minLength and @maxLength decorators on strings", async () => {
      const { Foo } = (await runner.compile(`
        @test model Foo {
          @minLength(2)
          @maxLength(10)
          name: string;
        }
      `)) as { Foo: Model };
      const nameProp = Foo.properties.get("name")!;

      strictEqual(getMinLength(runner.program, nameProp), 2);
      strictEqual(getMaxLength(runner.program, nameProp), 10);
    });

    it("applies @minLength and @maxLength decorators on nullable strings", async () => {
      const { Foo } = (await runner.compile(`
        @test model Foo {
          @minLength(2)
          @maxLength(10)
          name: string | null;
        }
      `)) as { Foo: Model };
      const nameProp = Foo.properties.get("name")!;

      strictEqual(getMinLength(runner.program, nameProp), 2);
      strictEqual(getMaxLength(runner.program, nameProp), 10);
    });

    it("emit diagnostic if @minLength used on non string", async () => {
      const diagnostics = await runner.diagnose(`
      @test model Foo {
        @minLength(2)
        name: int32;
      }
    `);
      expectDiagnostics(diagnostics, {
        code: "decorator-wrong-target",
        message: "Cannot apply @minLength decorator to type it is not a string",
      });
    });

    it("emit diagnostic if @maxLength used on non string", async () => {
      const diagnostics = await runner.diagnose(`
      @test model Foo {
        @maxLength(2)
        name: int32;
      }
    `);
      expectDiagnostics(diagnostics, {
        code: "decorator-wrong-target",
        message: "Cannot apply @maxLength decorator to type it is not a string",
      });
    });

    it("emit diagnostic if @minLength is more than @maxLength", async () => {
      const diagnostics = await runner.diagnose(`
      @test model Foo {
        @minLength(3)
        @maxLength(2)
        name: string;
      }
    `);
      expectDiagnostics(diagnostics, {
        code: "invalid-range",
        message: `Range "3..2" is invalid.`,
      });
    });
  });

  describe("@minItems, @maxItems", () => {
    it("applies @minItems and @maxItems decorators on arrays", async () => {
      const { Foo } = (await runner.compile(`
        @test model Foo {
          @minItems(2)
          @maxItems(10)
          items: int32[];
        }
      `)) as { Foo: Model };
      const itemsProp = Foo.properties.get("items")!;

      strictEqual(getMinItems(runner.program, itemsProp), 2);
      strictEqual(getMaxItems(runner.program, itemsProp), 10);
    });

    it("emit diagnostic if @minItems used on non array", async () => {
      const diagnostics = await runner.diagnose(`
      @test model Foo {
        @minItems(2)
        items: int32;
      }
    `);
      expectDiagnostics(diagnostics, {
        code: "decorator-wrong-target",
        message: "Cannot apply @minItems decorator to non Array type",
      });
    });

    it("emit diagnostic if @maxItems used on non array", async () => {
      const diagnostics = await runner.diagnose(`
      @test model Foo {
        @maxItems(2)
        items: int32;
      }
    `);
      expectDiagnostics(diagnostics, {
        code: "decorator-wrong-target",
        message: "Cannot apply @maxItems decorator to non Array type",
      });
    });

    it("emit diagnostic if @minItems is more than @maxItems", async () => {
      const diagnostics = await runner.diagnose(`
      @test model Foo {
        @minItems(3)
        @maxItems(2)
        items: string[];
      }
    `);
      expectDiagnostics(diagnostics, {
        code: "invalid-range",
        message: `Range "3..2" is invalid.`,
      });
    });
  });
});
