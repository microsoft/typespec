import { deepStrictEqual, strictEqual } from "assert";
import { beforeEach, describe, it } from "vitest";
import { InitTemplate } from "../../src/init/init-template.js";
import {
  ScaffoldingConfig,
  makeScaffoldingConfig,
  scaffoldNewProject,
} from "../../src/init/scaffold.js";
import { TestHost, createTestHost, resolveVirtualPath } from "../../src/testing/index.js";

describe("compiler: init: templates", () => {
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
        folderName: "test-template",
        template,
        ...configOverrides,
      }),
    );
  }

  describe("libraries", () => {
    it("templates can contain specific library versions to use", async () => {
      await runTemplate({
        libraries: [{ name: "foo", version: "~1.2.3" }, { name: "bar" }],
      });

      deepStrictEqual(JSON.parse(getOutputFile("package.json")!).peerDependencies, {
        "@typespec/compiler": "latest",
        foo: "~1.2.3",
        bar: "latest",
      });

      deepStrictEqual(JSON.parse(getOutputFile("package.json")!).devDependencies, {
        "@typespec/compiler": "latest",
        foo: "~1.2.3",
        bar: "latest",
      });

      strictEqual(getOutputFile("main.tsp")!, 'import "foo";\nimport "bar";\n');
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
});
