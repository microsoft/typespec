import type { JSONSchemaType } from "@typespec/compiler";
import { join } from "path";
import { beforeAll, describe, expect, it } from "vitest";
import { Position, TextDocument } from "vscode-languageserver-textdocument";
import { ConsoleLogLogger } from "../../src/log/console-log-listener.js";
import logger from "../../src/log/logger.js";
import schemaProvider from "../../src/typespec/schema-provider.js";
import { provideTspconfigCompletionItems } from "../../src/vscode/completion-item-provider.js";

describe("Test completion for tspconfig", () => {
  beforeAll(() => {
    logger.registerLogListener("test-log", new ConsoleLogLogger());
    schemaProvider.setTypeSpecConfigJsonSchema(TypeSpecConfigJsonSchema);
  });

  describe("Test completion items for root options", () => {
    const rootOptions = [
      "extends",
      "environment-variables",
      "parameters",
      "output-dir",
      "warn-as-error",
      "trace",
      "imports",
      "emit",
      "options",
      "linter",
    ];
    it.each([
      {
        config: `┆`,
        expected: rootOptions,
      },
      {
        config: `
┆
`,
        expected: rootOptions,
      },
      {
        config: `┆  `,
        expected: rootOptions,
      },
      {
        config: `┆options:`,
        expected: rootOptions,
      },
      {
        config: `opt┆ions:`,
        expected: rootOptions,
      },
      {
        config: `opt┆ions`,
        expected: rootOptions,
      },
      {
        config: `┆
options`,
        expected: rootOptions.filter((o) => o !== "options"),
      },
      {
        config: `emitters:
┆`,
        expected: rootOptions.filter((o) => o !== "emitters"),
      },
      {
        config: `emitters:
op┆tions:`,
        expected: rootOptions.filter((o) => o !== "emitters"),
      },
      {
        config: `emitters:
op┆tions`,
        expected: rootOptions.filter((o) => o !== "emitters"),
      },
    ])("Test $config", async ({ config, expected }) => {
      const [content, pos] = parseContentWithPosition(config);
      const doc = TextDocument.create("fake", "typespec", 1, content);

      const items = await provideTspconfigCompletionItems(doc, pos, join(__dirname, "./workspace"));
      expect(items).toHaveLength(expected.length);
      expect(items.map((i) => i.label).sort()).toEqual(expected.sort());
    });
  });

  describe("Test completion items for options and emitters", () => {
    it.each([
      {
        config: `emit:\n  - ┆`,
      },
      {
        config: `options:

  fak┆`,
      },
    ])("Test $config", async ({ config }) => {
      const [contentWithPos, pos] = parseContentWithPosition(config);
      const doc = TextDocument.create("fake", "typespec", 1, contentWithPos);

      const items = await provideTspconfigCompletionItems(doc, pos, join(__dirname, "./workspace"));
      expect(items).toHaveLength(1);
      expect(items[0].label).toBe("fake-emitter");
    });

    it.each([
      {
        config: `emitters:
  ┆`,
      },
      {
        config: `options:

  fak┆`,
      },
    ])("Test no emitter items for $config", async ({ config }) => {
      const [contentWithPos, pos] = parseContentWithPosition(config);
      const doc = TextDocument.create("fake", "typespec", 1, contentWithPos);

      const items = await provideTspconfigCompletionItems(doc, pos, "");
      expect(items).toHaveLength(0);
    });

    it.each([
      {
        config: `emitters:
        fake-emitter:
        ┆`,
      },
      {
        config: `options:
        ┆
        fake-emitter:
        someoption: "value"
        `,
      },
    ])("Test no other emitter items for $config", async ({ config }) => {
      const [contentWithPos, pos] = parseContentWithPosition(config);
      const doc = TextDocument.create("fake", "typespec", 1, contentWithPos);

      const items = await provideTspconfigCompletionItems(doc, pos, "");
      expect(items).toHaveLength(0);
    });
  });
});

function parseContentWithPosition(contentWithPosition: string): [string, Position] {
  const lines = contentWithPosition.split("\n");
  let pos: Position | undefined;
  for (let i = 0; i < lines.length; i++) {
    const c = lines[i].indexOf("┆");
    if (c !== -1) {
      lines[i] = lines[i].replace("┆", "");
      pos = { line: i, character: c };
      return [lines.join("\n"), pos];
    }
  }
  throw new Error("No position found");
}

const emitterOptionsSchema: JSONSchemaType<object> = {
  type: "object",
  additionalProperties: true,
  required: [],
  properties: {
    "emitter-output-dir": { type: "string", nullable: true } as any,
  },
};

const TypeSpecConfigJsonSchema: JSONSchemaType<object> = {
  type: "object",
  additionalProperties: false,
  properties: {
    extends: {
      type: "string",
      nullable: true,
    },
    "environment-variables": {
      type: "object",
      nullable: true,
      required: [],
      additionalProperties: {
        type: "object",
        properties: {
          default: { type: "string" },
        },
        required: ["default"],
      },
    },
    parameters: {
      type: "object",
      nullable: true,
      required: [],
      additionalProperties: {
        type: "object",
        properties: {
          default: { type: "string" },
        },
        required: ["default"],
      },
    },

    "output-dir": {
      type: "string",
      nullable: true,
    },
    "warn-as-error": {
      type: "boolean",
      nullable: true,
    },
    trace: {
      oneOf: [
        { type: "string" },
        {
          type: "array",
          items: { type: "string" },
        },
      ],
    } as any, // Issue with AJV optional property typing https://github.com/ajv-validator/ajv/issues/1664
    imports: {
      type: "array",
      nullable: true,
      items: { type: "string" },
    },
    emit: {
      type: "array",
      nullable: true,
      items: { type: "string" },
    },
    options: {
      type: "object",
      nullable: true,
      required: [],
      additionalProperties: emitterOptionsSchema,
    },
    emitters: {
      type: "object",
      nullable: true,
      deprecated: true,
      required: [],
      additionalProperties: {
        oneOf: [{ type: "boolean" }, emitterOptionsSchema],
      },
    },

    linter: {
      type: "object",
      nullable: true,
      required: [],
      additionalProperties: false,
      properties: {
        extends: {
          type: "array",
          nullable: true,
          items: { type: "string" },
        },
        enable: {
          type: "object",
          required: [],
          nullable: true,
          additionalProperties: { type: "boolean" },
        },
        disable: {
          type: "object",
          required: [],
          nullable: true,
          additionalProperties: { type: "string" },
        },
      },
    } as any, // ajv type system doesn't like the string templates
  },
};
