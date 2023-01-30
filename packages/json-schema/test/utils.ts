import { createAssetEmitter } from "@cadl-lang/compiler/emitter-framework";
import { createTestHost } from "@cadl-lang/compiler/testing";
import { SchemaPerFileEmitter } from "../src/schema-per-file-emitter.js";

export async function getHostForCadlFile(contents: string, decorators?: Record<string, any>) {
  const host = await createTestHost();
  if (decorators) {
    await host.addJsFile("dec.js", decorators);
    contents = `import "./dec.js";\n` + contents;
  }
  await host.addCadlFile("main.cadl", contents);
  await host.compile("main.cadl", {
    outputDir: "cadl-output",
  });
  return host;
}

export async function emitSchema(code: string) {
  const host = await getHostForCadlFile(code);
  const emitter = createAssetEmitter(host.program, SchemaPerFileEmitter);
  emitter.emitProgram();
  await emitter.writeOutput();
  const schemas: Record<string, any> = {};
  const files = await emitter.getProgram().host.readDir("./cadl-output");
  for (const file of files) {
    const sf = await emitter.getProgram().host.readFile(`./cadl-output/${file}`);
    schemas[file] = JSON.parse(sf.text);
  }

  return schemas;
}
