import * as esbuild from "esbuild";
import { execa } from "execa";
import { execFileSync } from "node:child_process";
import { copyFile, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import ora from "ora";
import { dirname, join } from "path";
import { writeSeaConfig } from "./sea-config.js";
// cspell:ignore postject

const [major, minor, patch] = process.versions.node.split(".").map(Number);
if (major < 20) {
  console.error("Cannot build standalone cli on node under 20");
  process.exit(0);
}

const projectRoot = dirname(import.meta.dirname);
const distDir = join(projectRoot, "dist");
const tempDir = join(projectRoot, "temp");
const seaConfigPath = join(tempDir, "sea-config.json");
const blobPath = join(tempDir, "sea-prep.blob");

const exeName = process.platform === "win32" ? "tsp.exe" : "tsp";
const exePath = join(distDir, exeName);

await buildCurrent();

async function buildCurrent() {
  await bundle();
  console.log("");
  await buildWithNodeSea();
  // Cannot codesign on osx with bun https://github.com/oven-sh/bun/issues/7208 so we need to use node-sea
  // await buildWithBun();
}

async function bundle() {
  await action(`Bundling js code`, async () => {
    await esbuild.build({
      entryPoints: ["src/cli.ts"],
      bundle: true,
      outfile: "temp/bundle.cjs",
      platform: "node",
      target: "node22",
      format: "cjs",
    });
  });

  // js-yaml dynamically tries to import esprima which then creates a warning for node sea that can't import anything but built in module even though it is optional
  // https://github.com/nodejs/node/issues/50547
  const content = await readFile(join(tempDir, "bundle.cjs"), "utf-8");
  const updated = content
    .toString()
    .replace(`_require("esprima")`, "undefined")
    .replace("var realRequire = eval(`require`)", "var realRequire = undefined"); // bun issue https://github.com/oven-sh/bun/issues/16440
  await writeFile(join(tempDir, "bundle.cjs"), updated);
}

async function buildWithBun() {
  action(`Build with bun`, async () => {
    execa`bun build --compile temp/bundle.cjs --outfile dist/tsp`;
  });

  if (process.platform === "darwin") {
    // This should get sent to ESRP for official signing
    await action(`Set entitlements for ${exePath}`, async () => {
      // execa`codesign --sign - ${exePath}`;
      const entitlementsPath = join(projectRoot, "scripts", "osx-entitlements.plist");
      execa`codesign --deep -s - -f --options runtime --entitlements ${entitlementsPath} ${exePath}`;
    });
  }
}

async function buildWithNodeSea() {
  await mkdir(distDir, { recursive: true });
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
      const signToolPath = await findSigntool();
      if (signToolPath) {
        execFileSync(signToolPath, [`remove`, `/s`, exePath]);
      } else {
        console.log("Ignore signtool removal on windows, missing.");
        if (process.env.CI) {
          throw new Error("Cannot find signtool.exe in CI");
        }
      }
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

  // On osx we need to register some entitlements for the app to run.
  if (process.platform === "darwin") {
    // This should get sent to ESRP for official signing
    await action(`Sign executable ${exePath}`, async () => {
      const entitlementsPath = join(projectRoot, "scripts", "osx-entitlements.plist");
      execa`codesign --deep -s - -f --options runtime --entitlements ${entitlementsPath} ${exePath}`;
    });
  }
}

async function createSeaConfig() {
  await action(`Creating sea config ${seaConfigPath}`, async () => {
    await writeSeaConfig(seaConfigPath, {
      main: join(projectRoot, "temp/bundle.cjs"),
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

async function findSigntool() {
  try {
    const base = "C:/Program Files (x86)/Windows Kits/10/bin/";

    const files = await readdir(base);
    console.log("Installed", files);
    const latest = files
      .filter((f) => f.startsWith("1"))
      .sort()
      .reverse()[0];

    const resolved = join(base, latest, "x64/signtool.exe");
    console.log("Picking latest", latest);
    console.log("Signtool path: ", resolved);

    return resolved;
  } catch {
    return undefined;
  }
}
