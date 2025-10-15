import { createAssetEmitter } from "@typespec/asset-emitter";
import { resolvePath, type Diagnostic } from "@typespec/compiler";
import { createTester, expectDiagnosticEmpty, mockFile } from "@typespec/compiler/testing";
import { parse } from "yaml";
import { JsonSchemaEmitter } from "../src/json-schema-emitter.js";
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
    emitTypes?: string[];
    decorators?: Record<string, any>;
  } = { emitNamespace: true },
): Promise<[Record<string, any>, readonly Diagnostic[]]> {
  if (!options["file-type"]) {
    options["file-type"] = "json";
  }

  code = testOptions.emitNamespace ? `@jsonSchema namespace test; ${code}` : code;
  const tester = testOptions.decorators
    ? ApiTester.import("./dec.js").files({
        "dec.js": mockFile.js(testOptions.decorators),
      })
    : ApiTester;
  const [{ program }] = await tester.compileAndDiagnose(code);
  const emitter = createAssetEmitter(
    program,
    JsonSchemaEmitter as any,
    {
      emitterOutputDir: "tsp-output",
      options,
    } as any,
  );
  if (options.emitAllModels) {
    emitter.emitProgram({ emitTypeSpecNamespace: false });
  } else if (testOptions.emitTypes === undefined) {
    emitter.emitType(program.resolveTypeReference("test")[0]!);
  } else {
    for (const name of testOptions.emitTypes) {
      emitter.emitType(program.resolveTypeReference(name)[0]!);
    }
  }

  await emitter.writeOutput();
  const schemas: Record<string, any> = {};
  const files = await emitter.getProgram().host.readDir("./tsp-output");

  for (const file of files) {
    const sf = await emitter.getProgram().host.readFile(`./tsp-output/${file}`);
    if (options?.["file-type"] === "yaml") {
      schemas[file] = parse(sf.text);
    } else {
      schemas[file] = JSON.parse(sf.text);
    }
  }

  return [schemas, program.diagnostics];
}

export async function emitSchema(
  code: string,
  options: JSONSchemaEmitterOptions = {},
  testOptions: {
    emitNamespace?: boolean;
    emitTypes?: string[];
    decorators?: Record<string, any>;
  } = { emitNamespace: true },
) {
  const [schemas, diagnostics] = await emitSchemaWithDiagnostics(code, options, testOptions);
  expectDiagnosticEmpty(diagnostics);
  return schemas;
}
