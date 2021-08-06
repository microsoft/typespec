import { spawnSync, SpawnSyncOptionsWithStringEncoding } from "child_process";
import { mkdtemp, readdir, rmdir } from "fs/promises";
import mkdirp from "mkdirp";
import os from "os";
import { basename, join, resolve } from "path";
import url from "url";
import yargs from "yargs";
import { CompilerOptions } from "../compiler/options.js";
import { compile } from "../compiler/program.js";
import { loadCadlConfigInDir } from "../config/index.js";
import { compilerAssert, dumpError, logDiagnostics } from "./diagnostics.js";
import { formatCadlFiles } from "./formatter.js";
import { cadlVersion, NodeHost } from "./util.js";

async function main() {
  console.log(`Cadl compiler v${cadlVersion}\n`);

  await yargs(process.argv.slice(2))
    .scriptName("cadl")
    .help()
    .strict()
    .option("debug", {
      type: "boolean",
      description: "Output debug log messages.",
      default: false,
    })
    .command(
      "compile <path>",
      "Compile Cadl source.",
      (cmd) => {
        return cmd
          .positional("path", {
            description: "The path to the main.cadl file or directory containing main.cadl.",
            type: "string",
            demandOption: true,
          })
          .option("output-path", {
            type: "string",
            default: "./cadl-output",
            describe:
              "The output path for generated artifacts.  If it does not exist, it will be created.",
          })
          .option("option", {
            type: "array",
            string: true,
            describe:
              "Key/value pairs that can be passed to Cadl components.  The format is 'key=value'.  This parameter can be used multiple times to add more options.",
          })
          .option("nostdlib", {
            type: "boolean",
            default: false,
            describe: "Don't load the Cadl standard library.",
          });
      },
      async (args) => {
        const options = await getCompilerOptions(args);
        await compileInput(args.path, options);
      }
    )
    .command(
      "generate <path>",
      "Generate client code from Cadl source.",
      (cmd) => {
        return (
          cmd
            .positional("path", {
              description: "The path to folder containing .cadl files",
              type: "string",
              demandOption: true,
            })
            .option("client", {
              type: "boolean",
              describe: "Generate a client library for the Cadl definition",
            })
            .option("language", {
              type: "string",
              choices: ["typescript", "csharp", "python"],
              describe: "The language to use for code generation",
            })
            .option("output-path", {
              type: "string",
              default: "./cadl-output",
              describe:
                "The output path for generated artifacts.  If it does not exist, it will be created.",
            })
            .option("option", {
              type: "array",
              string: true,
              describe:
                "Key/value pairs that can be passed to Cadl components.  The format is 'key=value'.  This parameter can be used multiple times to add more options.",
            })
            // we can't generate anything but a client yet
            .demandOption("client")
            // and language is required to do so
            .demandOption("language")
        );
      },
      async (args) => {
        const options = await getCompilerOptions(args);
        await compileInput(args.path, options, false);
        if (args.client) {
          await generateClient(args["output-path"], args.language, options);
        }
      }
    )
    .command("code", "Manage VS Code Extension.", (cmd) => {
      return cmd
        .demandCommand(1, "No command specified.")
        .option("insiders", {
          type: "boolean",
          description: "Use VS Code Insiders",
          default: false,
        })
        .command(
          "install",
          "Install VS Code Extension",
          () => {},
          (args) => installVSCodeExtension(args.insiders, args.debug)
        )
        .command(
          "uninstall",
          "Uninstall VS Code Extension",
          () => {},
          (args) => uninstallVSCodeExtension(args.insiders, args.debug)
        );
    })
    .command("vs", "Manage Visual Studio Extension.", (cmd) => {
      return cmd
        .demandCommand(1, "No command specified")
        .command(
          "install",
          "Install Visual Studio Extension.",
          () => {},
          (args) => installVSExtension(args.debug)
        )
        .command("uninstall", "Uninstall VS Extension", undefined, () => uninstallVSExtension());
    })
    .command(
      "format <include...>",
      "Format given list of Cadl files.",
      (cmd) => {
        return cmd.positional("include", {
          description: "Wildcard pattern of the list of files.",
          type: "string",
          array: true,
          demandOption: true,
        });
      },
      async (args) => {
        await formatCadlFiles(args["include"], { debug: args.debug });
      }
    )
    .command(
      "info",
      "Show information about current Cadl compiler.",
      () => {},
      () => printInfo()
    )
    .version(cadlVersion)
    .demandCommand(1, "You must use one of the supported commands.").argv;
}

async function compileInput(path: string, compilerOptions: CompilerOptions, printSuccess = true) {
  const program = await compile(path, NodeHost, compilerOptions);
  logDiagnostics(program.diagnostics, console.error);
  if (program.hasError()) {
    process.exit(1);
  }
  if (printSuccess) {
    console.log(
      `Compilation completed successfully, output files are in ${compilerOptions.outputPath}.`
    );
  }
}

