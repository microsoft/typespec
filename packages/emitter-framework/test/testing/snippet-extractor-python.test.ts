import { d } from "@alloy-js/core/testing";
import { beforeEach, describe, expect, it } from "vitest";
import {
  createPythonExtractorConfig,
  createSnipperExtractor,
  SnippetExtractor,
} from "../../src/testing/index.js";

describe("Python Snippet Extractor", () => {
  let extractor: SnippetExtractor;

  beforeEach(() => {
    extractor = createSnipperExtractor(createPythonExtractorConfig());
  });

  it("should extract a class", () => {
    const content = d`
    class Foo:
        def __init__(self):
            print("Hello")
    `;

    const snippet = extractor.getClass(content, "Foo");
    expect(snippet).toBe(d`
      class Foo:
          def __init__(self):
              print("Hello")
    `);
  });

  it("should extract a function", () => {
    const content = d`
    def greet(name: str) -> str:
        return f"Hello {name}"
    `;

    const snippet = extractor.getFunction(content, "greet");
    expect(snippet).toBe(d`
      def greet(name: str) -> str:
          return f"Hello {name}"
    `);
  });
});
