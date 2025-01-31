import {
  Cache,
  Configuration,
  LightReport,
  MessageName,
  Project,
  stringifyMessageName,
} from "@yarnpkg/core";
import { npath } from "@yarnpkg/fslib";
import nmPlugin from "@yarnpkg/plugin-nm";
import npmPlugin from "@yarnpkg/plugin-npm";
import pnpPlugin from "@yarnpkg/plugin-pnp";
import { mkdir, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { pathToFileURL } from "node:url";

const tspDir = homedir() + "/.tsp";

async function main() {
  await install({
    npxCache: tspDir + "/installs",
  });

  const url = pathToFileURL(
    tspDir + "/installs/node_modules/@typespec/compiler/entrypoints/cli.js",
  ).href;
  await import(url);
}

main().catch(console.error);

interface InstallOptions {
  npxCache: string;
}

const plugins = {
  "@yarnpkg/plugin-npm": npmPlugin,
  "@yarnpkg/plugin-nm": nmPlugin,
  "@yarnpkg/plugin-pnp": pnpPlugin,
};
async function install(options: InstallOptions) {
  const installDir = options.npxCache;
  await mkdir(installDir, { recursive: true });
  await writeFile(
    installDir + "/package.json",
    JSON.stringify({ dependencies: { "@typespec/compiler": "latest" } }),
    "utf8",
  );

  const path = npath.toPortablePath(installDir);
  const configuration = await Configuration.find(path, {
    modules: new Map(Object.entries(plugins)),
    plugins: new Set(Object.keys(plugins)),
  });
  configuration.use(`<compat>`, { nodeLinker: `node-modules` }, path, {
    overwrite: true,
  });
  const cache = await Cache.find(configuration);
  const { project } = await Project.find(configuration, path);
  await project.restoreInstallState({ restoreResolutions: false });

  const report = await ErrorReport.start(
    {
      configuration,
      stdout: process.stdout,
    },
    async (report: ErrorReport) => {
      await project.install({
        cache,
        report,
      });
    },
  );

  if (report.hasErrors()) {
    throw new Error(report.errorReport);
  }
}

class ErrorReport extends LightReport {
  errors: { name: string; text: string }[] = [];

  static start = (
    opts: Parameters<typeof LightReport.start>[0],
    cb: (report: ErrorReport) => Promise<void>,
  ) => super.start(opts, cb as any) as Promise<ErrorReport>;

  reportError = (name: MessageName, text: string) =>
    this.errors.push({ name: stringifyMessageName(name), text });

  hasErrors = () => this.errors.length > 0;

  get errorReport() {
    return this.errors.map((error) => `${error.name} - ${error.text}`).join("\n");
  }
}
