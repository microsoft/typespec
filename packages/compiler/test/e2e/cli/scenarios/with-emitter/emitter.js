import { mkdir, writeFile } from "fs/promises";

export async function $onEmit(context) {
  console.log("No emit", context.program.compilerOptions.noEmit, context.program.compilerOptions);
  if (!context.program.compilerOptions.noEmit) {
    await mkdir(context.program.compilerOptions.outputDir, { recursive: true });
    await writeFile(context.program.compilerOptions.outputDir + "/out.txt", "Hello, world!");
  }
}
