import { afterAll, describe, expect, it, vi } from "vitest";
import { CliCompilerHost } from "../../src/core/cli/types.js";
import { CompilerPackageRoot } from "../../src/core/node-host.js";
import { resolvePath } from "../../src/core/path-utils.js";
import { LogSink } from "../../src/index.js";
import { initTypeSpecProject } from "../../src/init/init.js";
import { createTestFileSystem } from "../../src/testing/fs.js";
import { TestFileSystem } from "../../src/testing/types.js";
import { parseYaml as coreParseYaml } from "../../src/yaml/parser.js";

const TEST_SCAFFOLDING = {
  foo: {
    title: "Generic REST API",
    description: "Create a project representing a generic REST API service.",
    compilerVersion: "1.1.0",
    libraries: ["@typespec/http", "@typespec/rest", "@typespec/openapi", "@typespec/openapi3"],
    emitters: {
      "@typespec/openapi3": {
        selected: true,
        label: "OpenAPI 3.1 document",
        options: {
          "emitter-output-dir": "{output-dir}/schema",
          "openapi-versions": ["3.1.0"],
        },
      },
      "@typespec/http-client-csharp": {
        label: "C# client",
        options: {
          "emitter-output-dir": "{output-dir}/clients/csharp",
        },
      },
    },
    files: [],
  },
  withParams: {
    title: "Template with parameters",
    description: "A template that uses parameters.",
    compilerVersion: "1.1.0",
    libraries: ["@typespec/http", "@typespec/rest", "@typespec/openapi", "@typespec/openapi3"],
    emitters: {
      "@typespec/openapi3": {
        selected: true,
        label: "OpenAPI 3.1 document",
        options: {
          "emitter-output-dir": "{output-dir}/schema",
          "openapi-versions": ["3.1.0"],
        },
      },
    },
    inputs: {
      param1: {
        description: "Param 1",
        type: "text",
      },
      param2: {
        description: "Param 2 with default",
        type: "text",
        initialValue: "default-value",
      },
      param3: {
        description: "Param 3 with default",
        type: "text",
        initialValue: "another-default-value",
      },
    },
    files: [
      {
        path: "./withParams/tspconfig.yaml",
        destination: "tspconfig.yaml",
      },
    ],
  },
};

async function createTestFSWithCliCompilerHost(): Promise<
  TestFileSystem & { compilerHost: CliCompilerHost }
> {
  const testHost = await createTestFileSystem();

  testHost.fs.set(
    resolvePath(CompilerPackageRoot, "templates", "scaffolding.json"),
    JSON.stringify(TEST_SCAFFOLDING),
  );

  testHost.fs.set(
    resolvePath(CompilerPackageRoot, "templates", "withParams", "tspconfig.yaml"),
    `
emit: @typespec/openapi3
options:
  @typespec/openapi3:
    emitter-output-dir: "{output-dir}/schema"
parameters:
  param1:
    default: "{{parameters.param1}}"
  param2:
    default: "{{parameters.param2}}"
  param3:
    default: "{{parameters.param3}}"
`,
  );

  const logSink: LogSink = {
    log: () => {},
    getPath(s) {
      return s;
    },
    trackAction(): Promise<any> {
      return Promise.resolve();
    },
  };

  Object.assign(testHost.compilerHost as CliCompilerHost, { logSink });
  return testHost as TestFileSystem & { compilerHost: CliCompilerHost };
}

function parseJson(host: CliCompilerHost, path: string): Promise<Record<string, any>> {
  return host.readFile(path).then((f) => JSON.parse(f.text));
}

function parseYaml(host: CliCompilerHost, path: string): Promise<Record<string, any>> {
  return host.readFile(path).then((f) => coreParseYaml(f.text)[0].value as any);
}

