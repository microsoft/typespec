import { type Children, type OutputDirectory, render } from "@alloy-js/core";
import { emitFile, joinPaths, type Program } from "@typespec/compiler";

export async function writeOutput(
  program: Program,
  rootComponent: Children,
  emitterOutputDir: string,
) {
  const tree = render(rootComponent);
  await writeOutputDirectory(program, tree, emitterOutputDir);
}

async function writeOutputDirectory(
  program: Program,
  dir: OutputDirectory,
  emitterOutputDir: string,
) {
  for (const sub of dir.contents) {
    if (Array.isArray(sub.contents)) {
      await writeOutputDirectory(program, sub as OutputDirectory, emitterOutputDir);
    } else {
      await emitFile(program, {
        content: sub.contents as string,
        path: joinPaths(emitterOutputDir, sub.path),
      });
    }
  }
}
