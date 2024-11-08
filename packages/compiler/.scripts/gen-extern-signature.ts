// This can only be called after tspd is built(which is done after the compiler is built)
import { format, resolveConfig } from "prettier";
import { fileURLToPath } from "url";
import { generateExternDecorators } from "../../tspd/dist/src/gen-extern-signatures/gen-extern-signatures.js";
import {
  Namespace,
  NodeHost,
  compile,
  formatDiagnostic,
  logDiagnostics,
  resolvePath,
} from "../dist/src/index.js";

const root = fileURLToPath(new URL("..", import.meta.url).href);
const outDir = resolvePath(root, "generated-defs");
try {
  await NodeHost.rm(outDir, { recursive: true });
} catch (e) {}
await NodeHost.mkdirp(outDir);

const program = await compile(NodeHost, root, {});
logDiagnostics(program.diagnostics, NodeHost.logSink);
if (program.hasError()) {
  console.log("Has error not continuing");
  process.exit(1);
}

const resolved = [
  program.resolveTypeReference("TypeSpec"),
  program.resolveTypeReference("TypeSpec.Prototypes"),
];
const namespaces: Namespace[] = [];
for (const [namespace, diagnostics] of resolved) {
  if (namespace === undefined) {
    throw new Error(`Cannot resolve namespace: \n${diagnostics.map(formatDiagnostic).join("\n")}`);
  } else if (namespace.kind !== "Namespace") {
    throw new Error(`Expected namespace but got ${namespace.kind}`);
  }
  namespaces.push(namespace);
}

const files = await generateExternDecorators(program, "@typespec/compiler", { namespaces });
for (const [name, content] of Object.entries(files)) {
  const updatedContent = content.replace(
    /from "\@typespec\/compiler"/g,
    name.endsWith(".ts-test.ts") ? `from "../src/index.js"` : `from "../src/core/index.js"`,
  );
  const prettierConfig = await resolveConfig(root);

  await NodeHost.writeFile(
    resolvePath(outDir, name),
    await format(updatedContent, { ...prettierConfig, parser: "typescript" }),
  );
}
