import { resolve } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { createTypekitDocs } from "../../src/ref-doc/components/typekits-file.js";
import { createTypekitCollection } from "../../src/ref-doc/typekit-model.js";
import { readPackageJson } from "../../src/ref-doc/utils/misc.js";

it("renders wrapped typekit documentation as paragraphs", async () => {
  const files = await createTypekitDocs({
    namespaces: {
      test: {
        kind: "namespace",
        name: "test",
        typeName: "TestKit",
        doc: "First line\ncontinues here.\n\nSecond paragraph\ncontinues too.",
        entries: {},
      },
    },
  });

  expect(files["typekits.mdx"]).toContain(
    "First line continues here.\n\nSecond paragraph continues too.",
  );
});

describe("TypeDoc typekit extraction", () => {
  let output: string;
  beforeAll(async () => {
    const libraryPath = resolve(import.meta.dirname, "fixtures/typekit");
    const collection = await createTypekitCollection(
      libraryPath,
      await readPackageJson(libraryPath),
    );
    expect(collection).toBeDefined();
    output = (await createTypekitDocs(collection!))["typekits.mdx"];
  });

  it("preserves documentation, optional parameters, and multiline examples", () => {
    expect(output).toContain("A kit with wrapped summary text.\n\nAnother paragraph.");
    expect(output).toContain("Run a task using {@link SubKit | nested helpers}.");
    expect(output).toContain("The default value.");
    expect(output).toContain("@param input - The input to process.");
    expect(output).toContain("@returns Whether the task succeeded.");
    expect(output).toContain(' * const result = run("hello", {\n *   enabled: true,\n * });');
    expect(output).toMatch(
      /run\(\s*input: string,\s*options\?: \{\s*enabled\?: boolean;?\s*\}\s*\): boolean;/,
    );
  });

  it("renders getters, nested kits, and rest parameters", () => {
    expect(output).toContain("$(program).test.value: string;");
    expect(output).toContain("$(program).test.nested.collect(...values: string[]): string[];");
    expect(output).toContain("@param input - The input to check.");
    expect(output).toContain("$(program).test.size(input: string): number;");
    expect(output).toContain("$(program).test.inline.check(input: string): boolean;");
  });

  it("renders both diagnosable call forms without parsing signature text", () => {
    expect(output).toContain("@param input - The input to resolve.");
    expect(output).toContain(
      "$(program).test.diagnose(input: string, strict?: boolean): string | undefined;",
    );
    expect(output).toMatch(
      /\$\(program\)\.test\.diagnose\.withDiagnostics\(\s*input: string,\s*strict\?: boolean\s*\): \[string \| undefined, readonly Diagnostic\[\]\];/,
    );
    expect(output).toContain("$(program).test.generic<T extends string>(input: T): T | undefined;");
    expect(output).toContain(
      "$(program).test.generic.withDiagnostics<T extends string>(input: T): [T | undefined, readonly Diagnostic[]];",
    );
  });
});
