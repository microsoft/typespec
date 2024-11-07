import { join } from "path";
import { describe, expect, it } from "vitest";
import { CompletionList } from "vscode-languageserver/node.js";
import { createTestServerHost, extractCursor } from "../../src/testing/test-server-host.js";

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
    await checkCompletionItems(config, true, expected);
  });
});

describe("Test completion items for options and emitters", () => {
  it.each([
    {
      config: `emit:\n  - ┆`,
      expected: ["fake-emitter", "fake-emitter-no-schema"],
    },
    {
      config: `options:\n\n  fak┆`,
      expected: ["fake-emitter", "fake-emitter-no-schema"],
    },
  ])("#%# Test emitters: $config", async ({ config, expected }) => {
    await checkCompletionItems(config, true, expected);
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
    await checkCompletionItems(config, false, []);
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
    await checkCompletionItems(config, false, expected);
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
      config: `options:\n  fake-emitter:\n  fake-emitter-no-schema: \n    ┆`,
      expected: ["emitter-output-dir"],
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
    await checkCompletionItems(config, true, expected, "./subfolder/tspconfig.yaml");
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
    await checkCompletionItems(config, true, expected);
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
    await checkCompletionItems(config, true, expected);
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
    await checkCompletionItems(config, true, expected);
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
    await checkCompletionItems(config, true, expected);
  });
});

describe("Test completion items in complex scenario", () => {
  it.each([
    {
      config: `options:\n  fake-emitter:\n    target-name: "fake"\n    is-valid: true\n    type: a\n    options:\n      ┆\nwarn-as-error: true`,
      expected: ["propA", "propB", "propC"],
    },
    {
      config: `options:\n  fake-emitter:\n    target-name: "fake"\n    is-valid: true\n    type: a\n    options:\n      prop┆ \n    some-option: "value"`,
      expected: ["propA", "propB", "propC"],
    },
    {
      config: `options:\n  fake-emitter:\n    target-name: "fake"\n    is-valid: true\n    type: a\n    options:\n      propA: ┆\n\nemit:\n  - fake-emitter2`,
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
      config: `options:\n  fake-emitter:\n    target-name: "fake"\n    is-valid: true\n    type: a\n    options-arr-obj:\n      - arr-propA:\n      - ┆`,
      expected: ["arr-propA", "arr-propB"],
    },
    {
      config: `options:\n  fake-emitter:\n    target-name: "fake"\n    is-valid: true\n    type: a\n    options-arr-obj:\n      - arr-propA:\n          ┆\n`,
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
    await checkCompletionItems(config, true, expected);
  });
});

describe("Test package cache cleared properly", () => {
  it("should clear the cache when the file is updated", async () => {
    const { source, pos } = extractCursor(`emit:\n  - ┆`);
    const testHost = await createTestServerHost(undefined);
    const workspaceFolder = join(__dirname, "./workspace");
    await testHost.addRealFolder("./workspace", workspaceFolder);
    const textDocument = testHost.addOrUpdateDocument("./workspace/tspconfig.yaml", source);
    const { items } = await testHost.server.complete({
      textDocument,
      position: textDocument.positionAt(pos),
    });
    const expected = ["fake-emitter", "fake-emitter-no-schema"];
    expect(items.map((i) => i.label).sort()).toEqual(expected.sort());

    const oldFile = await testHost.compilerHost.readFile("./workspace/package.json");
    const changed = oldFile.text.replace(
      "fake-emitter-no-schema",
      "fake-emitter-no-schema-not-exist",
    );
    await testHost.compilerHost.writeFile("./workspace/package.json", changed);
    const changedPackageUrl = testHost.getURL("./workspace/package.json")!;
    testHost.server.watchedFilesChanged({
      changes: [{ uri: changedPackageUrl, type: 2 }],
    });

    const { items: items2 } = await testHost.server.complete({
      textDocument,
      position: textDocument.positionAt(pos),
    });
    const expected2 = ["fake-emitter"];
    expect(items2.map((i) => i.label).sort()).toEqual(expected2.sort());
  });
});

async function checkCompletionItems(
  configWithPosition: string,
  includeWorkspace: boolean,
  expected: string[],
  tspconfigPathUnderWorkspace: string = "./tspconfig.yaml",
) {
  const items = (await complete(configWithPosition, includeWorkspace, tspconfigPathUnderWorkspace))
    .items;
  expect(items.map((i) => i.label).sort()).toEqual(expected.sort());
}

async function complete(
  sourceWithCursor: string,
  includeWorkspace: boolean,
  tspconfigPathUnderWorkspace: string,
): Promise<CompletionList> {
  const { source, pos } = extractCursor(sourceWithCursor);
  const testHost = await createTestServerHost(undefined);
  if (includeWorkspace) {
    const workspaceFolder = join(__dirname, "./workspace");
    await testHost.addRealFolder("./workspace", workspaceFolder);
  }
  const textDocument = testHost.addOrUpdateDocument(
    join("./workspace", tspconfigPathUnderWorkspace),
    source,
  );
  return await testHost.server.complete({
    textDocument,
    position: textDocument.positionAt(pos),
  });
}
