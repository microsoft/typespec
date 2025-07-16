import { Output, render } from "@alloy-js/core";
import { dedent } from "@alloy-js/core/testing";
import { SourceFile } from "@alloy-js/typescript";
import {
  type EnumValue,
  type Model,
  type Namespace,
  Numeric,
  type NumericValue,
  type Program,
  type Value,
} from "@typespec/compiler";
import { $ } from "@typespec/compiler/typekit";
import { assert, beforeAll, describe, expect, it } from "vitest";
import { ValueExpression } from "../../../src/typescript/components/value-expression.js";
import { getProgram } from "../test-host.js";

let program: Program;
beforeAll(async () => {
  program = await getProgram("");
});

it("renders strings", async () => {
  const value = $(program).value.createString("test");

  await testValueExpression(value, `"test"`);
});

describe("numeric values", () => {
  it("renders integers", async () => {
    const value = $(program).value.createNumeric(42);

    await testValueExpression(value, `42`);
  });

  it("renders decimals", async () => {
    const value = $(program).value.createNumeric(42.5);

    await testValueExpression(value, `42.5`);
  });

  it("renders bigints", async () => {
    const digits = "1234567890123456789012345678901234567890";
    const value: NumericValue = {
      entityKind: "Value",
      valueKind: "NumericValue",
      value: Numeric(digits),
    } as NumericValue;

    await testValueExpression(value, `${digits}n`);
  });

  it("throws on invalid numbers", async () => {
    const digits = "123456789123456789.112233445566778899";
    const value: NumericValue = {
      entityKind: "Value",
      valueKind: "NumericValue",
      value: Numeric(digits),
    } as NumericValue;

    await expect(testValueExpression(value, ``)).rejects.toThrow("BigInt value must be an integer");
  });
});

it("renders booleans", async () => {
  const value = $(program).value.createBoolean(true);
  await testValueExpression(value, `true`);
});

it("renders nulls", async () => {
  const value = {
    entityKind: "Value",
    valueKind: "NullValue",
    value: null,
  } as Value;
  await testValueExpression(value, `null`);
});

it("renders empty arrays", async () => {
  // Can be replaced with with TypeKit once #6976 is implemented
  const value = {
    entityKind: "Value",
    valueKind: "ArrayValue",
    values: [],
  } as unknown as Value;
  await testValueExpression(value, `[]`);
});

it("renders arrays with mixed values", async () => {
  const tk = $(program);
  // Can be replaced with with TypeKit once #6976 is implemented
  const value = {
    entityKind: "Value",
    valueKind: "ArrayValue",
    values: [
      tk.value.createString("foo"),
      tk.value.createNumeric(42),
      tk.value.createBoolean(true),
    ],
  } as Value;
  await testValueExpression(value, `["foo", 42, true]`);
});

it("renders scalars", async () => {
  const program = await getProgram(`
      namespace DemoService;
      model DateRange {
        @encode("rfc7231")
        minDate: utcDateTime = utcDateTime.fromISO("2024-02-15T18:36:03Z");
      }
    `);
  const [namespace] = program.resolveTypeReference("DemoService");
  const dateRange = (namespace as Namespace).models.get("DateRange");
  const minDate = dateRange?.properties.get("minDate")?.defaultValue;
  assert.exists(minDate, "unable to find minDate property");
  await testValueExpression(minDate, `"2024-02-15T18:36:03Z"`);
});

it("throws on unsupported scalar", async () => {
  const program = await getProgram(`
      namespace DemoService;

      scalar ipv4 extends string {
        init fromInt(value: uint32);
      }

      @example (#{ip: ipv4.fromInt(2130706433)})
      model IpAddress {
        ip: ipv4;
      }
    `);
  const [namespace] = program.resolveTypeReference("DemoService");
  const model = (namespace as Namespace).models.get("IpAddress");
  assert.exists(model, "unable to find IpAddress model");

  const value = getExampleValue(model);
  await expect(testValueExpression(value, ``)).rejects.toThrow(
    /Unsupported scalar constructor fromInt/,
  );
});

it("renders empty objects", async () => {
  // Can be replaced with with TypeKit once #6976 is implemented
  const program = await getProgram(`
      namespace DemoService;
      @example(#{})
      model ObjectValue {};
    `);
  const [namespace] = program.resolveTypeReference("DemoService");
  const model = (namespace as Namespace).models.get("ObjectValue");
  assert.exists(model, "unable to find ObjectValue model");

  const value = getExampleValue(model);
  await testValueExpression(value, `{}`);
});

it("renders objects with properties", async () => {
  // Can be replaced with with TypeKit once #6976 is implemented
  const program = await getProgram(`
      namespace DemoService;
      @example(#{a: 5, b: "foo", c: true})
      model ObjectValue {
        a: int32;
        b: string;
        c: boolean;
      };
    `);
  const [namespace] = program.resolveTypeReference("DemoService");
  const model = (namespace as Namespace).models.get("ObjectValue");
  assert.exists(model, "unable to find ObjectValue model");

  const value = getExampleValue(model);
  await testValueExpression(
    value,
    dedent(`
      {
        a: 5,
        b: "foo",
        c: true,
      }`),
  );
});

it("renders enums", async () => {
  // Can be replaced with with TypeKit once #6976 is implemented
  const program = await getProgram(`
      namespace DemoService;
      enum Color {
        Red,
        Green: 3,
        Blue
      }
    `);
  const [namespace] = program.resolveTypeReference("DemoService");
  const colors = (namespace as Namespace).enums.get("Color");
  assert.exists(colors, "unable to find Color enum");

  const red = colors?.members.get("Red");
  assert.exists(red, "unable to find Red enum member");
  await testValueExpression(
    {
      valueKind: "EnumValue",
      value: red,
    } as EnumValue,
    `"Red"`,
  );

  const green = colors?.members.get("Green");
  assert.exists(green, "unable to find Green enum member");
  await testValueExpression(
    {
      valueKind: "EnumValue",
      value: green,
    } as EnumValue,
    `3`,
  );
});

/**
 * Helper that renders a value expression and checks the output against the expected value.
 */
async function testValueExpression(value: Value, expected: string) {
  const prefix = "const val = ";
  const res = render(
    <Output>
      <SourceFile path="test.ts">
        {prefix}
        <ValueExpression value={value} />
      </SourceFile>
    </Output>,
  );
  const testFile = res.contents.find((file) => file.path === "test.ts");

  assert.exists(testFile, "test.ts file not rendered");

  assert.equal(
    testFile.contents,
    `${prefix}${expected}`,
    "test.ts file contents do not match expected",
  );
}

/**
 * Extracts the value marked with the @example decorator from a model.
 */
function getExampleValue(model: Model): Value {
  const decorator = model?.decorators.find((d) => d.definition?.name === "@example");
  assert.exists(decorator?.args[0]?.value, "unable to find example decorator");
  return decorator.args[0].value as Value;
}
