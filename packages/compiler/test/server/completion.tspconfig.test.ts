import { join } from "path";
import { describe, expect, it } from "vitest";
import { CompletionList } from "vscode-languageserver/node.js";
import { createTestServerHost, extractCursor } from "../../src/testing/test-server-host.js";
import { resolveVirtualPath } from "../../src/testing/test-utils.js";

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
      expected: ['"fake-emitter"', '"fake-emitter-no-schema"'],
    },
    {
      config: `emit:\n  - "┆"`,
      expected: ["fake-emitter", "fake-emitter-no-schema"],
    },
    {
      config: `emit:\n  - "┆`,
      expected: ["fake-emitter", "fake-emitter-no-schema"],
    },
    {
      config: `emit:\n  - '┆`,
      expected: ["fake-emitter", "fake-emitter-no-schema"],
    },
    {
      config: `emit:\n  - '┆'`,
      expected: ["fake-emitter", "fake-emitter-no-schema"],
    },
    {
      config: `options:\n\n  fak┆`,
      expected: ['"fake-emitter"', '"fake-emitter-no-schema"'],
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
    await checkCompletionItems(config, true, expected, false, "./subfolder/tspconfig.yaml");
  });
});

describe("Test whether the completion items description of the emitters options is optional or required", () => {
  it.each([
    {
      config: `options:\n  fake-emitter:\n    ┆`,
      expected: [
        "[required]\nThe name of the target to emit to.", //"target-name",
        "[optional]\nWhether the target is valid.", //"is-valid",
        "[required]\n", //"type",
        "[optional]\n", //"emitter-output-dir",
        "[optional]\n", //"options",
        "[optional]\n", //"options-b",
        "[optional]\n", //"options-arr-obj",
        "[optional]\n", //"options-arr-boolean",
      ],
    },
  ])("#%# Test emitter options: $config", async ({ config, expected }) => {
    await checkCompletionItems(config, true, expected, true, "./subfolder/tspconfig.yaml");
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
      config: `linter:\n  extends:\n    - "┆`,
      expected: ["fake-linter-no-schema", "fake-linter/recommended", "fake-linter"],
    },
    {
      config: `linter:\n  extends:\n    - "fake-linter/recommended"\n    - "┆`,
      expected: ["fake-linter-no-schema", "fake-linter"],
    },
    {
      config: `linter:\n  extends:\n    - "fake-linter"\n  enable:\n    "┆`,
      expected: ["fake-linter/casing", "fake-linter/no-model-doc", "fake-linter/testing"],
    },
    {
      config: `linter:\n  extends:\n    - "fake-linter/recommended"\n  enable:\n    "┆`,
      expected: ["fake-linter/casing", "fake-linter/no-model-doc", "fake-linter/testing"],
    },
    {
      config: `linter:\n  extends:\n    - "fake-linter/recommended"\n  disable:\n    "┆`,
      expected: ["fake-linter/casing", "fake-linter/no-model-doc", "fake-linter/testing"],
    },
    {
      config: `linter:\n  extends:\n    - "fake-linter/recommended"\n    - "fake-linter-no-schema"\n  enable:\n    "┆`,
      expected: ["fake-linter/casing", "fake-linter/no-model-doc", "fake-linter/testing"],
    },
    {
      config: `linter:\n  extends:\n    - "fake-linter/recommended"\n  enable:\n    "fake-linter/casing": true\n  disable:\n    "┆`,
      expected: ["fake-linter/casing", "fake-linter/no-model-doc", "fake-linter/testing"],
    },
    {
      config: `linter:\n  extends:\n    - "fake-linter-no-schema"    - "fake-linter/recommended"┆`,
      expected: [],
    },
    {
      config: `linter:\n  extends:\n  enable:    "fak┆e"`,
      expected: [],
    },
    {
      config: `linter:\n  extends:\n    - "fake-linter-no-schema"    - "fake"┆`,
      expected: [],
    },
  ])("#%# Test emitter options: $config", async ({ config, expected }) => {
    await checkCompletionItems(config, true, expected, false, "./subfolder/tspconfig.yaml");
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

describe("Test completion items that use parameters and environment variables and built-in variables", () => {
  it.each([
    {
      config: `environment-variables:\n  BASE_DIR:\n    default: "{cwd}"\n  test-env:\n    default: ""\noutput-dir: "{env.┆}"`,
      expected: ["BASE_DIR", "test-env"],
    },
    {
      config: `environment-variables:\n  BASE_DIR:\n    default: "{cwd}"\n  test-env:\n    default: ""\noutput-dir: "{  env.┆}"`,
      expected: ["BASE_DIR", "test-env"],
    },
    {
      config: `environment-variables:\n  BASE_DIR:\n    default: "{cwd}"\n  test-env:\n    default: ""\noutput-dir: "outdir/{env.┆}"`,
      expected: ["BASE_DIR", "test-env"],
    },
    {
      config: `environment-variables:\n  BASE_DIR:\n    default: "{cwd}"\n  test-env:\n    default: ""\noutput-dir: "outdir/{env.┆}/myDir"`,
      expected: ["BASE_DIR", "test-env"],
    },
    {
      config: `environment-variables:\n  BASE_DIR:\n    default: "{cwd}"\n  test-env:\n    default: ""\noutput-dir: "{}env.┆}"`,
      expected: [],
    },
    {
      config: `environment-variables:\n  BASE_DIR:\n    default: "{cwd}"\n  test-env:\n    default: ""\noutput-dir: "outdir/{env.}/my┆Dir"`,
      expected: [],
    },
    {
      config: `environment-variables:\n  BASE_DIR:\n    default: "{cwd}"\n  test-env:\n    default: ""\noutput-dir: "{ abcenv.┆}"`,
      expected: ["cwd", "project-root"],
    },
    {
      config: `environment-variables:\n  BASE_DIR:\n    default: "{cwd}"\n  test-env:\n    default: ""\noutput-dir: ┆"{ env.}"`,
      expected: [],
    },
    {
      config: `parameters:\n  base-dir:\n    default: "{cwd}"\n  test-param:    default: ""\noutput-dir: "{┆}"`,
      expected: ["cwd", "project-root", "base-dir", "test-param"],
    },
    {
      config: `parameters:\n  base-dir:\n    default: "{cwd}"\n  test-param:    default: ""\noutput-dir: "{cw┆}"`,
      expected: ["cwd", "project-root", "base-dir", "test-param"],
    },
    {
      config: `environment-variables:\n  BASE_DIR:\n    default: "{cwd}"\n  test-env:\n    default: ""\nparameters:\n  base-dir:\n    default: "{cwd}"\n  test-param:    default: ""\noutput-dir: "{env.┆}"`,
      expected: ["BASE_DIR", "test-env"],
    },
    {
      config: `parameters:\n  base-dir:\n    default: "{cwd}"\n  test-param:    default: ""\noutput-dir: "test/{cw┆}"`,
      expected: ["cwd", "project-root", "base-dir", "test-param"],
    },
    {
      config: `parameters:\n  base-dir:\n    default: "{cwd}"\n  test-param:    default: ""\noutput-dir: "outDir/{cw┆}/myDir"`,
      expected: ["cwd", "project-root", "base-dir", "test-param"],
    },
    {
      config: `parameters:\n  base-dir:\n    default: "{cwd}"\n  test-param:    default: ""\noptions:\n  emitter-sub-folder:\n    sub-folder: "{cw┆}/myDir"`,
      expected: ["cwd", "project-root", "base-dir", "test-param", "output-dir", "emitter-name"],
    },
    {
      config: `parameters:\n  base-dir:\n    default: "{cwd}"\n  test-param:    default: ""\noutput-dir: "{env.┆}"`,
      expected: [],
    },
    {
      config: `parameters:\n  base-dir:\n    default: "{cwd}"\n  test-param:    default: ""\noutput-dir: "{}┆"`,
      expected: [],
    },
    {
      config: `parameters:\n  base-dir:\n    default: "{cwd}"\n  test-param:    default: ""\noutput-dir: ┆"{}"`,
      expected: [],
    },
  ])("#%# Test addProp: $config", async ({ config, expected }) => {
    await checkCompletionItems(config, false, expected);
  });
});

describe("Test completion items for extends", () => {
  const path = resolveVirtualPath("workspace");
  it.each([
    {
      config: `extends:  "┆`,
      expected: ["tspconfigtest0.yaml", "demo_yaml", "demo_tsp"],
    },
    {
      config: `extends:  "./┆`,
      expected: ["tspconfigtest0.yaml", "demo_yaml", "demo_tsp"],
    },
    {
      config: `extends:  "./demo_yaml┆"`,
      expected: ["tspconfigtest2.yaml"],
    },
    {
      config: `extends:  "${path}┆"`,
      expected: ["tspconfigtest0.yaml", "demo_yaml", "demo_tsp"],
    },
    {
      config: `extends:  \n┆`,
      expected: [
        "emit",
        "environment-variables",
        "imports",
        "linter",
        "options",
        "output-dir",
        "parameters",
        "trace",
        "warn-as-error",
      ],
    },
    {
      config: `extends:  "./demo┆"`,
      expected: [],
    },
    {
      config: `extends:  "./tspconfigtest0.yaml"┆`,
      expected: [],
    },
    {
      config: `extends:  "./┆demo"`,
      expected: [],
    },
    {
      config: `extends:  "${path}/demo┆"`,
      expected: [],
    },
  ])("#%# Test addProp: $config", async ({ config, expected }) => {
    await checkCompletionItems(config, true, expected);
  });
});

describe("Test completion items for imports", () => {
  const path = resolveVirtualPath("workspace/");
  it.each([
    {
      config: `imports:\n  - "./┆`,
      expected: ["demo_yaml", "demo_tsp"],
    },
    {
      config: `imports:\n  - "./demo_tsp"\n  - "./┆`,
      expected: ["demo_yaml"],
    },
    {
      config: `imports:\n  - "./demo_tsp/┆`,
      expected: ["test1.tsp", "test3.tsp"],
    },
    {
      config: `imports:\n  - "./demo_tsp/test1.tsp"\n  - "./demo_tsp/┆`,
      expected: ["test3.tsp"],
    },
    {
      config: `imports:\n  - "${path}┆`,
      expected: ["demo_yaml", "demo_tsp"],
    },
    {
      config: `imports:\n  - "┆./demo"`,
      expected: [],
    },
    {
      config: `imports:\n  - "${path}demo┆`,
      expected: [],
    },
    {
      config: `imports:\n  - "./demo_tsp/test┆`,
      expected: [],
    },
    {
      config: `imports:\n  "./┆"`,
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
  isTestDesc: boolean = false,
  tspconfigPathUnderWorkspace: string = "./tspconfig.yaml",
) {
  const items = (await complete(configWithPosition, includeWorkspace, tspconfigPathUnderWorkspace))
    .items;
  isTestDesc
    ? expect(items.map((i) => i.documentation ?? "").sort()).toEqual(expected.sort())
    : expect(items.map((i) => i.textEdit?.newText ?? i.label).sort()).toEqual(expected.sort());
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
