import { getExamples } from "@typespec/compiler";
import { describe, expect, it } from "vitest";
import { stringLiteral } from "../../src/cli/actions/convert/generators/common.js";
import { ApiTester } from "../test-host.js";

describe("stringLiteral", () => {
  it.each([
    ["a Windows path", "C:\\temp\\new\\"],
    ["a backslash before a quote or interpolation", '\\" \\${name}'],
    ["consecutive quotes and interpolation markers", '""${first}${second}'],
    ["carriage returns and tabs", "left\rright\tend"],
    ["multiline text with backslashes, tabs, and CRLF", "\n  C:\\temp\r\n\t\\${name}\n"],
    ["multiline text with adjacent quotes", 'start\n""""""\nend'],
  ])("round-trips %s through the compiler", async (_, value) => {
    const literal = stringLiteral(value);
    expect(literal.startsWith('"""')).toBe(value.includes("\n"));
    const { program } = await ApiTester.compile(`
      @example(${literal})
      scalar Sample extends string;
    `);
    const sample = program.getGlobalNamespaceType().scalars.get("Sample");
    expect.assert(sample !== undefined);
    expect(getExamples(program, sample)).toMatchObject([
      { value: { valueKind: "StringValue", value } },
    ]);
  });
});
