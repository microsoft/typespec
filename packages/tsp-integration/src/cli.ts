import { readFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { join, resolve } from "pathe";
import { parse } from "yaml";
import { runIntegrationTestSuite, Stages, type Stage } from "./run.js";
import { projectRoot, ValidationFailedError } from "./utils.js";

process.on("SIGINT", () => process.exit(0));

const args = parseArgs({
  args: process.argv.slice(2),
  allowPositionals: true,
  options: {
    clean: {
      type: "boolean",
      default: false,
    },
    stage: {
      type: "string",
      multiple: true,
    },
    "tgz-dir": {
      type: "string",
    },
    repo: {
      type: "string",
      description: "The path to the repository to test. Defaults temp/{suiteName}.",
    },
    interactive: {
      type: "boolean",
      default: false,
      short: "i",
      description: "Enable interactive mode for validation.",
    },
  },
});

const cwd = process.cwd();
const integrationFolder = join(cwd, ".typespec-integration");
const suiteName = args.positionals[0];
const config = parse(await readFile(join(integrationFolder, "config.yaml"), "utf8"));
const suite = config.suites[suiteName];
if (suite === undefined) {
  throw new Error(`Integration test suite "${suiteName}" not found in config.`);
}

let stages: Stage[] | undefined = undefined;
if (args.values.stage) {
  stages = args.values.stage as Stage[];
  for (const stage of stages) {
    if (!Stages.includes(stage)) {
      throw new Error(
        `Invalid stage "${stage}" specified. Valid stages are: ${Stages.join(", ")}.`,
      );
    }
  }
}

const wd = args.values.repo ?? join(projectRoot, "temp", suiteName);
try {
  await runIntegrationTestSuite(wd, suiteName, suite, {
    clean: args.values.clean,
    stages,
    tgzDir: args.values["tgz-dir"] && resolve(process.cwd(), args.values["tgz-dir"]),
    interactive: args.values.interactive,
  });
} catch (error) {
  if (error instanceof ValidationFailedError) {
    process.exit(1);
  }
  throw error;
}