async function getCompilerOptions(args: {
  "output-path": string;
  nostdlib?: boolean;
  option?: string[];
}): Promise<CompilerOptions> {
  // Ensure output path
  const outputPath = resolve(args["output-path"]);
  await mkdirp(outputPath);

  const miscOptions: any = {};
  for (const option of args.option || []) {
    const optionParts = option.split("=");
    if (optionParts.length != 2) {
      throw new Error(
        `The --option parameter value "${option}" must be in the format: some-option=value`
      );
    }
    miscOptions[optionParts[0]] = optionParts[1];
  }

  return {
    miscOptions,
    outputPath,
    swaggerOutputFile: resolve(args["output-path"], "openapi.json"),
    nostdlib: args["nostdlib"],
  };
}

async function generateClient(outputPath: string, language: string, options: CompilerOptions) {
  const clientPath = resolve(outputPath, "client");
  const autoRestBin = process.platform === "win32" ? "autorest.cmd" : "autorest";
  const autoRestPath = new url.URL(`../../node_modules/.bin/${autoRestBin}`, import.meta.url);

  // Execute AutoRest on the output file
  console.log(); //newline between compilation output and generation output
  const result = run(
    url.fileURLToPath(autoRestPath),
    [
      `--${language}`,
      `--clear-output-folder=true`,
      `--output-folder=${clientPath}`,
      `--title=CadlClient`,
      `--input-file=${options.swaggerOutputFile}`,
    ],
    {
      shell: true,
    }
  );

  if (result.status === 0) {
    console.log(`\nGeneration completed successfully, output files are in ${clientPath}.`);
  } else {
    console.error("\nClient generation failed.");
    process.exit(result.status || 1);
  }
}

async function installVsix(pkg: string, install: (vsixPaths: string[]) => void, debug: boolean) {
  // download npm package to temporary directory
  const temp = await mkdtemp(join(os.tmpdir(), "cadl"));
  const npmArgs = ["install"];

  // hide npm output unless --debug was passed to cadl
  if (!debug) {
    npmArgs.push("--silent");
  }

  // NOTE: Using cwd=temp with `--prefix .` instead of `--prefix ${temp}` to
  // workaround https://github.com/npm/cli/issues/3256. It's still important
  // to pass --prefix even though we're using cwd as otherwise, npm might
  // find a package.json file in a parent directory and install to that
  // directory.
  npmArgs.push("--prefix", ".");

  // To debug with a locally built package rather than pulling from npm,
  // specify the full path to the packed .tgz using CADL_DEBUG_VSIX_TGZ
  // environment variable.
  npmArgs.push(process.env.CADL_DEBUG_VSIX_TGZ ?? pkg);

  run("npm", npmArgs, { cwd: temp, debug });

  // locate .vsix
  const dir = join(temp, "node_modules", pkg);
  const files = await readdir(dir);
  let vsixPaths: string[] = [];
  for (const file of files) {
    if (file.endsWith(".vsix")) {
      vsixPaths.push(join(dir, file));
    }
  }

  compilerAssert(
    vsixPaths.length > 0,
    `Installed ${pkg} from npm, but didn't find any .vsix files in it.`
  );

  // install extension
  install(vsixPaths);

  // delete temporary directory
  await rmdir(temp, { recursive: true });
}

async function runCode(codeArgs: string[], insiders: boolean, debug: boolean) {
  await run(insiders ? "code-insiders" : "code", codeArgs, {
    // VS Code's CLI emits node warnings that we can't do anything about. Suppress them.
    extraEnv: { NODE_NO_WARNINGS: "1" },
    debug,
  });
}

async function installVSCodeExtension(insiders: boolean, debug: boolean) {
  await installVsix(
    "cadl-vscode",
    (vsixPaths) => {
      runCode(["--install-extension", vsixPaths[0]], insiders, debug);
    },
    debug
  );
}

async function uninstallVSCodeExtension(insiders: boolean, debug: boolean) {
  await runCode(["--uninstall-extension", "microsoft.cadl-vscode"], insiders, debug);
}

function getVsixInstallerPath(): string {
  return getVSInstallerPath(
    "resources/app/ServiceHub/Services/Microsoft.VisualStudio.Setup.Service/VSIXInstaller.exe"
  );
}

function getVSWherePath(): string {
  return getVSInstallerPath("vswhere.exe");
}

function getVSInstallerPath(relativePath: string) {
  if (process.platform !== "win32") {
    console.error("error: Visual Studio extension is not supported on non-Windows.");
    process.exit(1);
  }

  return join(
    process.env["ProgramFiles(x86)"] ?? "",
    "Microsoft Visual Studio/Installer",
    relativePath
  );
}

function isVSInstalled(versionRange: string) {
  const vswhere = getVSWherePath();
  const proc = run(vswhere, ["-property", "instanceid", "-prerelease", "-version", versionRange], {
    stdio: [null, "pipe", "inherit"],
    allowNotFound: true,
  });
  return proc.status === 0 && proc.stdout;
}

const VSIX_ALREADY_INSTALLED = 1001;
const VSIX_NOT_INSTALLED = 1002;
const VSIX_USER_CANCELED = 2005;

