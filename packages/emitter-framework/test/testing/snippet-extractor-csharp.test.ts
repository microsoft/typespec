import { d } from "@alloy-js/core/testing";
import { beforeEach, describe, expect, it } from "vitest";
import {
  createCSharpExtractorConfig,
  createSnipperExtractor,
  SnippetExtractor,
} from "../../src/testing/index.js";
describe("C# Snippet Extractor", () => {
  let extractor: SnippetExtractor;

  beforeEach(() => {
    extractor = createSnipperExtractor(createCSharpExtractorConfig());
  });

  it("should extract a class", () => {
    const content = d`
    public class Foo {
      public Foo() {
        Console.WriteLine("Hello");
      }
    }
    `;

    const snippet = extractor.getClass(content, "Foo");
    expect(snippet).toBe(d`
      public class Foo {
        public Foo() {
          Console.WriteLine("Hello");
        }
      }
    `);
  });

  it("should extract an interface", () => {
    const content = d`
    public interface IMyInterface {
      string Foo();
    }
    `;

    const snippet = extractor.getInterface(content, "IMyInterface");
    expect(snippet).toBe(d`
      public interface IMyInterface {
        string Foo();
      }
    `);
  });

  it("should extract a function", () => {
    const content = d`
    public string Greet(string name) {
      return "Hello " + name;
    }
    `;

    const snippet = extractor.getFunction(content, "Greet");
    expect(snippet).toBe(d`
      public string Greet(string name) {
        return "Hello " + name;
      }
    `);
  });
});

describe("C# Snippet Extractor - Enums", () => {
  let extractor: SnippetExtractor;

  beforeEach(() => {
    extractor = createSnipperExtractor(createCSharpExtractorConfig());
  });

  it("should extract a basic enum", async () => {
    const content = d`
      public enum Direction
      {
          Up,
          Down,
          Left,
          Right
      }
    `;

    const snippet = extractor.getEnum(content, "Direction");
    expect(snippet).toBe(d`
      public enum Direction
      {
          Up,
          Down,
          Left,
          Right
      }
    `);
  });

  it("should extract an enum with values", async () => {
    const content = d`
      public enum Status
      {
          Active = 1,
          Inactive = 2
      }
    `;

    const snippet = extractor.getEnum(content, "Status");
    expect(snippet).toBe(d`
      public enum Status
      {
          Active = 1,
          Inactive = 2
      }
    `);
  });
});
