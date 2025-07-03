import { d } from "@alloy-js/core/testing";
import { beforeAll, describe, expect, it } from "vitest";
import { getExcerptForQuery, parseCodeBlockHeading } from "./code-block-expectation.js";
import {
  createSnippetExtractor,
  createTypeScriptExtractorConfig,
  type SnippetExtractor,
} from "./snippet-extractor.js";

describe("parseCodeBlockHeading", () => {
  it("parse whole file expectation", () => {
    expect(parseCodeBlockHeading("ts path/to/file.ts")).toEqual({
      lang: "ts",
      file: "path/to/file.ts",
    });
  });

  it("throws error when no file is provided", () => {
    expect(() => parseCodeBlockHeading("ts")).toThrow(
      'Invalid code block heading: "ts". Missing file path. Expected format: "<lang> <path>"',
    );
  });

  it("parse parse with type and name", () => {
    expect(parseCodeBlockHeading("ts path/to/file.ts interface foo")).toEqual({
      lang: "ts",
      file: "path/to/file.ts",
      query: {
        type: "interface",
        name: "foo",
      },
    });
  });

  it("throws error when using type but no name is provided", () => {
    expect(() => parseCodeBlockHeading("ts path/to/file.ts interface")).toThrow(
      'Invalid code block heading: "ts path/to/file.ts interface". Missing name when using type. Expected format: "<lang> <path> [type] [name]"',
    );
  });
});

describe("getExcerptForQuery", () => {
  let snippetExtractor: SnippetExtractor;
  beforeAll(async () => {
    const tsExtractorConfig = await createTypeScriptExtractorConfig();
    snippetExtractor = createSnippetExtractor(tsExtractorConfig);
  });

  it("gets a whole file", async () => {
    const expectation = {
      lang: "ts",
      file: "file.ts",
    };
    const outputs = {
      "file.ts": d`
        interface bar {
        
        }
        interface foo {
          bar: string;
        }      
      `,
    };
    const excerpt = getExcerptForQuery(snippetExtractor, expectation, outputs);
    expect(excerpt).toBe(outputs["file.ts"]);
  });

  it("gets an interface for typescript", async () => {
    const expectation = {
      lang: "ts",
      file: "file.ts",
      query: {
        type: "interface",
        name: "foo",
      },
    };
    const outputs = {
      "file.ts": d`
        interface bar {
        
        }

        interface foo {
          bar: string;
        }
      `,
    };
    const excerpt = getExcerptForQuery(snippetExtractor, expectation, outputs);
    expect(excerpt).toBe(d`
      interface foo {
        bar: string;
      }
    `);
  });
});
