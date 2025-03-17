import { d } from "@alloy-js/core/testing";
import { beforeEach, describe, expect, it } from "vitest";
import {
  createJavaExtractorConfig,
  createSnipperExtractor,
  SnippetExtractor,
} from "../../src/testing/index.js";

describe("Java Snippet Extractor", () => {
  let extractor: SnippetExtractor;

  beforeEach(() => {
    extractor = createSnipperExtractor(createJavaExtractorConfig());
  });

  it("should extract a class", () => {
    const content = d`
    public class Foo {
      public Foo() {
        System.out.println("Hello");
      }
    }
    `;

    const snippet = extractor.getClass(content, "Foo");
    expect(snippet).toBe(d`
      public class Foo {
        public Foo() {
          System.out.println("Hello");
        }
      }
    `);
  });

  it("should extract an interface", () => {
    const content = d`
    public interface MyInterface {
      String foo();
    }
    `;

    const snippet = extractor.getInterface(content, "MyInterface");
    expect(snippet).toBe(d`
      public interface MyInterface {
        String foo();
      }
    `);
  });

  it("should extract a function", () => {
    const content = d`
    public String greet(String name) {
      return "Hello " + name;
    }
    `;

    const snippet = extractor.getFunction(content, "greet");
    expect(snippet).toBe(d`
      public String greet(String name) {
        return "Hello " + name;
      }
    `);
  });
});

describe("Java Snippet Extractor - Enums", () => {
  let extractor: SnippetExtractor;

  beforeEach(() => {
    extractor = createSnipperExtractor(createJavaExtractorConfig());
  });

  it("should extract a basic enum", async () => {
    const content = d`
      public enum Direction {
          UP,
          DOWN,
          LEFT,
          RIGHT
      }
    `;

    const snippet = extractor.getEnum(content, "Direction");
    expect(snippet).toBe(d`
      public enum Direction {
          UP,
          DOWN,
          LEFT,
          RIGHT
      }
    `);
  });

  it("should extract an enum with constructor values", async () => {
    const content = d`
      public enum Status {
          ACTIVE(1),
          INACTIVE(2);

          private final int value;

          Status(int value) {
              this.value = value;
          }
      }
    `;

    const snippet = extractor.getEnum(content, "Status");
    expect(snippet).toBe(d`
      public enum Status {
          ACTIVE(1),
          INACTIVE(2);

          private final int value;

          Status(int value) {
              this.value = value;
          }
      }
    `);
  });
});
