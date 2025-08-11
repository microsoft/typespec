import { Output } from "@alloy-js/core";
import { SourceFile } from "@alloy-js/python";
import { type Model, type Namespace, type Program, type Value } from "@typespec/compiler";
import { $ } from "@typespec/compiler/typekit";
import { assert, beforeAll, describe, expect, it } from "vitest";
import { Atom } from "../../index.js";
import { getProgram } from "../../test-host.js";

let program: Program;
beforeAll(async () => {
  program = await getProgram("");
});

describe("NullValue", () => {
  it("null value", async () => {
    const value = { entityKind: "Value", valueKind: "NullValue", value: null } as Value;

    await testValueExpression(value, `None`);
  });
});

describe("StringValue", () => {
  it("normal string", async () => {
    const value = $(program).value.createString("test");

    await testValueExpression(value, `"test"`);
  });

  it("empty string", async () => {
    const value = $(program).value.createString("");

    await testValueExpression(value, `""`);
  });
});

describe("BooleanValue", () => {
  it("True", async () => {
    const value = $(program).value.createBoolean(true);

    await testValueExpression(value, `True`);
  });

  it("False", async () => {
    const value = $(program).value.createBoolean(false);

    await testValueExpression(value, `False`);
  });
});

describe("NumericValue", () => {
  it("integers", async () => {
    const value = $(program).value.createNumeric(42);

    await testValueExpression(value, `42`);
  });

  it("decimals", async () => {
    const value = $(program).value.createNumeric(42.5);

    await testValueExpression(value, `42.5`);
  });
});

describe("ArrayValue", () => {
  it("empty", async () => {
    // Can be replaced with with TypeKit once #6976 is implemented
    const value = {
      entityKind: "Value",
      valueKind: "ArrayValue",
      values: [],
    } as unknown as Value;
    await testValueExpression(value, `[]`);
  });

  it("with mixed values", async () => {
    // Can be replaced with with TypeKit once #6976 is implemented
    const value = {
      entityKind: "Value",
      valueKind: "ArrayValue",
      values: [
        $(program).value.createString("some_text"),
        $(program).value.createNumeric(42),
        $(program).value.createBoolean(true),
        {
          entityKind: "Value",
          valueKind: "ArrayValue",
          values: [
            $(program).value.createNumeric(1),
            $(program).value.createNumeric(2),
            $(program).value.createNumeric(3),
          ],
        } as Value,
      ],
    } as Value;
    await testValueExpression(value, `["some_text", 42, True, [1, 2, 3]]`);
  });
});

describe("ScalarValue", () => {
  it("utcDateTime.fromISO correctly supplied", async () => {
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
    await testValueExpression(
      minDate,
      `"datetime.datetime(2024, 2, 15, 18, 36, 3, tzinfo=datetime.timezone.utc)"`,
    );
  });

  it("Unsupported scalar constructor", async () => {
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
});

describe("ObjectValue", () => {
  it("empty object", async () => {
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

  it("object with properties", async () => {
    // Can be replaced with with TypeKit once #6976 is implemented
    const program = await getProgram(`
        namespace DemoService;
        @example(#{aNumber: 5, aString: "foo", aBoolean: true})
        model ObjectValue {
          aNumber: int32;
          aString: string;
          aBoolean: boolean;
        };
      `);
    const [namespace] = program.resolveTypeReference("DemoService");
    const model = (namespace as Namespace).models.get("ObjectValue");
    assert.exists(model, "unable to find ObjectValue model");

    const value = getExampleValue(model);
    await testValueExpression(value, `{"aNumber": 5, "aString": "foo", "aBoolean": True}`);
  });
});

// describe("EnumValue", () => {
//   it("different EnumValue types", async () => {
//     // Can be replaced with with TypeKit once #6976 is implemented
//     const program = await getProgram(`
//         namespace DemoService;
//         enum Color {
//           Red,
//           Green: 3,
//           Blue
//         }
//       `);
//     const [namespace] = program.resolveTypeReference("DemoService");
//     const colors = (namespace as Namespace).enums.get("Color");
//     assert.exists(colors, "unable to find Color enum");

//     const red = colors?.members.get("Red");
//     assert.exists(red, "unable to find Red enum member");
//     await testValueExpression(
//       {
//         valueKind: "EnumValue",
//         value: red,
//       } as EnumValue,
//       `"Red"`,
//     );

//     const green = colors?.members.get("Green");
//     assert.exists(green, "unable to find Green enum member");
//     await testValueExpression(
//       {
//         valueKind: "EnumValue",
//         value: green,
//       } as EnumValue,
//       `3`,
//     );
//   });
// });

/**
 * Helper that renders a value expression and checks the output against the expected value.
 */
async function testValueExpression(value: Value, expected: string) {
  expect(
    <Output>
      <SourceFile path="test.py">
        <Atom value={value} />
      </SourceFile>
    </Output>,
  ).toRenderTo(`${expected}`);
}

/**
 * Extracts the value marked with the @example decorator from a model.
 */
function getExampleValue(model: Model): Value {
  const decorator = model?.decorators.find((d) => d.definition?.name === "@example");
  assert.exists(decorator?.args[0]?.value, "unable to find example decorator");
  return decorator.args[0].value as Value;
}
