import { Output, render } from "@alloy-js/core";
import { SourceFile } from "@alloy-js/typescript";
import { ArrayValue, EnumValue, Namespace, Value } from "@typespec/compiler";
import { $ } from "@typespec/compiler/experimental/typekit";
import { format } from "prettier";
import { assert, describe, expect, it } from "vitest";
import { ValueExpression } from "../../../src/typescript/components/value-expression.js";
import { getProgram } from "../test-host.js";

describe("ValueExpression", () => {
  async function testValueExpression(value: Value, expected: string) {
    const res = render(
      <Output>
        <SourceFile path="test.ts">
          const val = <ValueExpression value={value} />
        </SourceFile>
      </Output>,
    );
    const testFile = res.contents.find((file) => file.path === "test.ts");

    assert.exists(testFile, "test.ts file not rendered");
    const actualContent = await format(testFile.contents as string, { parser: "typescript" });
    const expectedContent = await format(`const val = ${expected}`, {
      parser: "typescript",
    });
    expect(actualContent).toBe(expectedContent);
  }

  it("handles string value", async () => {
    // Error: Default typekits may not be used until a program is set in the compiler.
    // TODO: better way to set this up so I can use typekit?
    await getProgram(``);
    const value = $.value.createString("test");

    await testValueExpression(value, `"test"`);
  });

  it("handles numeric value", async () => {
    await getProgram(``);
    const value = $.value.createNumeric(42);

    await testValueExpression(value, `42`);
  });

  it("handles decimal numeric value", async () => {
    await getProgram(``);
    const value = $.value.createNumeric(42.5);
    await testValueExpression(value, `42.5`);
  });

  it("handles boolean value", async () => {
    await getProgram(``);
    const value = $.value.createBoolean(true);
    await testValueExpression(value, `true`);
  });

  it("handles null value", async () => {
    await getProgram(``);
    const value: Value = {
      entityKind: "Value",
      valueKind: "NullValue",
      value: null,
    } as Value;
    await testValueExpression(value, `null`);
  });

  it("handles empty array value", async () => {
    // TODO: is there a better way to create an empty array value?
    await getProgram(``);
    const value: ArrayValue = {
      entityKind: "Value",
      valueKind: "ArrayValue",
      values: [],
      type: {},
    } as unknown as ArrayValue;
    await testValueExpression(value, `[]`);
  });

  it("handles array with mixed values", async () => {
    await getProgram(``);
    const value: ArrayValue = {
      entityKind: "Value",
      valueKind: "ArrayValue",
      values: [$.value.createString("foo"), $.value.createNumeric(42), $.value.createBoolean(true)],
      type: {},
    } as unknown as ArrayValue;
    await testValueExpression(value, `["foo", 42, true]`);
  });

  it.todo("handles fromISO scalar value", async () => {
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
    await testValueExpression(minDate, "2024-02-15T18:36:03Z`");
  });

  it("throws on unsupported scalar constructor", async () => {
    // TODO: implement test
  });

  it("handles empty object value", async () => {
    const program = await getProgram(`
      namespace DemoService;
      @example(#{})
      model ObjectValue {};
    `);
    const [namespace] = program.resolveTypeReference("DemoService");
    const objectValue = (namespace as Namespace).models.get("ObjectValue");
    const decorator = objectValue?.decorators.find((d) => d.definition?.name === "@example");
    assert.exists(decorator?.args[0]?.value, "unable to find example decorator");
    await testValueExpression(decorator.args[0].value as Value, `{}`);
  });

  it("handles object with mixed property types", async () => {
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
    const objectValue = (namespace as Namespace).models.get("ObjectValue");
    const decorator = objectValue?.decorators.find((d) => d.definition?.name === "@example");
    assert.exists(decorator?.args[0]?.value, "unable to find example decorator");
    await testValueExpression(
      decorator.args[0].value as Value,
      `{
        a: 5, 
        b: "foo", 
        c: true
      };`,
    );
  });

  it("handles enum value", async () => {
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
});
