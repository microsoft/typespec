try {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  await import("source-map-support/register.js");
} catch {
  // package only present in dev.
}

import yargs from "yargs";
import { typespecVersion } from "../../utils/misc.js";
import { installTypeSpecDependencies } from "../install.js";
import { compileAction } from "./actions/compile/compile.js";
import { formatAction } from "./actions/format.js";
import { printInfoAction } from "./actions/info.js";
import { initAction } from "./actions/init.js";
import { installVSExtension, uninstallVSExtension } from "./actions/vs.js";
import {
  InstallVSCodeExtensionOptions,
  UninstallVSCodeExtensionOptions,
  installVSCodeExtension,
  uninstallVSCodeExtension,
} from "./actions/vscode.js";
import {
  CliHostArgs,
  handleInternalCompilerError,
  withCliHost,
  withCliHostAndDiagnostics,
} from "./utils.js";

async function main() {
  // eslint-disable-next-line no-console
  console.log(`TypeSpec compiler v${typespecVersion}\n`);

  await yargs(process.argv.slice(2))
    .scriptName("tsp")
    .help()
    .strict()
    .parserConfiguration({
      "greedy-arrays": false,
      "boolean-negation": false,
    })
    .option("debug", {
      type: "boolean",
      description: "Output debug log messages.",
      default: false,
    })
    .option("pretty", {
      type: "boolean",
      description:
        "Enable color and formatting in TypeSpec's output to make compiler errors easier to read.",
      default: true,
    })
    .command(
      "compile <path>",
      "Compile TypeSpec source.",
      (cmd) => {
        return cmd
          .positional("path", {
            description: "The path to the main.tsp file or directory containing main.tsp.",
            type: "string",
            demandOption: true,
          })
          .option("output-path", {
            type: "string",
            deprecated: "Use `output-dir` instead.",
            hidden: true,
          })
          .option("output-dir", {
            type: "string",
            describe:
              "The output path for generated artifacts.  If it does not exist, it will be created.",
          })
          .option("options", {
            type: "array",
            alias: "option",
            string: true,
            describe:
              "Key/value pairs that can be used to set emitter options. The format is '<emitterName>.<key>=<value>'. This parameter can be used multiple times to add more options.",
          })
          .option("nostdlib", {
            type: "boolean",
            default: false,
            describe: "Don't load the TypeSpec standard library.",
          })
          .option("import", {
            type: "array",
            string: true,
            describe:
              "Additional imports to include.  This parameter can be used multiple times to add more imports.",
          })
          .option("watch", {
            type: "boolean",
            default: false,
            describe: "Watch project files for changes and recompile.",
          })
          .option("emit", {
            type: "array",
            string: true,
            describe: "Name of the emitters",
          })
          .option("trace", {
            type: "array",
            string: true,
            describe: "List of areas that should have the trace shown. e.g. `import-resolution.*`",
          })
          .option("config", {
            type: "string",
            describe:
              "The path to a TypeSpec config YAML file or a folder that contains a 'tspconfig.yaml' file.",
          })
          .option("warn-as-error", {
            type: "boolean",
            describe: "Treat warnings as errors and return non-zero exit code if there are any.",
          })
          .option("no-emit", {
            type: "boolean",
            describe: "Run emitters but do not emit any output.",
          })
          .option("ignore-deprecated", {
            type: "boolean",
            default: false,
            describe: "Suppresses all `deprecated` diagnostics.",
          })
          .option("arg", {
            type: "array",
            alias: "args",
            string: true,
            describe: "Key/value of arguments that are used in the configuration.",
          });
      },
      withCliHost((host, args) => compileAction(host, args)),
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
          withCliHostAndDiagnostics<CliHostArgs & InstallVSCodeExtensionOptions>((host, args) =>
            installVSCodeExtension(host, args),
          ),
        )
        .command(
          "uninstall",
          "Uninstall VS Code Extension",
          () => {},
          withCliHostAndDiagnostics<CliHostArgs & UninstallVSCodeExtensionOptions>((host, args) =>
            uninstallVSCodeExtension(host, args),
          ),
        );
    })
    .command("vs", "Manage Visual Studio Extension.", (cmd) => {
      return cmd
        .demandCommand(1, "No command specified")
        .command(
          "install",
          "Install Visual Studio Extension.",
          () => {},
          withCliHostAndDiagnostics((host) => installVSExtension(host)),
        )
        .command(
          "uninstall",
          "Uninstall VS Extension",
          () => {},
          withCliHostAndDiagnostics((host) => uninstallVSExtension(host)),
        );
    })
    .command(
      "format <include...>",
      "Format given list of TypeSpec files.",
      (cmd) => {
        return cmd
          .positional("include", {
            description: "Wildcard pattern of the list of files.",
            type: "string",
            array: true,
            demandOption: true,
          })
          .option("exclude", {
            alias: "x",
            type: "string",
            array: true,
            describe: "Pattern to exclude",
          })
          .option("check", {
            alias: "c",
            type: "boolean",
            describe: "Verify the files are formatted.",
          });
      },
      withCliHost((host, args) => formatAction(host, args)),
    )
    .command(
      "init [templatesUrl]",
      "Create a new TypeSpec project.",
      (cmd) =>
        cmd
          .positional("templatesUrl", {
            description: "Url of the initialization template",
            type: "string",
          })
          .option("template", {
            type: "string",
            description: "Name of the template to use",
          }),
      withCliHostAndDiagnostics((host, args) => initAction(host, args)),
    )
    .command(
      "install",
      "Install TypeSpec dependencies",
      () => {},
      withCliHost((host) => installTypeSpecDependencies(host, process.cwd())),
    )
    .command(
      "info",
      "Show information about the current TypeSpec compiler.",
      () => {},
      withCliHostAndDiagnostics((host) => printInfoAction(host)),
    )
    .version(typespecVersion)
    .demandCommand(1, "You must use one of the supported commands.").argv;
}

process.on("unhandledRejection", (error: unknown) => {
  // eslint-disable-next-line no-console
  console.error("Unhandled promise rejection!");
  handleInternalCompilerError(error);
});

main().catch(handleInternalCompilerError);
