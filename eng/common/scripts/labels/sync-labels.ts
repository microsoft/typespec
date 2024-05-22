import { resolve } from "path";
import { parseArgs } from "util";
import { syncLabelAutomation } from "./automation.js";
import { syncLabelsDefinitions } from "./definitions.js";
import { RepoConfig } from "./types.js";

const options = parseArgs({
  args: process.argv.slice(2),
  options: {
    config: {
      type: "string",
      description: "The directory where the labels configuration is stored.",
    },
    "dry-run": {
      type: "boolean",
      description: "Do not make any changes, log what action would be taken.",
    },
    check: {
      type: "boolean",
      description: "Check if labels are in sync, return non zero exit code if not.",
    },
    github: { type: "boolean", description: "Include github labels" },
  },
});

if (!options.values["config"]) {
  throw new Error("--config is required");
}

const config = await loadConfig(options.values["config"]);

await syncLabelsDefinitions(config, {
  check: options.values["check"],
  dryRun: options.values["dry-run"],
  github: options.values["github"],
});

await syncLabelAutomation(config, {
  check: options.values["check"],
});

async function loadConfig(configFile: string): Promise<RepoConfig> {
  const module = await import(resolve(process.cwd(), configFile));
  return module.default;
}
