import { join } from "path";
import { beforeAll, describe, expect, it } from "vitest";
import { Position, TextDocument } from "vscode-languageserver-textdocument";
import { ConsoleLogLogger } from "../../src/log/console-log-listener.js";
import logger from "../../src/log/logger.js";
import { provideTspconfigCompletionItems } from "../../src/vscode/completion-item-provider.js";

describe("Test completion for tspconfig", () => {
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

  beforeAll(() => {
    logger.registerLogListener("test-log", new ConsoleLogLogger());
  });

  describe("Test completion items for root options", () => {
    it.each([
      {
        config: `┆`,
        expected: rootOptions,
      },
      {
        config: `\n┆\n`,
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
        config: `┆\noptions`,
        expected: rootOptions.filter((o) => o !== "options"),
      },
      {
        config: `emit:\n┆`,
        expected: rootOptions.filter((o) => o !== "emit"),
      },
      {
        config: `warn-as-error:\nop┆tions:`,
        expected: rootOptions.filter((o) => o !== "warn-as-error"),
      },
      {
        config: `warn-as-error: true\n┆`,
        expected: rootOptions.filter((o) => o !== "warn-as-error"),
      },
      {
        config: `trace:\n  - "verbose"\nop┆tions`,
        expected: rootOptions.filter((o) => o !== "trace"),
      },
    ])("#%# Test root: $config", async ({ config, expected }) => {
      await checkCompletionItems(config, join(__dirname, "./workspace"), expected);
    });
  });

  describe("Test completion items for options and emitters", () => {
    it.each([
      {
        config: `emit:\n  - ┆`,
        expected: ["fake-emitter"],
      },
      {
        config: `options:\n\n  fak┆`,
        expected: ["fake-emitter"],
      },
    ])("#%# Test emitters: $config", async ({ config, expected }) => {
      await checkCompletionItems(config, join(__dirname, "./workspace"), expected);
    });

    it.each([
      {
        config: `emit:\n  - ┆`,
        expected: [],
      },
      {
        config: `options:\n\n  fak┆`,
        expected: [],
      },
    ])("#%# Test no emitter items: $config", async ({ config }) => {
      await checkCompletionItems(config, "", []);
    });

    it.each([
      {
        config: `emit:\n  - fake-emitter:\n      ┆`,
        expected: [],
      },
      {
        config: `options:\n  ┆\n  fake-emitter:\n    someoption: "value"\n`,
        expected: [],
      },
    ])("#%# Test no emitter options: $config", async ({ config, expected }) => {
      await checkCompletionItems(config, "", expected);
    });
  });

  describe("Test completion items for emitters options", () => {
    it.each([
      {
        config: `options:\n  fake-emitter:\n    ┆`,
        expected: [
          "target-name",
          "is-valid",
          "type",
          "emitter-output-dir",
          "options",
          "options-b",
          "options-arr-obj",
          "options-arr-boolean",
        ],
      },
      {
        config: `options:\n  fake-emitter:\n    target-name: ┆`,
        expected: [],
      },
      {
        config: `options:\n  fake-emitter:\n    target-name: "fak┆e"`,
        expected: [],
      },
      {
        config: `options:\n  fake-emitter:\n    target-name: "fake"\n    is-valid: ┆`,
        expected: ["true", "false"],
      },
      {
        config: `options:\n  fake-emitter:\n    target-name: "fake"\n    i┆`,
        expected: [
          "is-valid",
          "type",
          "emitter-output-dir",
          "options",
          "options-b",
          "options-arr-obj",
          "options-arr-boolean",
        ],
      },
      {
        config: `options:\n  fake-emitter:\n    target-name: "fake"\n    is-valid: true\n    ┆`,
        expected: [
          "type",
          "emitter-output-dir",
          "options",
          "options-b",
          "options-arr-obj",
          "options-arr-boolean",
        ],
      },
      {
        config: `options:\n  fake-emitter:\n    target-name: "fake"\n    is-valid: true\n    type: ┆`,
        expected: ["a", "b", "c"],
      },
    ])("#%# Test emitter options: $config", async ({ config, expected }) => {
      await checkCompletionItems(config, join(__dirname, "./workspace"), expected);
    });
  });

  describe("Test completion items for warn-as-error", () => {
    it.each([
      {
        config: `warn-as-error: ┆`,
        expected: ["true", "false"],
      },
      {
        config: `extends:\nwarn-as-error: t┆`,
        expected: ["true", "false"],
      },
      {
        config: `parameters:\n  p:"value"\n\nwarn-as-error: f┆`,
        expected: ["true", "false"],
      },
      {
        config: `warn-as-error: true\n  ┆`,
        expected: [],
      },
    ])("#%# Test wae: $config", async ({ config, expected }) => {
      await checkCompletionItems(config, join(__dirname, "./workspace"), expected);
    });
  });

  describe("Test completion items for linter", () => {
    it.each([
      {
        config: `linter:\n  ┆`,
        expected: ["extends", "enable", "disable"],
      },
      {
        config: `linter:\n  extends:\n  ┆`,
        expected: ["enable", "disable"],
      },
      {
        config: `linter:\n  ┆\n  enable:`,
        expected: ["extends", "disable"],
      },
      {
        config: `linter:\n  enable:\n    linter-one: ┆`,
        expected: ["true", "false"],
      },
      {
        config: `linter:\n  enable:\n    linter-one┆:`,
        expected: [],
      },
      {
        config: `linter:\n  disable:\n    linter-one: true\n    ┆`,
        expected: [],
      },
      {
        config: `linter:\n  disable:\n    linter-one: true\n    linter-two: ┆`,
        expected: [],
      },
    ])("#%# Test linter: $config", async ({ config, expected }) => {
      await checkCompletionItems(config, join(__dirname, "./workspace"), expected);
    });
  });

  describe("Test completion items for additionalProperties", () => {
    it.each([
      {
        config: `environment-variables:\n  my-var:\n    ┆`,
        expected: ["default"],
      },
      {
        config: `environment-variables:\n  ┆`,
        expected: [],
      },
      {
        config: `environment-variables:\nparameters:\n  my-param:\n    ┆`,
        expected: ["default"],
      },
      {
        config: `environment-variables:\nparameters:\n  my-param: ┆`,
        expected: [],
      },
    ])("#%# Test addProp: $config", async ({ config, expected }) => {
      await checkCompletionItems(config, join(__dirname, "./workspace"), expected);
    });
  });

  describe("Test completion items with comments", () => {
    it.each([
      {
        config: `#this is a comment\n┆`,
        expected: rootOptions,
      },
      {
        config: `┆\n#this is a comment`,
        expected: rootOptions,
      },
      {
        config: `linter:\n  ┆#this is a comment`,
        expected: ["extends", "enable", "disable"],
      },
      {
        config: `linter:\n  extends: "value"\n  ┆#this is a comment`,
        expected: ["enable", "disable"],
      },
      {
        config: `linter:\n  extends: "value"  #this ┆ is a comment`,
        expected: [],
      },
      {
        config: `linter:\n  exten  #this ┆ is a comment`,
        expected: [],
      },
      {
        config: `linter:\n  ex ┆ #this is a comment`,
        expected: [],
      },
      {
        config: `linter:\n  ex┆ #this is a comment`,
        expected: ["extends", "enable", "disable"],
      },
      {
        config: `#this is a comment\nlinter┆`,
        expected: rootOptions,
      },
    ])("#%# Test comment: $config", async ({ config, expected }) => {
      await checkCompletionItems(config, join(__dirname, "./workspace"), expected);
    });
  });

  describe("Test completion items in complex scenario", () => {
    it.each([
      {
        config: `options:\n  fake-emitter:\n    target-name: "fake"\n    is-valid: true\n    type: a\n    options:\n      ┆`,
        expected: ["propA", "propB", "propC"],
      },
      {
        config: `options:\n  fake-emitter:\n    target-name: "fake"\n    is-valid: true\n    type: a\n    options:\n      prop┆`,
        expected: ["propA", "propB", "propC"],
      },
      {
        config: `options:\n  fake-emitter:\n    target-name: "fake"\n    is-valid: true\n    type: a\n    options:\n      propA: ┆`,
        expected: [],
      },
      {
        config: `options:\n  fake-emitter:\n    target-name: "fake"\n    is-valid: true\n    type: a\n    options:\n      propA:\n      propB: ┆`,
        expected: ["true", "false", "valueB1", "valueB2"],
      },
      {
        config: `options:\n  fake-emitter:\n    target-name: "fake"\n    is-valid: true\n    type: a\n    options:\n      propC: ┆`,
        expected: [],
      },
      {
        config: `options:\n  fake-emitter:\n    target-name: "fake"\n    is-valid: true\n    type: a\n    options:\n      propC:\n        ┆`,
        expected: ["propC-one", "propC-two"],
      },
      {
        config: `options:\n  fake-emitter:\n    target-name: "fake"\n    is-valid: true\n    type: a\n    options:\n      propC:\n        propC-one:┆`,
        expected: ["true", "false"],
      },
      {
        config: `options:\n  fake-emitter:\n    target-name: "fake"\n    is-valid: true\n    type: a\n    options:\n      propC:\n        propC-two:┆`,
        expected: ["valueC1", "valueC2"],
      },
      {
        config: `options:\n  fake-emitter:\n    target-name: "fake"\n    is-valid: true\n    type: a\n    options:\n      propC:\n        propC-two:┆\n`,
        expected: ["valueC1", "valueC2"],
      },
      {
        config: `options:\n  fake-emitter:\n    target-name: "fake"\n    is-valid: true\n    type: a\n    options:\n      new-option:\n        ┆`,
        expected: ["addProp"],
      },
      {
        config: `options:\n  fake-emitter:\n    target-name: "fake"\n    is-valid: true\n    type: a\n    options:\n      new-option:\n        addProp:┆`,
        expected: ["true", "false"],
      },
      {
        config: `options:\n  fake-emitter:\n    target-name: "fake"\n    is-valid: true\n    type: a\n    options-b:\n      new-option: ┆`,
        expected: ["true", "false"],
      },
      {
        config: `options:\n  fake-emitter:\n    target-name: "fake"\n    is-valid: true\n    type: a\n    options-arr-obj:\n      - ┆`,
        expected: ["arr-propA", "arr-propB"],
      },
      {
        config: `options:\n  fake-emitter:\n    target-name: "fake"\n    is-valid: true\n    type: a\n    options-arr-obj:\n      - \n        ┆`,
        expected: [],
      },
      {
        config: `options:\n  fake-emitter:\n    target-name: "fake"\n    is-valid: true\n    type: a\n    options-arr-obj:\n      - arr-propA┆`,
        expected: ["arr-propA", "arr-propB"],
      },
      {
        config: `options:\n  fake-emitter:\n    target-name: "fake"\n    is-valid: true\n    type: a\n    options-arr-obj:\n      - arr-propA\n        ┆`,
        expected: [],
      },
      {
        config: `options:\n  fake-emitter:\n    target-name: "fake"\n    is-valid: true\n    type: a\n    options-arr-obj:\n      - arr-propA:\n        ┆`,
        expected: ["arr-propB"],
      },
      {
        config: `options:\n  fake-emitter:\n    target-name: "fake"\n    is-valid: true\n    type: a\n    options-arr-obj:\n      - arr-propA:\n          ┆`,
        expected: ["arr-propA-one", "arr-propA-two"],
      },
      {
        config: `options:\n  fake-emitter:\n    target-name: "fake"\n    is-valid: true\n    type: a\n    options-arr-obj:\n      - arr-propA:\n          arr-propA-one: ┆`,
        expected: ["true", "false"],
      },
      {
        config: `options:\n  fake-emitter:\n    target-name: "fake"\n    is-valid: true\n    type: a\n    options-arr-obj:\n      - arr-propA:\n          arr-propA-one: \n\n        ┆`,
        expected: ["arr-propB"],
      },
      {
        config: `options:\n  fake-emitter:\n    target-name: "fake"\n    is-valid: true\n    type: a\n    options-arr-boolean:\n      - ┆`,
        expected: ["true", "false"],
      },
    ])("#%# Test Complex: $config", async ({ config, expected }) => {
      await checkCompletionItems(config, join(__dirname, "./workspace"), expected);
    });
  });
});

async function checkCompletionItems(
  configWithPosition: string,
  packageJsonFolder: string,
  expected: string[],
) {
  const [content, pos] = parseContentWithPosition(configWithPosition);
  const doc = TextDocument.create("fake", "typespec", 1 /*version*/, content);

  const items = await provideTspconfigCompletionItems(doc, pos, packageJsonFolder);
  logger.debug(`verify result for ${configWithPosition}`);
  expect(items.map((i) => i.label).sort()).toEqual(expected.sort());
}

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
