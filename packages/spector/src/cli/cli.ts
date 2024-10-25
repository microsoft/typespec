import { join, resolve } from "path";
import "source-map-support/register.js";
import yargs from "yargs";
import { checkCoverage } from "../actions/check-coverage.js";
import { generateScenarioSummary } from "../actions/generate-scenario-summary.js";
import { validateScenarios } from "../actions/index.js";
import { serve, startInBackground, stop } from "../actions/serve.js";
import { serverTest } from "../actions/server-test.js";
import { uploadCoverageReport } from "../actions/upload-coverage-report.js";
import { uploadScenarioManifest } from "../actions/upload-scenario-manifest.js";
import { validateMockApis } from "../actions/validate-mock-apis.js";
import { logger } from "../logger.js";
import { getCommit } from "../utils/misc-utils.js";

export const DEFAULT_PORT = 3000;

async function main() {
  await yargs(process.argv.slice(2))
    .scriptName("tsp-spector")
    .strict()
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
    .middleware((args) => {
      if (args.debug) {
        logger.level = "debug";
      }
    })
    .command(
      "validate-scenarios <scenariosPaths..>",
      "Compile and validate all the Spec scenarios.",
      (cmd) => {
        return cmd.positional("scenariosPaths", {
          description: "Path(s) to the scenarios",
          type: "string",
          array: true,
          demandOption: true,
        });
      },
      async (args) => {
        let exitDueToPreviousError = false;
        let hasMoreScenarios = true;
        for (let idx = 0; idx < args.scenariosPaths.length; idx++) {
          logger.info(`Validating scenarios at ${args.scenariosPaths[idx]}`);
          if (idx === args.scenariosPaths.length - 1) hasMoreScenarios = false;
          exitDueToPreviousError = await validateScenarios({
            scenariosPath: resolve(process.cwd(), args.scenariosPaths[idx]),
            exitDueToPreviousError,
            hasMoreScenarios,
          });
        }
      },
    )
    .command(
      "generate-scenarios-summary <scenariosPaths..>",
      "Compile and validate all the Spec scenarios.",
      (cmd) => {
        return cmd
          .positional("scenariosPaths", {
            description: "Path(s) to the scenarios",
            type: "string",
            array: true,
            demandOption: true,
          })
          .option("outputFile", {
            type: "string",
            description: "Path to the generated summary file(Markdown).",
            default: join(process.cwd(), "spec-summary.md"),
          });
      },
      async (args) => {
        let overrideOutputFile = false;
        for (const scenariosPath of args.scenariosPaths) {
          logger.info(`Generating scenarios summary for ${scenariosPath}`);
          await generateScenarioSummary({
            scenariosPath: resolve(process.cwd(), scenariosPath),
            outputFile: resolve(process.cwd(), args.outputFile),
            overrideOutputFile,
          });
          overrideOutputFile = true;
        }
      },
    )
    .command("server", "Server management", (cmd) => {
      cmd
        .command(
          "start <scenariosPath>",
          "Start the server in the background.",
          (cmd) => {
            return cmd
              .positional("scenariosPath", {
                description: "Path to the scenarios and mock apis",
                type: "string",
                demandOption: true,
              })
              .option("port", {
                alias: "p",
                type: "number",
                description: "Port where to host the server",
                default: DEFAULT_PORT,
              })
              .option("coverageFile", {
                type: "string",
                description: "Path to the coverage file.",
                default: join(process.cwd(), "spec-coverage.json"),
              });
          },
          async (args) =>
            startInBackground({
              scenariosPath: resolve(process.cwd(), args.scenariosPath),
              port: args.port,
              coverageFile: args.coverageFile,
            }),
        )
        .command(
          "stop",
          "Stop the server running.",
          (cmd) => {
            return cmd.option("port", {
              alias: "p",
              type: "number",
              description: "Port where to host the server",
              default: DEFAULT_PORT,
            });
          },
          async (args) => stop({ port: args.port }),
        );
    })
    .command(
      "serve <scenariosPaths..>",
      "Serve the mock api at the given paths.",
      (cmd) => {
        return cmd
          .positional("scenariosPaths", {
            description: "Path(s) to the scenarios and mock apis",
            type: "string",
            array: true,
            demandOption: true,
          })
          .option("port", {
            alias: "p",
            type: "number",
            description: "Port where to host the server",
            default: DEFAULT_PORT,
          })
          .option("coverageFile", {
            type: "string",
            description: "Path to the coverage file.",
            default: join(process.cwd(), "spec-coverage.json"),
          });
      },
      async (args) => {
        await serve({
          scenariosPath: args.scenariosPaths,
          port: args.port,
          coverageFile: args.coverageFile,
        });
      },
    )
    .command(
      "server-test <scenariosPaths..>",
      "Executes the test cases against the service",
      (cmd) => {
        return cmd
          .positional("scenariosPaths", {
            description: "Path(s) to the scenarios and mock apis",
            type: "string",
            array: true,
            demandOption: true,
          })
          .option("baseUrl", {
            description: "Path to the server",
            type: "string",
          })
          .option("runSingleScenario", {
            description: "Single Scenario Case to run",
            type: "string",
          })
          .option("runScenariosFromFile", {
            description: "File that has the Scenarios to run",
            type: "string",
          })
          .demandOption("scenariosPaths", "serverBasePath");
      },
      async (args) => {
        for (const scenariosPath of args.scenariosPaths) {
          logger.info(`Executing server tests for scenarios at ${scenariosPath}`);
          await serverTest(scenariosPath, {
            baseUrl: args.baseUrl,
            runSingleScenario: args.runSingleScenario,
            runScenariosFromFile: args.runScenariosFromFile,
          });
        }
      },
    )
    .command(
      "check-coverage <scenariosPaths..>",
      "Serve the mock api at the given paths.",
      (cmd) => {
        return cmd
          .positional("scenariosPaths", {
            description: "Path(s) to the scenarios and mock apis",
            type: "string",
            demandOption: true,
          })
          .option("configFile", {
            type: "string",
            description: "Path to config file for generator.",
          })
          .option("coverageFiles", {
            type: "string",
            array: true,
            description: "Path to the created coverage files.",
            default: [join(process.cwd(), "spec-coverage.json")],
          })
          .demandOption("coverageFiles")
          .option("mergedCoverageFile", {
            type: "string",
            description: "Output Path to the merged coverage file.",
            default: join(process.cwd(), "spec-coverage.json"),
          })
          .option("ignoreNotImplemented", {
            type: "boolean",
            description: "Do not fail if there is some non implemented scenarios.",
            default: false,
          });
      },
      async (args) => {
        let exitDueToPreviousError = false;
        let hasMoreScenarios = true;
        for (let idx = 0; idx < args.scenariosPaths.length; idx++) {
          logger.info(`Checking coverage for scenarios at ${args.scenariosPaths[idx]}`);
          if (idx === args.scenariosPaths.length - 1) hasMoreScenarios = false;
          exitDueToPreviousError = await checkCoverage({
            scenariosPath: resolve(process.cwd(), args.scenariosPaths[idx]),
            configFile: args.configFile,
            mergedCoverageFile: resolve(process.cwd(), args.mergedCoverageFile),
            coverageFiles: args.coverageFiles.map((x) => resolve(process.cwd(), x)),
            ignoreNotImplemented: args.ignoreNotImplemented,
            exitDueToPreviousError,
            hasMoreScenarios,
          });
        }
      },
    )
    .command(
      "validate-mock-apis <scenariosPaths..>",
      "Validate mock apis have all the scenarios specified",
      (cmd) => {
        return cmd.positional("scenariosPaths", {
          description: "Path to the scenarios and mock apis",
          type: "string",
          array: true,
          demandOption: true,
        });
      },
      async (args) => {
        let exitDueToPreviousError = false;
        let hasMoreScenarios = true;
        for (let idx = 0; idx < args.scenariosPaths.length; idx++) {
          logger.info(`Validating mock apis for scenarios at ${args.scenariosPaths[idx]}`);
          if (idx === args.scenariosPaths.length - 1) hasMoreScenarios = false;
          exitDueToPreviousError = await validateMockApis({
            scenariosPath: resolve(process.cwd(), args.scenariosPaths[idx]),
            exitDueToPreviousError,
            hasMoreScenarios,
          });
        }
      },
    )
    .command(
      "upload-manifest <scenariosPaths..>",
      "Upload the scenario manifest. DO NOT CALL in generator.",
      (cmd) => {
        return cmd
          .positional("scenariosPaths", {
            description: "Path to the scenarios and mock apis",
            type: "string",
            array: true,
            demandOption: true,
          })
          .option("storageAccountName", {
            type: "string",
            description: "Name of the storage account",
          })
          .demandOption("storageAccountName");
      },
      async (args) => {
        for (const scenariosPath of args.scenariosPaths) {
          logger.info(`Uploading scenario manifest for scenarios at ${scenariosPath}`);
          await uploadScenarioManifest({
            scenariosPath: resolve(process.cwd(), scenariosPath),
            storageAccountName: args.storageAccountName,
          });
        }
      },
    )
    .command(
      "upload-coverage",
      "Upload the coverage report.",
      (cmd) => {
        return cmd
          .option("coverageFile", {
            type: "string",
            description: "Path to the coverage file to upload.",
            default: join(process.cwd(), "spec-coverage.json"),
          })
          .demandOption("coverageFile")
          .option("storageAccountName", {
            type: "string",
            description: "Name of the storage account",
            default: join(process.cwd(), "spec-coverage.json"),
          })
          .demandOption("storageAccountName")
          .option("generatorName", {
            type: "string",
            description: "Name of generator",
          })
          .demandOption("generatorName")
          .option("generatorVersion", {
            type: "string",
            description: "Version of generator",
          })
          .demandOption("generatorVersion")
          .option("generatorCommit", {
            type: "string",
            description:
              "Git sha of the generator. Resolved automatically if command is run inside of repository.",
          })
          .option("generatorMode", {
            type: "string",
            description: "Mode of generator to upload.",
          })
          .demandOption("generatorMode");
      },
      async (args) => {
        await uploadCoverageReport({
          coverageFile: resolve(process.cwd(), args.coverageFile),
          storageAccountName: args.storageAccountName,
          generatorName: args.generatorName,
          generatorVersion: args.generatorVersion,
          generatorCommit: args.generatorCommit ?? getCommit(process.cwd()),
          generatorMode: args.generatorMode,
        });
      },
    )
    .demandCommand(1, "You must use one of the supported commands.")
    .parse();
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.log("Error", error);
  process.exit(1);
});

process.once("SIGTERM", () => process.exit(143));
process.once("SIGINT", () => process.exit(2));
process.once("SIGUSR1", () => process.exit(2));
process.once("SIGUSR2", () => process.exit(2));
