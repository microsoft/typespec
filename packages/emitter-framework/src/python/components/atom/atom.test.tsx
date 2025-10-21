import { getOutput } from "#python/test-utils.js";
import { Tester } from "#test/test-host.js";
import { type Model, type Program, type Value } from "@typespec/compiler";
import { t } from "@typespec/compiler/testing";
import { $ } from "@typespec/compiler/typekit";
import { assert, beforeAll, describe, expect, it } from "vitest";
import { Atom } from "../../index.js";

let program: Program;

beforeAll(async () => {
  const result = await Tester.compile("");
  program = result.program;
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
    // Can be replaced with TypeKit once #6976 is implemented
    const value = {
      entityKind: "Value",
      valueKind: "ArrayValue",
      values: [],
    } as unknown as Value;
    await testValueExpression(value, `[]`);
  });

  it("with mixed values", async () => {
    // Can be replaced with TypeKit once #6976 is implemented
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
    const { minDate } = await Tester.compile(t.code`
      model ${t.model("DateRange")} {
        @encode("rfc7231")
        ${t.modelProperty("minDate")}: ${t.type("utcDateTime")} = utcDateTime.fromISO("2024-02-15T18:36:03Z");
      }
    `);
    await testValueExpression(
      minDate.defaultValue!,
      `"datetime.datetime(2024, 2, 15, 18, 36, 3, tzinfo=datetime.timezone.utc)"`,
    );
  });

  it("Unsupported scalar constructor", async () => {
    const { IpAddress } = await Tester.compile(t.code`
        scalar ${t.scalar("ipv4")} extends ${t.scalar("string")} {
          init fromInt(value: uint32);
        }

        @example (#{ip: ipv4.fromInt(2130706433)})
        model ${t.model("IpAddress")} {
          ${t.modelProperty("ip")}: ${t.type("ipv4")};
        }
      `);

    const value = getExampleValue(IpAddress);
    await expect(testValueExpression(value, ``)).rejects.toThrow(
      /Unsupported scalar constructor fromInt/,
    );
  });
});

describe("ObjectValue", () => {
  it("empty object", async () => {
    // Can be replaced with TypeKit once #6976 is implemented
    const { ObjectValue } = await Tester.compile(t.code`
        @example(#{})
        model ${t.model("ObjectValue")} {};
      `);

    const value = getExampleValue(ObjectValue);
    await testValueExpression(value, `{}`);
  });

  it("object with properties", async () => {
    // Can be replaced with TypeKit once #6976 is implemented
    const { ObjectValue } = await Tester.compile(t.code`
        @example(#{aNumber: 5, aString: "foo", aBoolean: true})
        model ${t.model("ObjectValue")} {
          ${t.modelProperty("aNumber")}: int32;
          ${t.modelProperty("aString")}: string;
          ${t.modelProperty("aBoolean")}: boolean;
        };
      `);
    const value = getExampleValue(ObjectValue);
    await testValueExpression(value, `{"aNumber": 5, "aString": "foo", "aBoolean": True}`);
  });
});

describe("EnumValue", () => {
  it("different EnumValue types", async () => {
    // Can be replaced with TypeKit once #6976 is implemented
    const { Red, Green, Blue } = await Tester.compile(t.code`
        enum ${t.enum("Color")} {
          Red,
          Green: 3,
          Blue: "cyan",
        }
        const ${t.value("Red")} = ${t.enumValue("Color.Red")};
        const ${t.value("Green")} = ${t.enumValue("Color.Green")};
        const ${t.value("Blue")} = ${t.enumValue("Color.Blue")};
      `);

    await testValueExpression(Red, `"Red"`);
    await testValueExpression(Green, `3`);
    await testValueExpression(Blue, `"cyan"`);
  });
});

/**
 * Helper that renders a value expression and checks the output against the expected value.
 */
async function testValueExpression(value: Value, expected: string) {
  expect(getOutput(program, [<Atom value={value} />])).toRenderTo(`${expected}`);
}

/**
 * Extracts the value marked with the @example decorator from a model.
 */
function getExampleValue(model: Model): Value {
  const decorator = model?.decorators.find((d) => d.definition?.name === "@example");
  assert.exists(decorator?.args[0]?.value, "unable to find example decorator");
  return decorator.args[0].value as Value;
}
