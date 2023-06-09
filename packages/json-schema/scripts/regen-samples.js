import { run } from "@typespec/internal-build-utils";
import { readdir, rm } from "fs/promises";
import { join } from "path";
import { fileURLToPath } from "url";

const packageRootDir = fileURLToPath(new URL("../", import.meta.url));
const samplesPath = join(packageRootDir, "samples");
const compilerPath = join(packageRootDir, "../compiler/dist/core/cli/cli.js");

for (const subdir of await readdir(samplesPath)) {
  // assume everything is a directory here.
  const samplePath = join(samplesPath, subdir);
  process.chdir(samplePath);
  rm(join(samplePath, "tsp-output"), { recursive: true });
  await run(process.execPath, [
    compilerPath,
    "compile",
    ".",
    `--emit=@typespec/json-schema`,
    `--warn-as-error`,
    `--debug`,
  ]);
}
