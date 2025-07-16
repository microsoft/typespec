import { describe, expect, it } from "vitest";
import { isUnspeakable, parseCase } from "../src/util/case.js";

describe("parseCase", () => {
  it.each([
    {
      input: "HTTPResponse",
      snakeCase: "http_response",
      camelCase: "httpResponse",
      pascalCase: "HttpResponse",
      upper: "HTTP_RESPONSE",
    },
    {
      input: "OpenAIContext",
      snakeCase: "open_ai_context",
      camelCase: "openAiContext",
      pascalCase: "OpenAiContext",
      upper: "OPEN_AI_CONTEXT",
    },
    { input: "_", snakeCase: "_", camelCase: "_", pascalCase: "_", upper: "_" },
    {
      input: "__type",
      snakeCase: "__type",
      camelCase: "__type",
      pascalCase: "__Type",
      upper: "__TYPE",
    },
    { input: "_Foo", snakeCase: "_foo", camelCase: "_foo", pascalCase: "_Foo", upper: "_FOO" },
    {
      input: "_FooBar",
      snakeCase: "_foo_bar",
      camelCase: "_fooBar",
      pascalCase: "_FooBar",
      upper: "_FOO_BAR",
    },
    {
      input: "_FOO_BAR",
      snakeCase: "_foo_bar",
      camelCase: "_fooBar",
      pascalCase: "_FooBar",
      upper: "_FOO_BAR",
    },
    {
      input: "ABC123",
      snakeCase: "abc123",
      camelCase: "abc123",
      pascalCase: "Abc123",
      upper: "ABC123",
    },
  ])("$input", (testCase) => {
    const result = parseCase(testCase.input);
    expect(result.snakeCase).toBe(testCase.snakeCase);
    expect(result.camelCase).toBe(testCase.camelCase);
    expect(result.pascalCase).toBe(testCase.pascalCase);
    expect(result.upper.snakeCase).toBe(testCase.upper);
  });
});

describe("isUnspeakable", () => {
  it.each([
    { name: "", expected: true },
    { name: "_", expected: false },
    { name: "123abc", expected: true },
    { name: "abc123", expected: false },
  ])("$name unspeakable: $expected", ({ name, expected }) => {
    expect(isUnspeakable(name)).toBe(expected);
  });
});
