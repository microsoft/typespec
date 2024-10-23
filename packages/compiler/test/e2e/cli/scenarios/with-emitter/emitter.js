import { mkdir, writeFile } from "fs/promises";

export async function $onEmit(context) {
  if (!context.program.compilerOptions.noEmit) {
    await mkdir(context.program.compilerOptions.outputDir, { recursive: true });
    await writeFile(
      context.program.compilerOptions.outputDir + "/out.txt",
      context.options["text"] ?? "Hello, world!",
    );
  }
}

export const $lib = {
  name: "test-emitter",
};
