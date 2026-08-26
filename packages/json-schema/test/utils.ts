import { resolvePath, type Diagnostic } from "@typespec/compiler";
import { createTester, expectDiagnosticEmpty, mockFile } from "@typespec/compiler/testing";
import { parse } from "yaml";
import type { JSONSchemaEmitterOptions } from "../src/lib.js";

export const ApiTester = createTester(resolvePath(import.meta.dirname, ".."), {
  libraries: ["@typespec/json-schema"],
})
  .import("@typespec/json-schema")
  .using("JsonSchema");

export const Tester = ApiTester.emit("@typespec/json-schema");

export async function emitSchemaWithDiagnostics(
  code: string,
  options: JSONSchemaEmitterOptions = {},
  testOptions: {
    emitNamespace?: boolean;
    decorators?: Record<string, any>;
  } = { emitNamespace: true },
): Promise<[Record<string, any>, readonly Diagnostic[]]> {
  if (!options["file-type"]) {
    options["file-type"] = "json";
  }

  code = testOptions.emitNamespace ? `@jsonSchema namespace test; ${code}` : code;
  const tester = testOptions.decorators
    ? Tester.import("./dec.js").files({
        "dec.js": mockFile.js(testOptions.decorators),
      })
    : Tester;

  const [{ outputs }, diagnostics] = await tester.compileAndDiagnose(code, {
    compilerOptions: {
      options: { "@typespec/json-schema": options as any },
    },
  });
  const schemas: Record<string, any> = {};

  for (const [file, content] of Object.entries(outputs)) {
    if (options?.["file-type"] === "yaml") {
      schemas[file] = parse(content);
    } else {
      schemas[file] = JSON.parse(content);
    }
  }

  return [schemas, diagnostics];
}

export async function emitSchema(
  code: string,
  options: JSONSchemaEmitterOptions = {},
  testOptions: {
    emitNamespace?: boolean;
    decorators?: Record<string, any>;
  } = { emitNamespace: true },
) {
  const [schemas, diagnostics] = await emitSchemaWithDiagnostics(code, options, testOptions);
  expectDiagnosticEmpty(diagnostics);
  return schemas;
}