describe("auto-accept-prompts", () => {
  const consoleMock = vi.spyOn(console, "log").mockImplementation(() => {});
  afterAll(() => {
    consoleMock.mockRestore();
  });

  it("should create a new project with the specified template", async () => {
    const { compilerHost } = await createTestFSWithCliCompilerHost();

    await initTypeSpecProject(compilerHost, "/tmp/test-project", {
      template: "foo",
      "auto-accept-prompts": true,
    });

    const packageJson = await parseJson(compilerHost, "/tmp/test-project/package.json");
    const tspConfig = await parseYaml(compilerHost, "/tmp/test-project/tspconfig.yaml");

    expect(packageJson.name).toBe("test-project");
    expect(tspConfig.emit).toEqual(["@typespec/openapi3"]);
  });

  it("does not ask for permission if directory has files", async () => {
    const { fs, compilerHost } = await createTestFSWithCliCompilerHost();
    fs.set("/tmp/test-project/some-file.txt", "content");

    await initTypeSpecProject(compilerHost, "/tmp/test-project", {
      template: "foo",
      "auto-accept-prompts": true,
    });
    const packageJson = await parseJson(compilerHost, "/tmp/test-project/package.json");
    expect(packageJson.name).toBe("test-project");
  });

  it("should support overriding project name", async () => {
    const { compilerHost } = await createTestFSWithCliCompilerHost();

    await initTypeSpecProject(compilerHost, "/tmp/test-project", {
      template: "foo",
      "auto-accept-prompts": true,
      "project-name": "custom-project-name",
    });

    const packageJson = await parseJson(compilerHost, "/tmp/test-project/package.json");
    expect(packageJson.name).toBe("custom-project-name");
  });

  it("should support overriding emitters", async () => {
    const { compilerHost } = await createTestFSWithCliCompilerHost();

    await initTypeSpecProject(compilerHost, "/tmp/test-project", {
      template: "foo",
      "auto-accept-prompts": true,
      emitters: ["@typespec/openapi3", "@typespec/http-client-csharp"],
    });

    const tspConfig = await parseYaml(compilerHost, "/tmp/test-project/tspconfig.yaml");
    expect(tspConfig.emit).toEqual(["@typespec/openapi3", "@typespec/http-client-csharp"]);
  });

  it("defaults to initialValue for parameters", async () => {
    const { compilerHost } = await createTestFSWithCliCompilerHost();
    await initTypeSpecProject(compilerHost, "/tmp/test-project", {
      template: "withParams",
      "auto-accept-prompts": true,
      args: ["param1=value1"],
    });

    const tspConfig = await parseYaml(compilerHost, "/tmp/test-project/tspconfig.yaml");
    expect(tspConfig.parameters).toEqual({
      param1: { default: "value1" },
      param2: { default: "default-value" },
      param3: { default: "another-default-value" },
    });
  });

  it("should support passing in arguments", async () => {
    const { compilerHost } = await createTestFSWithCliCompilerHost();
    await initTypeSpecProject(compilerHost, "/tmp/test-project", {
      template: "withParams",
      "auto-accept-prompts": true,
      args: ["param1=value1", "param2=value2", "param3=value3"],
    });

    const tspConfig = await parseYaml(compilerHost, "/tmp/test-project/tspconfig.yaml");
    expect(tspConfig.parameters).toEqual({
      param1: { default: "value1" },
      param2: { default: "value2" },
      param3: { default: "value3" },
    });
  });

  it("can't add emitters not specified by the template", async () => {
    const { compilerHost } = await createTestFSWithCliCompilerHost();

    await initTypeSpecProject(compilerHost, "/tmp/test-project", {
      template: "foo",
      "auto-accept-prompts": true,
      emitters: ["@typespec/openapi3", "@typespec/http-client-csharp", "my-fake-emitter"],
    });

    const tspConfig = await parseYaml(compilerHost, "/tmp/test-project/tspconfig.yaml");
    expect(tspConfig.emit).toEqual(["@typespec/openapi3", "@typespec/http-client-csharp"]);
  });

  it("should throw an error if no template is specified with auto-accept-prompts", async () => {
    const { compilerHost } = await createTestFSWithCliCompilerHost();

    await expect(
      initTypeSpecProject(compilerHost, "/tmp/test-project", {
        "auto-accept-prompts": true,
      }),
    ).rejects.toThrowError("A template must be specified when --auto-accept-prompts is used.");
  });

  it("should throw an error if the specified template does not exist", async () => {
    const { compilerHost } = await createTestFSWithCliCompilerHost();

    await expect(
      initTypeSpecProject(compilerHost, "/tmp/test-project", {
        template: "non-existent-template",
        "auto-accept-prompts": true,
      }),
    ).rejects.toThrowError("Unexpected error: Cannot find template non-existent-template");
  });

  it("should throw an error if a required argument is not provided", async () => {
    const { compilerHost } = await createTestFSWithCliCompilerHost();

    await expect(
      initTypeSpecProject(compilerHost, "/tmp/test-project", {
        template: "withParams",
        "auto-accept-prompts": true,
      }),
    ).rejects.toThrowError(
      `Missing value for parameter "param1". Provide it using --args param1=value`,
    );
  });
});
