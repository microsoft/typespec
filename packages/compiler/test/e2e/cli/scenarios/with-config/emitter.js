import { mkdir, writeFile } from "fs/promises";

export async function $onEmit(context) {
  await mkdir(context.program.compilerOptions.outputDir, { recursive: true });
  await writeFile(context.program.compilerOptions.outputDir + "/out.txt", "");
}
