import { d } from "@alloy-js/core/testing";
import { beforeEach, describe, expect, it } from "vitest";
import {
  createSnipperExtractor,
  createTypeScriptExtractorConfig,
  SnippetExtractor,
} from "../../src/testing/index.js";

describe("TypeScript Snippet Extractor", () => {
  let extractor: SnippetExtractor;
  beforeEach(() => {
    extractor = createSnipperExtractor(createTypeScriptExtractorConfig());
  });

  it("should extract a class", async () => {
    const content = d`
    function bar(): number {
      return 1;
    }
    class Foo {
       constructor() {
          console.log("Hello");
       }
    }
    `;

    const snippet = extractor.getClass(content, "Foo");
    expect(snippet).toBe(d`
      class Foo {
         constructor() {
            console.log("Hello");
         }
      }
      `);
  });

  it("should extract an exported class", async () => {
    const content = d`
    function bar(): number {
      return 1;
    }
    export class Foo {
       constructor() {
          console.log("Hello");
       }
    }
    `;

    const snippet = extractor.getClass(content, "Foo");
    expect(snippet).toBe(d`
      export class Foo {
         constructor() {
            console.log("Hello");
         }
      }
      `);
  });

  it("should extract a  class that extends another", async () => {
    const content = d`
    export class Bar {
       constructor() {
          console.log("Hello");
       }
    }
    export class Foo extends Bar {
       constructor() {
          console.log("Hello");
       }
    }
    `;

    const snippet = extractor.getClass(content, "Foo");
    expect(snippet).toBe(d`
      export class Foo extends Bar {
         constructor() {
            console.log("Hello");
         }
      }
      `);
  });

  it("should extract a  class that implements an interface", async () => {
    const content = d`
    export interface MyFoo {
        bar(): number;
    }
    export class Foo implements MyFoo {
       constructor() {
        console.log("Hello");
       }
      
       bar() {
        return 1;
       }
    }
    `;

    const snippet = extractor.getClass(content, "Foo");
    expect(snippet).toBe(d`
    export class Foo implements MyFoo {
       constructor() {
        console.log("Hello");
       }
      
       bar() {
        return 1;
       }
    }
      `);
  });

  it("should extract a  generic class", async () => {
    const content = d`
    export interface MyFoo {
        bar(): number;
    }
    class Box<Type> {
      contents: Type;
      constructor(value: Type) {
        this.contents = value;
      }
    }
    `;

    const snippet = extractor.getClass(content, "Box");
    expect(snippet).toBe(d`
      class Box<Type> {
        contents: Type;
        constructor(value: Type) {
          this.contents = value;
        }
      }
      `);
  });
});

describe("TypeScript Snippet Extractor - Enums", () => {
  let extractor: SnippetExtractor;
  beforeEach(() => {
    extractor = createSnipperExtractor(createTypeScriptExtractorConfig());
  });

  it("should extract a basic enum", async () => {
    const content = d`
      enum Direction {
        Up,
        Down,
        Left,
        Right
      }
    `;

    const snippet = extractor.getEnum(content, "Direction");
    expect(snippet).toBe(d`
      enum Direction {
        Up,
        Down,
        Left,
        Right
      }
    `);
  });

  it("should extract an exported enum", async () => {
    const content = d`
      export enum Status {
        Active,
        Inactive
      }
    `;

    const snippet = extractor.getEnum(content, "Status");
    expect(snippet).toBe(d`
      export enum Status {
        Active,
        Inactive
      }
    `);
  });
});
