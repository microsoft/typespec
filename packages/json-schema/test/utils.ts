import { createAssetEmitter } from "@typespec/asset-emitter";
import type { Diagnostic } from "@typespec/compiler";
import { createTestHost, expectDiagnosticEmpty } from "@typespec/compiler/testing";
import { parse } from "yaml";
import { JsonSchemaEmitter } from "../src/json-schema-emitter.js";
import type { JSONSchemaEmitterOptions } from "../src/lib.js";
import { JsonSchemaTestLibrary } from "../src/testing/index.js";

export async function getHostForTspFile(contents: string, decorators?: Record<string, any>) {
  const host = await createTestHost({
    libraries: [JsonSchemaTestLibrary],
  });
  if (decorators) {
    host.addJsFile("dec.js", decorators);
    contents = `import "./dec.js";\n` + contents;
  }
  host.addTypeSpecFile("main.tsp", contents);
  await host.compileAndDiagnose("main.tsp", {
    noEmit: false,
    outputDir: "tsp-output",
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
  } = { emitNamespace: true },
): Promise<[Record<string, any>, readonly Diagnostic[]]> {
  if (!options["file-type"]) {
    options["file-type"] = "json";
  }

  code = testOptions.emitNamespace
    ? `import "@typespec/json-schema"; using JsonSchema; @jsonSchema namespace test; ${code}`
    : `import "@typespec/json-schema"; using JsonSchema; ${code}`;
  const host = await getHostForTspFile(code, testOptions.decorators);
  const emitter = createAssetEmitter(
    host.program,
    JsonSchemaEmitter as any,
    {
      emitterOutputDir: "tsp-output",
      options,
    } as any,
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
  const files = await emitter.getProgram().host.readDir("./tsp-output");

  for (const file of files) {
    const sf = await emitter.getProgram().host.readFile(`./tsp-output/${file}`);
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
  } = { emitNamespace: true },
) {
  const [schemas, diagnostics] = await emitSchemaWithDiagnostics(code, options, testOptions);
  expectDiagnosticEmpty(diagnostics);
  return schemas;
}