async function installVSExtension(debug: boolean) {
  const vsixInstaller = getVsixInstallerPath();
  const versionMap = new Map([
    [
      "Microsoft.Cadl.VS2019.vsix",
      {
        friendlyVersion: "2019",
        versionRange: "[16.0, 17.0)",
        installed: false,
      },
    ],
    [
      "Microsoft.Cadl.VS2022.vsix",
      {
        friendlyVersion: "2022",
        versionRange: "[17.0, 18.0)",
        installed: false,
      },
    ],
  ]);

  let vsFound = false;
  for (const entry of versionMap.values()) {
    if (isVSInstalled(entry.versionRange)) {
      vsFound = entry.installed = true;
    }
  }

  if (!vsFound) {
    console.error("error: No compatible version of Visual Studio found.");
    process.exit(1);
  }

  await installVsix(
    "@azure-tools/cadl-vs",
    (vsixPaths) => {
      for (const vsix of vsixPaths) {
        const vsixFilename = basename(vsix);
        const entry = versionMap.get(vsixFilename);
        compilerAssert(entry, "Unexpected vsix filename:" + vsix);
        if (entry.installed) {
          console.log(`Installing extension for Visual Studio ${entry?.friendlyVersion}...`);
          run(vsixInstaller, [vsix], {
            allowedExitCodes: [VSIX_ALREADY_INSTALLED, VSIX_USER_CANCELED],
          });
        }
      }
    },
    debug
  );
}

async function uninstallVSExtension() {
  const vsixInstaller = getVsixInstallerPath();
  run(vsixInstaller, ["/uninstall:88b9492f-c019-492c-8aeb-f325a7e4cf23"], {
    allowedExitCodes: [VSIX_NOT_INSTALLED, VSIX_USER_CANCELED],
  });
}

/**
 * Print the resolved Cadl configuration.
 */
async function printInfo() {
  const cwd = process.cwd();
  console.log(`Module: ${url.fileURLToPath(import.meta.url)}`);

  const config = await loadCadlConfigInDir(NodeHost, cwd);
  const jsyaml = await import("js-yaml");
  const excluded = ["diagnostics", "filename"];
  const replacer = (key: string, value: any) => (excluded.includes(key) ? undefined : value);

  console.log(`User Config: ${config.filename ?? "No config file found"}`);
  console.log("-----------");
  console.log(jsyaml.dump(config, { replacer }));
  console.log("-----------");
  logDiagnostics(config.diagnostics, console.error);
  if (config.diagnostics.some((d) => d.severity === "error")) {
    process.exit(1);
  }
}

// NOTE: We could also use { shell: true } to let windows find the .cmd, but that breaks
// ENOENT checking and handles spaces poorly in some cases.
const isCmdOnWindows = ["code", "code-insiders", "npm"];

interface RunOptions extends Partial<SpawnSyncOptionsWithStringEncoding> {
  debug?: boolean;
  extraEnv?: NodeJS.ProcessEnv;
  allowNotFound?: boolean;
  allowedExitCodes?: number[];
}

function run(command: string, commandArgs: string[], options?: RunOptions) {
  if (options?.debug) {
    if (options) {
      console.log(options);
    }
    console.log(`> ${command} ${commandArgs.join(" ")}\n`);
  }

  if (options?.extraEnv) {
    options.env = {
      ...(options?.env ?? process.env),
      ...options.extraEnv,
    };
  }

  const baseCommandName = basename(command);
  if (process.platform === "win32" && isCmdOnWindows.includes(command)) {
    command += ".cmd";
  }

  const finalOptions: SpawnSyncOptionsWithStringEncoding = {
    encoding: "utf-8",
    stdio: "inherit",
    ...(options ?? {}),
  };

  const proc = spawnSync(command, commandArgs, finalOptions);
  if (options?.debug) {
    console.log(proc);
  }

  if (proc.error) {
    if ((proc.error as any).code === "ENOENT" && !options?.allowNotFound) {
      console.error(`error: Command '${baseCommandName}' not found.`);
      if (options?.debug) {
        console.log(proc.error.stack);
      }
      process.exit(1);
    } else {
      throw proc.error;
    }
  }

  if (proc.status !== 0 && !options?.allowedExitCodes?.includes(proc.status ?? 0)) {
    console.error(
      `error: Command '${baseCommandName} ${commandArgs.join(" ")}' failed with exit code ${
        proc.status
      }.`
    );
    process.exit(proc.status || 1);
  }

  return proc;
}

function internalCompilerError(error: Error) {
  // NOTE: An expected error, like one thrown for bad input, shouldn't reach
  // here, but be handled somewhere else. If we reach here, it should be
  // considered a bug and therefore we should not suppress the stack trace as
  // that risks losing it in the case of a bug that does not repro easily.
  console.error("Internal compiler error!");
  console.error("File issue at https://github.com/azure/adl");
  dumpError(error, console.error);
  process.exit(1);
}

process.on("unhandledRejection", (error: Error) => {
  console.error("Unhandled promise rejection!");
  internalCompilerError(error);
});

main().catch(internalCompilerError);
