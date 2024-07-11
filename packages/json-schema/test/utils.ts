import { Diagnostic } from "@typespec/compiler";
import { createAssetEmitter } from "@typespec/compiler/emitter-framework";
import { createTestHost, expectDiagnosticEmpty } from "@typespec/compiler/testing";
import { parse } from "yaml";
import { JsonSchemaEmitter } from "../src/json-schema-emitter.js";
import { JSONSchemaEmitterOptions } from "../src/lib.js";
import { JsonSchemaTestLibrary } from "../src/testing/index.js";

export async function getHostForCadlFile(contents: string, decorators?: Record<string, any>) {
  const host = await createTestHost({
    libraries: [JsonSchemaTestLibrary],
  });
  if (decorators) {
    host.addJsFile("dec.js", decorators);
    contents = `import "./dec.js";\n` + contents;
  }
  host.addTypeSpecFile("main.cadl", contents);
  await host.compileAndDiagnose("main.cadl", {
    noEmit: false,
    outputDir: "cadl-output",
  });
  return host;
}

export async function emitSchemaWithDiagnostics(
  code: string,
  options: JSONSchemaEmitterOptions = {},
  testOptions: {
    emitNamespace?: boolean;
    emitTypes?: string[];
    decorators?: Record<string, any>;
  } = { emitNamespace: true }
): Promise<[Record<string, any>, readonly Diagnostic[]]> {
  if (!options["file-type"]) {
    options["file-type"] = "json";
  }

  code = testOptions.emitNamespace
    ? `import "@typespec/json-schema"; using TypeSpec.JsonSchema; @jsonSchema namespace test; ${code}`
    : `import "@typespec/json-schema"; using TypeSpec.JsonSchema; ${code}`;
  const host = await getHostForCadlFile(code, testOptions.decorators);
  const emitter = createAssetEmitter(
    host.program,
    JsonSchemaEmitter as any,
    {
      emitterOutputDir: "cadl-output",
      options,
    } as any
  );
  if (options.emitAllModels) {
    emitter.emitProgram({ emitTypeSpecNamespace: false });
  } else if (testOptions.emitTypes === undefined) {
    emitter.emitType(host.program.resolveTypeReference("test")[0]!);
  } else {
    for (const name of testOptions.emitTypes) {
      emitter.emitType(host.program.resolveTypeReference(name)[0]!);
    }
  }

  await emitter.writeOutput();
  const schemas: Record<string, any> = {};
  const files = await emitter.getProgram().host.readDir("./cadl-output");

  for (const file of files) {
    const sf = await emitter.getProgram().host.readFile(`./cadl-output/${file}`);
    if (options?.["file-type"] === "yaml") {
      schemas[file] = parse(sf.text);
    } else {
      schemas[file] = JSON.parse(sf.text);
    }
  }

  return [schemas, host.program.diagnostics];
}

export async function emitSchema(
  code: string,
  options: JSONSchemaEmitterOptions = {},
  testOptions: {
    emitNamespace?: boolean;
    emitTypes?: string[];
    decorators?: Record<string, any>;
  } = { emitNamespace: true }
) {
  const [schemas, diagnostics] = await emitSchemaWithDiagnostics(code, options, testOptions);
  expectDiagnosticEmpty(diagnostics);
  return schemas;
}
