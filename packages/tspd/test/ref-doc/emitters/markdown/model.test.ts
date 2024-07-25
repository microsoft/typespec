import { ok } from "assert";
import { describe, expect, it } from "vitest";
import { renderMarkdowDoc } from "../../../../src/ref-doc/utils/markdown.js";
import { createMarkdownRenderer } from "../../../test-utils.js";

async function renderModel(code: string) {
  const { renderer, refDoc } = await createMarkdownRenderer(`namespace Lib; ${code}`);
  const fooModel = refDoc.namespaces[0].models.find((x) => x.name === "Test");
  ok(fooModel, "Expected a model named `Test`");
  return renderMarkdowDoc(renderer.model(fooModel));
}

it("render simple model", async () => {
  const result = await renderModel(`model Test {}`);
  expect(result).toEqual(
    [
      "# `Test`",
      "",
      "",
      "```typespec",
      "model Lib.Test",
      "```",
      "",
      "",
      "## Properties",
      "None",
    ].join("\n")
  );
});

it("render deprecation notice", async () => {
  const result = await renderModel(`
    #deprecated "Use something else"
    model Test {}`);
  expect(result).toEqual(
    [
      "# `Test`",
      "_Deprecated: Use something else_",
      "",
      "",
      "```typespec",
      "model Lib.Test",
      "```",
      "",
      "",
      "## Properties",
      "None",
    ].join("\n")
  );
});

it("render model with template parameter", async () => {
  const result = await renderModel(`model Test<T> {}`);
  expect(result).toEqual(
    [
      "# `Test`",
      "",
      "",
      "```typespec",
      "model Lib.Test<T>",
      "```",
      "",
      "## Template Parameters",
      "| Name | Description |",
      "|------|-------------|",
      "| T |  |",
      "",
      "",
      "## Properties",
      "None",
    ].join("\n")
  );
});

describe("model examples", () => {
  it("render single example", async () => {
    const result = await renderModel(`
    /**
     * @example
     * \`\`\`tsp
     * model Foo {test: Test}
     * \`\`\`
     */
    model Test {}
  `);
    expect(result).toEqual(
      [
        "# `Test`",
        "",
        "",
        "",
        "```typespec",
        "model Lib.Test",
        "```",
        "",
        "## Examples",
        "",
        "```tsp",
        "model Foo {test: Test}",
        "```",
        "",
        "## Properties",
        "None",
      ].join("\n")
    );
  });

  it("render named example", async () => {
    const result = await renderModel(`
    /**
     * @example First Example
     * \`\`\`tsp
     * model Foo {test1: Test}
     * \`\`\`
     * @example Second Example
     * \`\`\`tsp
     * model Foo {test2: Test}
     * \`\`\`
     */
    model Test {}
  `);
    expect(result).toEqual(
      [
        "# `Test`",
        "",
        "",
        "",
        "```typespec",
        "model Lib.Test",
        "```",
        "",
        "## Examples",
        "### First Example",
        "",
        "```tsp",
        "model Foo {test1: Test}",
        "```",
        "",
        "### Second Example",
        "",
        "```tsp",
        "model Foo {test2: Test}",
        "```",
        "",
        "## Properties",
        "None",
      ].join("\n")
    );
  });
});

describe("properties table", () => {
  const common = [
    "# `Test`",
    "",
    "",
    "```typespec",
    "model Lib.Test",
    "```",
    "",
    "",
    "## Properties",
    "| Name | Type | Description |",
    "|------|------|-------------|",
  ];
  async function expectTable({ code, rows }: { code: string; rows: string[] }) {
    const result = await renderModel(code);
    expect(result).toEqual([...common, ...rows].join("\n"));
  }
  it("render properties without docs", async () => {
    await expectTable({
      code: `model Test { name: string, other: int32 }`,
      rows: ["| name | `string` |  |", "| other | `int32` |  |"],
    });
  });

  it("render deprecated properties", async () => {
    await expectTable({
      code: `model Test { 
        #deprecated "Use other"
        name: string, 
        other: int32
      }`,
      rows: ["| ~~name~~ _DEPRECATED_ | `string` |  |", "| other | `int32` |  |"],
    });
  });

  it("render enum properties", async () => {
    await expectTable({
      code: `
        model Test { name: Bar.baz } 
        enum Bar { baz }
      `,
      rows: ["| name | `Bar.baz` |  |"],
    });
  });

  it("render array properties", async () => {
    await expectTable({
      code: `
        model Test { name: string[] } 
      `,
      rows: ["| name | `string[]` |  |"],
    });
  });

  it("render properties with documentation", async () => {
    await expectTable({
      code: `model Test { 
        /** name of the test */
        name: string;
        /** other of the test */
        other: int32;
      }`,
      rows: ["| name | `string` | name of the test |", "| other | `int32` | other of the test |"],
    });
  });

  it("render optional properties", async () => {
    await expectTable({
      code: `model Test { name?: string, other: int32 }`,
      rows: ["| name? | `string` |  |", "| other | `int32` |  |"],
    });
  });

  it("render link to local type", async () => {
    await expectTable({
      code: `model Test { other: Other } model Other {name: string}`,
      rows: ["| other | [`Other`](#other) |  |"],
    });
  });

  it("render indexer", async () => {
    await expectTable({
      code: `model Test is Record<string> { name: string }`,
      rows: ["| name | `string` |  |", "|  | `string` | Additional properties |"],
    });
  });

  it("flatten nested anonymous model", async () => {
    await expectTable({
      code: `model Test { name: string, nested: {val: string, age: int32, third?: boolean} }`,
      rows: [
        "| name | `string` |  |",
        "| nested | `{...}` |  |",
        "| nested.val | `string` |  |",
        "| nested.age | `int32` |  |",
        "| nested.third? | `boolean` |  |",
      ],
    });
  });
});
