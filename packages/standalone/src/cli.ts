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
import { mkdir, rm, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

if (process.env.TYPESPEC_CLI_PASSTHROUGH === "1") {
  process.argv.shift(); // We receive ["tsp", "tsp", "entrypoint"] and we want to match ["node", "entrypoint"]
  process.execArgv = [];
  import(pathToFileURL(process.argv[1]).href).catch((e) => {
    // eslint-disable-next-line no-console
    console.log(e);
    process.exit(1);
  });
} else {
  const tspDir = homedir() + "/.tsp";

  const args = parseArgs({
    options: {
      server: { type: "string" },
      "no-cache": { type: "boolean", default: false },
    },
    strict: false,
  });
  async function main() {
    if (args.values.server) {
      await import(pathToFileURL(args.values.server as string).href);
    } else if (process.env.TYPESPEC_COMPILER_PATH) {
      await import(pathToFileURL(process.env.TYPESPEC_COMPILER_PATH).href);
    } else {
      await installAndRun({ noCache: args.values["no-cache"] as boolean });
    }
  }
  async function installAndRun({ noCache }: { noCache: boolean }) {
    await install({
      noCache,
      installDir: tspDir + "/compiler-installs",
    });

    const url = pathToFileURL(
      tspDir + "/compiler-installs/node_modules/@typespec/compiler/cmd/tsp.js",
    ).href;
    (globalThis as any).TYPESPEC_ENGINE = "tsp";
    await import(url);
  }

  main().catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit(1);
  });

  interface InstallOptions {
    installDir: string;
    noCache?: boolean;
  }

  const plugins = {
    "@yarnpkg/plugin-npm": npmPlugin,
    "@yarnpkg/plugin-nm": nmPlugin,
    "@yarnpkg/plugin-pnp": pnpPlugin,
  };
  async function install(options: InstallOptions) {
    const installDir = options.installDir;
    if (options.noCache) {
      await rm(installDir, { recursive: true, force: true });
    }
    await mkdir(installDir, { recursive: true });
    await writeFile(
      installDir + "/package.json",
      JSON.stringify({
        dependencies: { "@typespec/compiler": process.env.TYPESPEC_CLI_GLOBAL_VERSION ?? "latest" },
      }),
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
}
