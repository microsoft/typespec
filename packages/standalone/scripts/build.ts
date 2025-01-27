import * as esbuild from "esbuild";
import { execa } from "execa";
import { copyFile, mkdir } from "node:fs/promises";
import ora from "ora";
import { dirname, join } from "path";
import { writeSeaConfig } from "./sea-config.js";

// cspell:ignore postject

const projectRoot = dirname(import.meta.dirname);
const tempDir = join(projectRoot, "temp");
const seaConfigPath = join(tempDir, "sea-config.json");
const blobPath = join(tempDir, "sea-prep.blob");
const exePath = join(projectRoot, "dist", "standalone-tsp");

await buildCurrent();

async function buildCurrent() {
  await bundle();
  console.log("");
  await createSea();
}

async function bundle() {
  await action(`Bundling js code`, async () => {
    await esbuild.build({
      entryPoints: ["src/cli.ts"],
      bundle: true,
      outfile: "dist/bundle.cjs",
      platform: "node",
      target: "node22",
      format: "cjs",
    });
  });
}

async function createSea() {
  await mkdir(tempDir, { recursive: true });
  await createSeaConfig();

  await action(`Copying executable`, async () => {
    // get the node executable
    const nodeExe = process.execPath;
    // copy the executable as the output executable
    await copyFile(nodeExe, exePath);
  });

  await action(`Remove signature`, async () => {
    if (process.platform === "darwin") {
      execa`codesign --remove-signature ${exePath}`;
    } else if (process.platform === "win32") {
      execa`signtool remove /s ${exePath}`;
    }
  });
  await action(`Creating blob ${seaConfigPath}`, async () => {
    await execa`node --experimental-sea-config ${seaConfigPath}`;
  });
  await action(`Injecting blob into ${exePath}`, async () => {
    if (process.platform === "darwin") {
      await execa`npx postject ${exePath} NODE_SEA_BLOB ${blobPath}  --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2 --macho-segment-name NODE_SEA`;
    } else {
      await execa`npx postject ${exePath} NODE_SEA_BLOB ${blobPath}  --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2`;
    }
  });

  await action(`Sign executable ${exePath}`, async () => {
    if (process.platform === "darwin") {
      execa`codesign --sign - ${exePath}`;
    } else if (process.platform === "win32") {
      execa`signtool sign /fd SHA256 ${exePath}`;
    }
  });
}

async function createSeaConfig() {
  await action(`Creating sea config ${seaConfigPath}`, async () => {
    await writeSeaConfig(seaConfigPath, {
      main: join(projectRoot, "dist/bundle.cjs"),
      output: blobPath,
      disableExperimentalSEAWarning: true,
      useCodeCache: false,
    });
  });
}
async function action(message: string, callback: () => Promise<any>) {
  const spinner = ora(message).start();
  try {
    const result = await callback();
    spinner.succeed();
    return result;
  } catch (e) {
    spinner.fail();
    throw e;
  }
}
