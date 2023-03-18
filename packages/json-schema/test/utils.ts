import { createAssetEmitter } from "@typespec/compiler/emitter-framework";
import { createTestHost } from "@typespec/compiler/testing";
import yaml from "js-yaml";
import { SchemaPerFileEmitter } from "../src/schema-per-file-emitter.js";

export async function getHostForCadlFile(contents: string, decorators?: Record<string, any>) {
  const host = await createTestHost();
  if (decorators) {
    await host.addJsFile("dec.js", decorators);
    contents = `import "./dec.js";\n` + contents;
  }
  await host.addTypeSpecFile("main.cadl", contents);
  await host.compile("main.cadl", {
    outputDir: "cadl-output",
  });
  return host;
}

export async function emitSchema(
  code: string,
  options: { "file-type"?: "yaml" | "json" } = { "file-type": "json" }
) {
  const host = await getHostForCadlFile(code);
  const emitter = createAssetEmitter(host.program, SchemaPerFileEmitter, {
    emitterOutputDir: "cadl-output",
    options,
  } as any);
  emitter.emitProgram();
  await emitter.writeOutput();
  const schemas: Record<string, any> = {};
  const files = await emitter.getProgram().host.readDir("./cadl-output");

  for (const file of files) {
    const sf = await emitter.getProgram().host.readFile(`./cadl-output/${file}`);
    if (options?.["file-type"] === "yaml") {
      schemas[file] = yaml.load(sf.text);
    } else {
      schemas[file] = JSON.parse(sf.text);
    }
  }

  return schemas;
}
