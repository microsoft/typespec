import url, { fileURLToPath, pathToFileURL } from "url";
import yargs from "yargs";
import mkdirp from "mkdirp";
import path, { join, resolve } from "path";
import { compile } from "../compiler/program.js";
import { spawnSync } from "child_process";
import { CompilerOptions } from "../compiler/options.js";
import { DiagnosticError, dumpError, logDiagnostics } from "./diagnostics.js";
import { adlVersion } from "./util.js";
import { stat, readFile, mkdtemp, readdir, rmdir } from "fs/promises";
import os from "os";
import { CompilerHost } from "./types.js";

const args = yargs(process.argv.slice(2))
  .scriptName("adl")
  .help()
  .strict()
  .command("compile <path>", "Compile a directory of ADL files.", (cmd) => {
    return cmd
      .positional("path", {
        description: "The path to folder containing .adl files",
        type: "string",
      })
      .option("output-path", {
        type: "string",
        default: "./adl-output",
        describe:
          "The output path for generated artifacts.  If it does not exist, it will be created.",
      })
      .option("nostdlib", {
        type: "boolean",
        default: false,
        describe: "Don't load the ADL standard library.",
      });
  })
  .command(
    "generate <path>",
    "Generate client and server code from a directory of ADL files.",
    (cmd) => {
      return cmd
        .positional("path", {
          description: "The path to folder containing .adl files",
          type: "string",
        })
        .option("client", {
          type: "boolean",
          describe: "Generate a client library for the ADL definition",
        })
        .option("language", {
          type: "string",
          choices: ["typescript", "csharp", "python"],
          describe: "The language to use for code generation",
        })
        .option("output-path", {
          type: "string",
          default: "./adl-output",
          describe:
            "The output path for generated artifacts.  If it does not exist, it will be created.",
        });
    }
  )
  .command("code", "Manage VS Code Extension.", (cmd) => {
    return cmd
      .demandCommand(1, "No command specified.")
      .command("install", "Install VS Code Extension")
      .command("uninstall", "Uninstall VS Code Extension")
      .option("insiders", { type: "boolean", description: "Use VS Code Insiders" });
  })
  .option("debug", {
    type: "boolean",
    description: "Output debug log messages.",
  })
  .version(adlVersion)
  .demandCommand(1, "You must use one of the supported commands.").argv;

const NodeHost: CompilerHost = {
  readFile: (path: string) => readFile(path, "utf-8"),
  readDir: (path: string) => readdir(path, { withFileTypes: true }),
  getCwd: () => process.cwd(),
  getExecutionRoot: () => resolve(fileURLToPath(import.meta.url), "../../../"),
  getJsImport: (path: string) => import(pathToFileURL(path).href),
  getLibDirs() {
    const rootDir = this.getExecutionRoot();
    return [join(rootDir, "lib"), join(rootDir, "dist/lib")];
  },
  stat(path: string) {
    return stat(path);
  },
};

async function compileInput(compilerOptions: CompilerOptions) {
  try {
    await compile(args.path!, NodeHost, compilerOptions);
  } catch (err) {
    if (err instanceof DiagnosticError) {
      logDiagnostics(err.diagnostics, console.error);
      if (args.debug) {
        console.error(`Stack trace:\n\n${err.stack}`);
      }
      process.exit(1);
    }
    throw err; // let non-diagnostic errors go to top-level bug handler.
  }
}

async function getCompilerOptions(): Promise<CompilerOptions> {
  // Ensure output path
  const outputPath = resolve(args["output-path"]);
  await mkdirp(outputPath);

  return {
    outputPath,
    swaggerOutputFile: resolve(args["output-path"], "openapi.json"),
    nostdlib: args["nostdlib"],
  };
}

async function generateClient(options: CompilerOptions) {
  const clientPath = path.resolve(args["output-path"], "client");
  const autoRestBin = process.platform === "win32" ? "autorest.cmd" : "autorest";
  const autoRestPath = new url.URL(`../../node_modules/.bin/${autoRestBin}`, import.meta.url);

  // Execute AutoRest on the output file
  const result = spawnSync(
    url.fileURLToPath(autoRestPath),
    [
      `--${args.language}`,
      `--clear-output-folder=true`,
      `--output-folder=${clientPath}`,
      `--title=AdlClient`,
      `--input-file=${options.swaggerOutputFile}`,
    ],
    {
      stdio: "inherit",
      shell: true,
    }
  );

  if (result.status === 0) {
    console.log(`Generation completed successfully, output files are in ${options.outputPath}.`);
  } else {
    console.error("\nAn error occurred during client generation.");
    process.exit(result.status || 1);
  }
}

async function installVSCodeExtension() {
  // download npm package to temporary directory
  const temp = await mkdtemp(path.join(os.tmpdir(), "adl"));
  run("npm", ["install", "--silent", "--prefix", temp, "adl-vscode"]);

  // locate .vsix
  const files = await readdir(path.join(temp, "node_modules/adl-vscode"));
  let vsix: string | undefined;
  for (const file of files) {
    if (file.endsWith(".vsix")) {
      vsix = path.join(temp, "node_modules/adl-vscode", file);
      break;
    }
  }
  if (!vsix) {
    throw new Error("Installed adl-vscode from npm, but didn't find its .vsix file.");
  }

  // install extension
  run(args.insiders ? "code-insiders" : "code", ["--install-extension", vsix]);

  // delete temporary directory
  await rmdir(temp, { recursive: true });
}

async function uninstallVSCodeExtension() {
  run(args.insiders ? "code-insiders" : "code", ["--uninstall-extension", "microsoft.adl-vscode"]);
}

function run(command: string, commandArgs: string[]) {
  if (args.debug) {
    console.log(`> ${command} ${commandArgs.join(" ")}`);
  }

  if (process.platform === "win32") {
    command += ".cmd";
  }

  const proc = spawnSync(command, commandArgs, {
    stdio: "inherit",
    // VS Code's CLI emits node warnings that we can't do anything about. Suppress them.
    env: { ...process.env, NODE_NO_WARNINGS: "1" },
  });

  if (proc.error) {
    if ((proc.error as any).code === "ENOENT") {
      console.error(`error: Command '${command}' not found.`);
      if (args.debug) {
        console.log(proc.error.stack);
      }
      process.exit(1);
    } else {
      throw proc.error;
    }
  }

  if (proc.status !== 0) {
    console.error(
      `error: Command '${command} ${commandArgs.join(" ")}' failed with exit code ${proc.status}.`
    );
    process.exit(proc.status ?? 1);
  }
}

async function main() {
  console.log(`ADL compiler v${adlVersion}\n`);
  const command = args._[0];
  let options: CompilerOptions;

  switch (command) {
    case "compile":
      options = await getCompilerOptions();
      await compileInput(options);
      break;
    case "generate":
      options = await getCompilerOptions();
      await compileInput(options);
      if (args.client) {
        await generateClient(options);
      }
      break;
    case "code":
      const action = args._[1];
      switch (action) {
        case "install":
          await installVSCodeExtension();
          break;
        case "uninstall":
          await uninstallVSCodeExtension();
          break;
      }
      break;
  }
}

main()
  .then(() => {})
  .catch((err) => {
    // NOTE: An expected error, like one thrown for bad input, shouldn't reach
    // here, but be handled somewhere else. If we reach here, it should be
    // considered a bug and therefore we should not suppress the stack trace as
    // that risks losing it in the case of a bug that does not repro easily.
    console.error("Internal compiler error!");
    console.error("File issue at https://github.com/azure/adl");
    dumpError(err, console.error);
    process.exit(1);
  });
