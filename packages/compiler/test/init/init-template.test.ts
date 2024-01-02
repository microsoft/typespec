import { deepStrictEqual, strictEqual } from "assert";
import { beforeEach, describe, it } from "vitest";
import { InitTemplate } from "../../src/init/init-template.js";
import { makeScaffoldingConfig, scaffoldNewProject } from "../../src/init/scaffold.js";
import { TestHost, createTestHost, resolveVirtualPath } from "../../src/testing/index.js";

describe("compiler: init: templates", () => {
  let testHost: TestHost;
  beforeEach(async () => {
    testHost = await createTestHost();
  });

  function getOutputFile(path: string): string | undefined {
    return testHost.fs.get(resolveVirtualPath(path));
  }

  async function runTemplate(overrides: Partial<InitTemplate>): Promise<void> {
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
      })
    );
  }

  describe("libraries", () => {
    it("templates can contain specific library versions to use", async () => {
      await runTemplate({
        libraries: [{ name: "foo", version: "~1.2.3" }, { name: "bar" }],
      });

      deepStrictEqual(JSON.parse(getOutputFile("package.json")!).dependencies, {
        "@typespec/compiler": "latest",
        foo: "~1.2.3",
        bar: "latest",
      });

      strictEqual(getOutputFile("main.tsp")!, 'import "foo";\nimport "bar";\n');
    });
  });
});
