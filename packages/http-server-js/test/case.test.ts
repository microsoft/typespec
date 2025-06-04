import { describe, expect, it } from "vitest";
import { isUnspeakable, parseCase } from "../src/util/case.js";

describe("parseCase", () => {
  it.each([
    {
      input: "HTTPResponse",
      snakeCase: "http_response",
      camelCase: "httpResponse",
      pascalCase: "HttpResponse",
    },
    {
      input: "OpenAIContext",
      snakeCase: "open_ai_context",
      camelCase: "openAiContext",
      pascalCase: "OpenAiContext",
    },
    { input: "_", snakeCase: "_", camelCase: "_", pascalCase: "_" },
    { input: "__type", snakeCase: "__type", camelCase: "__type", pascalCase: "__Type" },
    { input: "_Foo", snakeCase: "_foo", camelCase: "_foo", pascalCase: "_Foo" },
  ])("$input", (testCase) => {
    const result = parseCase(testCase.input);
    expect(result.snakeCase).toBe(testCase.snakeCase);
    expect(result.camelCase).toBe(testCase.camelCase);
    expect(result.pascalCase).toBe(testCase.pascalCase);
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
