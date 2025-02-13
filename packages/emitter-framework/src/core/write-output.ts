import {unsafe_$ as $} from "@typespec/compiler/experimental";
import {emitFile, joinPaths} from "@typespec/compiler"
import {Children, OutputDirectory, render} from "@alloy-js/core"

export async function writeOutput(rootComponent: Children, emitterOutputDir: string) {
  const tree = render(rootComponent);
  await writeOutputDirectory(tree, emitterOutputDir);
}


async function writeOutputDirectory(dir: OutputDirectory, emitterOutputDir: string) {
  for (const sub of dir.contents) {
    if (Array.isArray(sub.contents)) {
      await writeOutputDirectory(sub as OutputDirectory, emitterOutputDir);
    } else {
      await emitFile($.program, {
        content: sub.contents as string,
        path: joinPaths(emitterOutputDir, sub.path),
      });
    }
  }
}
