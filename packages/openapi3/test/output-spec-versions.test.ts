import { resolvePath } from "@typespec/compiler";
import {
  expectDiagnosticEmpty,
  resolveVirtualPath,
  TesterInstance,
} from "@typespec/compiler/testing";
import { ok } from "assert";
import { beforeEach, expect, it } from "vitest";
import { OpenAPI3EmitterOptions } from "../src/lib.js";
import { ApiTester } from "./test-host.js";

const outputDir = resolveVirtualPath("test-output");
let runner: TesterInstance;
beforeEach(async () => {
  runner = await ApiTester.createInstance();
});

async function compileOpenAPI(options: OpenAPI3EmitterOptions, code: string = ""): Promise<void> {
  const diagnostics = await runner.diagnose(code, {
    compilerOptions: {
      emit: ["@typespec/openapi3"],
      options: { "@typespec/openapi3": { ...options, "emitter-output-dir": outputDir } },
    },
  });

  expectDiagnosticEmpty(diagnostics);
}

function expectHasOutput(filename: string) {
  const outPath = resolvePath(outputDir, filename);
  const content = runner.fs.fs.get(outPath);
  ok(content, `Expected ${outPath} to exist.`);
}

it("creates nested directory if multiple spec versions are specified", async () => {
  await compileOpenAPI({ "openapi-versions": ["3.0.0", "3.1.0"] });
  expectHasOutput("3.0.0/openapi.yaml");
  expectHasOutput("3.1.0/openapi.yaml");
});

it("does not create nested directory if only 1 spec version is specified", async () => {
  await compileOpenAPI({ "openapi-versions": ["3.0.0"] });
  expectHasOutput("openapi.yaml");
});

it("defaults to 3.0.0 if not specified", async () => {
  await compileOpenAPI({ "file-type": "json" });
  const outPath = resolvePath(outputDir, "openapi.json");
  const content = runner.fs.fs.get(outPath);
  ok(content, `Expected ${outPath} to exist.`);
  const doc = JSON.parse(content);
  expect(doc.openapi).toBe("3.0.0");
});

it("supports 3.1.0", async () => {
  await compileOpenAPI({ "openapi-versions": ["3.1.0"], "file-type": "json" });
  const outPath = resolvePath(outputDir, "openapi.json");
  const content = runner.fs.fs.get(outPath);
  ok(content, `Expected ${outPath} to exist.`);
  const doc = JSON.parse(content);
  expect(doc.openapi).toBe("3.1.0");
});
