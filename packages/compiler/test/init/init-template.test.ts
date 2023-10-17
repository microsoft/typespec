import { deepStrictEqual, strictEqual } from "assert";
import {
  ScaffoldingConfig,
  makeScaffoldingConfig,
  scaffoldNewProject,
} from "../../src/init/init.js";
import { TestHost, createTestHost, resolveVirtualPath } from "../../src/testing/index.js";

describe("compiler: init: templates", () => {
  let testHost: TestHost;
  beforeEach(async () => {
    testHost = await createTestHost();
  });

  function getOutputFile(path: string): string | undefined {
    return testHost.fs.get(resolveVirtualPath(path));
  }

  async function runTemplate(config: Partial<ScaffoldingConfig>): Promise<void> {
    await scaffoldNewProject(
      testHost.compilerHost,
      makeScaffoldingConfig({
        title: "Test Template",
        name: "test-template",
        folderName: "test-template",
        description: "This is only a test.",
        ...config,
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
