// This can only be called after tspd is built(which is done after the compiler is built)
import { format, resolveConfig } from "prettier";
import { fileURLToPath } from "url";
import { generateExternDecorators } from "../../tspd/dist/src/gen-extern-signatures/gen-extern-signatures.js";
import { NodeHost, compile, resolvePath } from "../dist/src/index.js";

const root = fileURLToPath(new URL("..", import.meta.url).href);
const outDir = resolvePath(root, "generated-defs");
try {
  await NodeHost.rm(outDir, { recursive: true });
} catch (e) {}
await NodeHost.mkdirp(outDir);

const program = await compile(NodeHost, root, {});

const files = await generateExternDecorators(program, "@typespec/compiler");
for (const [name, content] of Object.entries(files)) {
  const updatedContent = content.replace(/from "\@typespec\/compiler"/g, `from "../src/index.js"`);
  const prettierConfig = await resolveConfig(root);

  await NodeHost.writeFile(
    resolvePath(outDir, name),
    await format(updatedContent, { ...prettierConfig, parser: "typescript" }),
  );
}
