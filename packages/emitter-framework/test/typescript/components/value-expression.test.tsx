import { Output, render } from "@alloy-js/core";
import { SourceFile } from "@alloy-js/typescript";
import { ArrayValue, Namespace, Value } from "@typespec/compiler";
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
          <ValueExpression value={value} />
        </SourceFile>
      </Output>,
    );
    const testFile = res.contents.find((file) => file.path === "test.ts");
    assert(testFile, "test.ts file not rendered");
    const actualContent = await format(testFile.contents as string, { parser: "typescript" });
    const expectedContent = await format(expected, {
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

  it.todo("handles array with mixed values", async () => {
    await getProgram(``);
    const value: ArrayValue = {
      entityKind: "Value",
      valueKind: "ArrayValue",
      values: [$.value.createString("foo"), $.value.createNumeric(42), $.value.createBoolean(true)],
      type: {},
    } as unknown as ArrayValue;
    await testValueExpression(value, `["foo", 42, true]`);
  });

  it("handles fromISO scalar value", async () => {
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
    assert(minDate, "minDate property not found");
    await testValueExpression(minDate, `fdfd`);
  });

  it("throws on unsupported scalar constructor", async () => {
    // TODO: implement test
  });

  it("handles empty object value", async () => {
    // TODO: implement test
  });

  it("handles object with mixed property types", async () => {
    // TODO: implement test
  });

  it("throws on unsupported value kind", async () => {
    // TODO: implement test
  });
});
