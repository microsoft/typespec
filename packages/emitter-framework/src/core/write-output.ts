import { renderAsync, type Children, type OutputDirectory } from "@alloy-js/core";
import { emitFile, joinPaths, type Program } from "@typespec/compiler";

/**
 * Asynchronously renders an Alloy tree and emits its generated text files through
 * the TypeSpec program host. File paths are resolved beneath `emitterOutputDir`;
 * Alloy copy-file entries are not currently written.
 *
 * @param rootComponent - Output root, normally {@link Output}, containing the files to render.
 * @param emitterOutputDir - Base output directory, typically the emitter context's output directory.
 */
export async function writeOutput(
  program: Program,
  rootComponent: Children,
  emitterOutputDir: string,
) {
  const tree = await renderAsync(rootComponent);
  await writeOutputDirectory(program, tree, emitterOutputDir);
}

async function writeOutputDirectory(
  program: Program,
  dir: OutputDirectory,
  emitterOutputDir: string,
) {
  for (const sub of dir.contents) {
    if ("contents" in sub) {
      if (Array.isArray(sub.contents)) {
        await writeOutputDirectory(program, sub as OutputDirectory, emitterOutputDir);
      } else {
        await emitFile(program, {
          content: sub.contents as string,
          path: joinPaths(emitterOutputDir, sub.path),
        });
      }
    } else {
      // TODO: support copy file
    }
  }
}
