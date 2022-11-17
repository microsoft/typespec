import { promises as fsPromises } from "fs";
const readFile = fsPromises.readFile;
const readDir = fsPromises.readdir;
const statFile = fsPromises.stat;
import * as path from "path";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { Application as TypeDocApplication, TSConfigReader, TypeDocReader } from "typedoc";
import { loadTheme } from "./theme/theme.js";

async function runTypeDoc({ outputFolder, cwd }: { outputFolder: string; cwd: string }) {
  const oldCwd = process.cwd();
  process.chdir(cwd);
  const app = new TypeDocApplication();
  app.options.addReader(new TSConfigReader());
  app.options.addReader(new TypeDocReader());

  loadTheme(app);

  app.bootstrap({
    entryPoints: ["src/index.ts"],
    excludeInternal: true,
    excludePrivate: true,
    skipErrorChecking: true,
    gaID: "UA-62780441-43",
    theme: "azureSdk",
  });

  const project = app.convert();

  if (project) {
    await app.generateDocs(project, outputFolder);
  } else {
    console.error("Failed converting project in TypeDoc");
    process.exit(1);
  }

  process.chdir(oldCwd);
}

async function fileExists(filePath: string) {
  try {
    await statFile(filePath);
    return true;
  } catch (err) {
    return false;
  }
}

/* Traversing the directory */
async function getChecks(dir: string) {
  const checks = {
    isPrivate: false,
    srcPresent: false,
    srcIndexPresent: false,
    version: "0",
    packageName: "",
  };

  checks.srcPresent = await fileExists(path.join(dir, "src"));
  checks.srcIndexPresent = await fileExists(path.join(dir, "src", "index.ts"));
  try {
    const packageJson = JSON.parse(await readFile(path.join(dir, "package.json"), "utf8"));
    checks.isPrivate = packageJson.private === true;
    checks.version = packageJson.version;
    checks.packageName = packageJson.name;
  } catch (e) {
    // ignore missing package.json
    console.info(`No package.json found inside ${dir}`);
  }

  return checks;
}

async function executeTypedoc(serviceDir: string) {
  const CWD = process.cwd();
  console.log(`process.cwd = ${CWD}`);
  const serviceDirPath = path.join(CWD, serviceDir);
  const stat = await statFile(serviceDirPath);

  if (!stat.isDirectory()) {
    return;
  }

  const packageList = await readDir(serviceDirPath, { withFileTypes: true });

  for (const eachPackage of packageList) {
    if (!eachPackage.isDirectory()) {
      continue;
    }
    const eachPackagePath = path.join(serviceDirPath, eachPackage.name);
    console.log(`Path: ${eachPackagePath}`);
    const checks = await getChecks(eachPackagePath);
    console.log(`checks after walk: ${JSON.stringify(checks, null, 2)}`);

    if (checks.isPrivate) {
      console.log("...SKIPPING Since package marked as private...");
      continue;
    } else if (!checks.srcPresent) {
      console.log("...SKIPPING Since src folder could not be found.....");
      continue;
    } else if (!checks.srcIndexPresent) {
      // TypeDoc now requires an explicit entry point.
      console.error("...SKIPPING Since project is missing src/index.ts...");
      continue;
    } else {
      const artifactName = checks.packageName.replace("@", "").replace("/", "-");
      const outputFolder = path.join(CWD, "docGen", artifactName, checks.version);

      await runTypeDoc({
        cwd: eachPackagePath,
        outputFolder,
      });
    }
  }
}

async function main() {
  const argv = yargs(hideBin(process.argv))
    .strict()
    .options({
      serviceDir: {
        type: "string",
        describe: "name of service directory to generate package docs",
        demandOption: true,
      },
    })
    .help()
    .parseSync();

  if (argv.serviceDir === "not-specified") {
    console.error(`Service directory not specified.`);
    process.exit(1);
  }

  await executeTypedoc(argv.serviceDir);

  console.log("All done!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
