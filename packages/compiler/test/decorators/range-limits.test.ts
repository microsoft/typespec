import { ok, strictEqual } from "assert";
import { describe, expect, it } from "vitest";
import {
  getMaxItems,
  getMaxLength,
  getMaxValue,
  getMaxValueForScalar,
  getMinItems,
  getMinLength,
  getMinValue,
  getMinValueForScalar,
} from "../../src/core/intrinsic-type-state.js";
import { Numeric } from "../../src/core/numeric.js";
import { ScalarValue } from "../../src/core/types.js";
import { expectDiagnostics, t } from "../../src/testing/index.js";
import { Tester } from "../tester.js";

describe("compiler: range limiting decorators", () => {
  it("applies @minimum and @maximum decorators", async () => {
    const { A, B, program } = await Tester.compile(t.code`
      model ${t.model("A")} { @minValue(15) foo: int32; @maxValue(55) boo: float32; }
      model ${t.model("B")} { @maxValue(20) bar: int64; @minValue(23) car: float64; }
    `);

    strictEqual(getMinValue(program, A.properties.get("foo")!), 15);
    strictEqual(getMaxValue(program, A.properties.get("boo")!), 55);
    strictEqual(getMaxValue(program, B.properties.get("bar")!), 20);
    strictEqual(getMinValue(program, B.properties.get("car")!), 23);
  });

  describe("@minValue, @maxValue", () => {
    it("applies on ints", async () => {
      const { Foo, program } = await Tester.compile(t.code`
        model ${t.model("Foo")} {
          @minValue(2)
          @maxValue(10)
          floor: int32;
        }
      `);
      const floorProp = Foo.properties.get("floor")!;

      strictEqual(getMinValue(program, floorProp), 2);
      strictEqual(getMaxValue(program, floorProp), 10);
    });

    it("applies on float", async () => {
      const { Foo, program } = await Tester.compile(t.code`
        model ${t.model("Foo")} {
          @minValue(2.5)
          @maxValue(32.9)
          percent: float64;
        }
      `);
      const percentProp = Foo.properties.get("percent")!;

      strictEqual(getMinValue(program, percentProp), 2.5);
      strictEqual(getMaxValue(program, percentProp), 32.9);
    });

    it("applies on nullable numeric", async () => {
      const { Foo, program } = await Tester.compile(t.code`
        model ${t.model("Foo")} {
          @minValue(2.5)
          @maxValue(32.9)
          percent: float64 | null;
        }
      `);
      const percentProp = Foo.properties.get("percent")!;

      strictEqual(getMinValue(program, percentProp), 2.5);
      strictEqual(getMaxValue(program, percentProp), 32.9);
    });

    it("emit diagnostic if @minValue used on non numeric type", async () => {
      const diagnostics = await Tester.diagnose(`
      model Foo {
        @minValue(2)
        name: string;
      }
    `);
      expectDiagnostics(diagnostics, {
        code: "decorator-wrong-target",
        message: "Cannot apply @minValue decorator to type it must be a numeric or comparable type",
      });
    });

    it("emit diagnostic if @maxValue used on non numeric type", async () => {
      const diagnostics = await Tester.diagnose(`
      model Foo {
        @maxValue(2)
        name: string;
      }
    `);
      expectDiagnostics(diagnostics, {
        code: "decorator-wrong-target",
        message: "Cannot apply @maxValue decorator to type it must be a numeric or comparable type",
      });
    });

    it("emit diagnostic if @minValue is more than @maxValue", async () => {
      const diagnostics = await Tester.diagnose(`
      model Foo {
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

    it("emit diagnostic if not assignable to the numeric type", async () => {
      const [{ pos }, diagnostics] = await Tester.compileAndDiagnose(`
      model Foo {
        @minValue(/*error*/1234)
        name: int8;
      }
    `);
      expectDiagnostics(diagnostics, {
        code: "unassignable",
        message: "Type '1234' is not assignable to type 'int8'",
        pos: pos.error.pos,
      });
    });

    describe("datetime types", () => {
      function expectScalarValue(
        value: Numeric | ScalarValue | undefined,
        scalar: string,
        constructor: string,
      ) {
        ok(value);
        ok("valueKind" in value);

        expect(value.scalar.name).toEqual(scalar);
        expect(value.value).toMatchObject({ name: constructor });
      }

      it("applies @minValue and @maxValue on unixTimestamp32", async () => {
        const { stamp, program } = await Tester.compile(t.code`
          model Foo {
            @minValue(unixTimestamp32.fromISO("2025-01-01T00:00:00Z"))
            @maxValue(unixTimestamp32.fromISO("2025-12-31T23:59:59Z"))
            ${t.modelProperty("stamp")}: unixTimestamp32;
          }
        `);

        expectScalarValue(getMinValueForScalar(program, stamp), "unixTimestamp32", "fromISO");
        expectScalarValue(getMaxValueForScalar(program, stamp), "unixTimestamp32", "fromISO");
      });

      it("applies @minValue and @maxValue on utcDateTime", async () => {
        const { stamp, program } = await Tester.compile(t.code`
          model Foo {
            @minValue(utcDateTime.fromISO("2025-01-01T00:00:00Z"))
            @maxValue(utcDateTime.fromISO("2025-12-31T23:59:59Z"))
            ${t.modelProperty("stamp")}: utcDateTime;
          }
        `);

        expectScalarValue(getMinValueForScalar(program, stamp), "utcDateTime", "fromISO");
        expectScalarValue(getMaxValueForScalar(program, stamp), "utcDateTime", "fromISO");
      });

      it("applies @minValue and @maxValue on offsetDateTime", async () => {
        const { stamp, program } = await Tester.compile(t.code`
          model Foo {
            @minValue(offsetDateTime.fromISO("2025-01-01T00:00:00+00:00"))
            @maxValue(offsetDateTime.fromISO("2025-12-31T23:59:59+00:00"))
            ${t.modelProperty("stamp")}: offsetDateTime;
          }
        `);

        expectScalarValue(getMinValueForScalar(program, stamp), "offsetDateTime", "fromISO");
        expectScalarValue(getMaxValueForScalar(program, stamp), "offsetDateTime", "fromISO");
      });

      it("applies @minValue and @maxValue on plainTime", async () => {
        const { stamp, program } = await Tester.compile(t.code`
          model Foo {
            @minValue(plainTime.fromISO("09:00:00"))
            @maxValue(plainTime.fromISO("17:00:00"))
            ${t.modelProperty("stamp")}: plainTime;
          }
        `);

        expectScalarValue(getMinValueForScalar(program, stamp), "plainTime", "fromISO");
        expectScalarValue(getMaxValueForScalar(program, stamp), "plainTime", "fromISO");
      });

      it("applies @minValue and @maxValue on plainDate", async () => {
        const { stamp, program } = await Tester.compile(t.code`
          model Foo {
            @minValue(plainDate.fromISO("2025-01-01"))
            @maxValue(plainDate.fromISO("2025-12-31"))
            ${t.modelProperty("stamp")}: plainDate;
          }
        `);

        expectScalarValue(getMinValueForScalar(program, stamp), "plainDate", "fromISO");
        expectScalarValue(getMaxValueForScalar(program, stamp), "plainDate", "fromISO");
      });

      it("applies @minValue and @maxValue on duration", async () => {
        const { stamp, program } = await Tester.compile(t.code`
          model Foo {
            @minValue(duration.fromISO("PT1H"))
            @maxValue(duration.fromISO("PT8H"))
            ${t.modelProperty("stamp")}: duration;
          }
        `);

        expectScalarValue(getMinValueForScalar(program, stamp), "duration", "fromISO");
        expectScalarValue(getMaxValueForScalar(program, stamp), "duration", "fromISO");
      });
    });
  });

  describe("@minLength, @maxLength", () => {
    it("applies @minLength and @maxLength decorators on strings", async () => {
      const { Foo, program } = await Tester.compile(t.code`
        model ${t.model("Foo")} {
          @minLength(2)
          @maxLength(10)
          name: string;
        }
      `);
      const nameProp = Foo.properties.get("name")!;

      strictEqual(getMinLength(program, nameProp), 2);
      strictEqual(getMaxLength(program, nameProp), 10);
    });

    it("applies @minLength and @maxLength decorators on nullable strings", async () => {
      const { Foo, program } = await Tester.compile(t.code`
        model ${t.model("Foo")} {
          @minLength(2)
          @maxLength(10)
          name: string | null;
        }
      `);
      const nameProp = Foo.properties.get("name")!;

      strictEqual(getMinLength(program, nameProp), 2);
      strictEqual(getMaxLength(program, nameProp), 10);
    });

    it("emit diagnostic if @minLength used on non string", async () => {
      const diagnostics = await Tester.diagnose(`
      model Foo {
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
      const diagnostics = await Tester.diagnose(`
      model Foo {
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
      const diagnostics = await Tester.diagnose(`
      model Foo {
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
      const { Foo, program } = await Tester.compile(t.code`
        model ${t.model("Foo")} {
          @minItems(2)
          @maxItems(10)
          items: int32[];
        }
      `);
      const itemsProp = Foo.properties.get("items")!;

      strictEqual(getMinItems(program, itemsProp), 2);
      strictEqual(getMaxItems(program, itemsProp), 10);
    });

    it("applies @minItems and @maxItems decorators on nullable arrays", async () => {
      const { Foo, program } = await Tester.compile(t.code`
        model ${t.model("Foo")} {
          @minItems(2)
          @maxItems(10)
          items: int32[] | null;
        }
      `);
      const itemsProp = Foo.properties.get("items")!;

      strictEqual(getMinItems(program, itemsProp), 2);
      strictEqual(getMaxItems(program, itemsProp), 10);
    });

    it("emit diagnostic if @minItems used on non array", async () => {
      const diagnostics = await Tester.diagnose(`
      model Foo {
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
      const diagnostics = await Tester.diagnose(`
      model Foo {
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
      const diagnostics = await Tester.diagnose(`
      model Foo {
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
