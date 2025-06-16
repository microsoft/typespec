import { ok, strictEqual } from "assert";
import { beforeEach, describe, expect, it } from "vitest";
import { parse } from "yaml";
import { InitTemplate } from "../../src/init/init-template.js";
import {
  ScaffoldingConfig,
  makeScaffoldingConfig,
  scaffoldNewProject,
} from "../../src/init/scaffold.js";
import { TestHost, createTestHost, resolveVirtualPath } from "../../src/testing/index.js";

let testHost: TestHost;
beforeEach(async () => {
  testHost = await createTestHost();
});

function getOutputFile(path: string): string | undefined {
  return testHost.fs.get(resolveVirtualPath(path));
}

async function runTemplate(
  overrides: Partial<InitTemplate>,
  configOverrides?: Partial<ScaffoldingConfig>,
): Promise<void> {
  const template: InitTemplate = {
    title: "Test Template",
    description: "This is only a test.",
    ...overrides,
  };
  await scaffoldNewProject(
    testHost.compilerHost,
    makeScaffoldingConfig(template, {
      name: "test-template",
      template,
      ...configOverrides,
    }),
  );
}

describe("libraries", () => {
  it("adds libraries to peer and dev dependencies fields", async () => {
    await runTemplate({
      target: "library",
      libraries: [{ name: "bar" }],
    });

    const pkgJson = JSON.parse(getOutputFile("package.json")!);

    expect(pkgJson.peerDependencies).toEqual({
      "@typespec/compiler": "latest",
      bar: "latest",
    });
    expect(pkgJson.devDependencies).toEqual({
      "@typespec/compiler": "latest",
      bar: "latest",
    });
    expect(pkgJson.dependencies).toBeUndefined();
  });

  it("templates can contain specific library versions to use", async () => {
    await runTemplate({
      target: "library",
      libraries: [{ name: "foo", version: "~1.2.3" }, { name: "bar" }],
    });

    const pkgJson = JSON.parse(getOutputFile("package.json")!);

    expect(pkgJson.peerDependencies).toEqual({
      "@typespec/compiler": "latest",
      foo: "~1.2.3",
      bar: "latest",
    });

    expect(pkgJson.devDependencies).toEqual({
      "@typespec/compiler": "latest",
      foo: "~1.2.3",
      bar: "latest",
    });

    strictEqual(getOutputFile("main.tsp")!, 'import "foo";\nimport "bar";\n');
  });
});

describe("project", () => {
  it("adds libraries to dependencies field", async () => {
    await runTemplate({
      libraries: [{ name: "bar" }],
    });

    const pkgJson = JSON.parse(getOutputFile("package.json")!);

    expect(pkgJson.dependencies).toEqual({
      "@typespec/compiler": "latest",
      bar: "latest",
    });
    expect(pkgJson.peerDependencies).toBeUndefined();
    expect(pkgJson.devDependencies).toBeUndefined();
  });
});

it("can generate .gitignore file by default", async () => {
  await runTemplate({});
  strictEqual(typeof getOutputFile(".gitignore"), "string");
});

it("can exclude .gitignore file", async () => {
  await runTemplate({}, { includeGitignore: false });
  strictEqual(typeof getOutputFile(".gitignore"), "undefined");
});

it("specifying both config and emitters merge the 2", async () => {
  const emitters = {
    foo: { selected: true, options: { opt1: "val-1" } },
  };

  await runTemplate(
    {
      config: { "warn-as-error": true },
      emitters,
    },
    { emitters },
  );
  const output = getOutputFile("tspconfig.yaml");
  ok(output);
  expect(parse(output)).toEqual({
    "warn-as-error": true,
    emit: ["foo"],
    options: {
      foo: { opt1: "val-1" },
    },
  });
});
