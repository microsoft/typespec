import { Tester } from "#test/test-host.js";
import { t } from "@typespec/compiler/testing";
import { describe, expect, it } from "vitest";
import { ClassDeclaration } from "../../../../src/python/components/class-declaration/class-declaration.js";
import { getOutput } from "../../test-utils.jsx";

describe("Python Class Members", () => {
  describe("default values", () => {
    it("renders string default values", async () => {
      const { program, MyModel } = await Tester.compile(t.code`
      model ${t.model("MyModel")} {
        name: string = "default";
        description?: string = "optional with default";
        emptyString: string = "";
      }
      `);

      expect(getOutput(program, [<ClassDeclaration type={MyModel} />])).toRenderTo(
        `
          from dataclasses import dataclass
          from typing import Optional

          @dataclass(kw_only=True)
          class MyModel:
            name: str = "default"
            description: Optional[str] = "optional with default"
            empty_string: str = ""
          
          `,
      );
    });

    it("renders boolean default values", async () => {
      const { program, BooleanModel } = await Tester.compile(t.code`
      model ${t.model("BooleanModel")} {
        isActive: boolean = true;
        isDeleted: boolean = false;
        optional?: boolean = true;
      }
      `);

      expect(getOutput(program, [<ClassDeclaration type={BooleanModel} />])).toRenderTo(
        `
          from dataclasses import dataclass
          from typing import Optional

          @dataclass(kw_only=True)
          class BooleanModel:
            is_active: bool = True
            is_deleted: bool = False
            optional: Optional[bool] = True
          
          `,
      );
    });

    it("renders array default values", async () => {
      const { program, ArrayModel } = await Tester.compile(t.code`
      model ${t.model("ArrayModel")} {
        tags: string[] = #["tag1", "tag2"];
        emptyArray: int32[] = #[];
        numbers: int32[] = #[1, 2, 3];
      }
      `);

      expect(getOutput(program, [<ClassDeclaration type={ArrayModel} />])).toRenderTo(
        `
          from dataclasses import dataclass

          @dataclass(kw_only=True)
          class ArrayModel:
            tags: list[str] = ["tag1", "tag2"]
            empty_array: list[int] = []
            numbers: list[int] = [1, 2, 3]
          
          `,
      );
    });

    it("renders integer default values without .0 suffix", async () => {
      const { program, IntegerModel } = await Tester.compile(t.code`
      model ${t.model("IntegerModel")} {
        count: int32 = 42;
        bigNumber: int64 = 1000000;
        smallNumber: int8 = 127;
        unsignedValue: uint32 = 100;
        safeIntValue: safeint = 999;
      }
      `);

      expect(getOutput(program, [<ClassDeclaration type={IntegerModel} />])).toRenderTo(
        `
          from dataclasses import dataclass

          @dataclass(kw_only=True)
          class IntegerModel:
            count: int = 42
            big_number: int = 1000000
            small_number: int = 127
            unsigned_value: int = 100
            safe_int_value: int = 999
          
          `,
      );
    });

    it("renders float and decimal default values correctly", async () => {
      const { program, NumericDefaults } = await Tester.compile(t.code`

      scalar customFloat extends float;
      scalar customDecimal extends decimal;

      model ${t.model("NumericDefaults")} {
        // Float variants with decimal values
        floatBase: float = 1.5;
        float32Value: float32 = 2.5;
        float64Value: float64 = 3.5;
        customFloatValue: customFloat = 4.5;
        
        // Float variants with integer values (should render with .0)
        floatInt: float = 10;
        float32Int: float32 = 20;
        float64Int: float64 = 30;
        
        // Decimal variants
        decimalBase: decimal = 100.25;
        decimal128Value: decimal128 = 200.75;
        customDecimalValue: customDecimal = 300.125;
        
        // Decimal with integer values (should render with .0)
        decimalInt: decimal = 400;
        decimal128Int: decimal128 = 500;
      }
      `);

      expect(getOutput(program, [<ClassDeclaration type={NumericDefaults} />])).toRenderTo(
        `
          from dataclasses import dataclass
          from decimal import Decimal

          @dataclass(kw_only=True)
          class NumericDefaults:
            float_base: float = 1.5
            float32_value: float = 2.5
            float64_value: float = 3.5
            custom_float_value: float = 4.5
            float_int: float = 10.0
            float32_int: float = 20.0
            float64_int: float = 30.0
            decimal_base: Decimal = 100.25
            decimal128_value: Decimal = 200.75
            custom_decimal_value: Decimal = 300.125
            decimal_int: Decimal = 400.0
            decimal128_int: Decimal = 500.0
          
          `,
      );
    });

    it("distinguishes between integer and float types with same numeric value", async () => {
      const { program, MixedNumeric } = await Tester.compile(t.code`
      model ${t.model("MixedNumeric")} {
        intValue: int32 = 100;
        int64Value: int64 = 100;
        floatValue: float = 100;
        float64Value: float64 = 100;
        decimalValue: decimal = 100;
      }
      `);

      expect(getOutput(program, [<ClassDeclaration type={MixedNumeric} />])).toRenderTo(
        `
          from dataclasses import dataclass
          from decimal import Decimal

          @dataclass(kw_only=True)
          class MixedNumeric:
            int_value: int = 100
            int64_value: int = 100
            float_value: float = 100.0
            float64_value: float = 100.0
            decimal_value: Decimal = 100.0
          
          `,
      );
    });
  });
});
