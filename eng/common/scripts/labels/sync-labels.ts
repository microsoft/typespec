import { parseArgs } from "util";
import { syncLabelAutomation } from "./automation.js";
import { syncLabelsDefinitions } from "./definitions.js";
import { resolve } from "path";
import { RepoConfig } from "./types.js";

const options = parseArgs({
  args: process.argv.slice(2),
  options: {
    "config-dir": {
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

if(!options.values["config-dir"]) {
  throw new Error("--config-dir is required");
}

const config = await loadConfig(options.values["config-dir"]);

await syncLabelsDefinitions(config, {
  check: options.values["check"],
  dryRun: options.values["dry-run"],
  github: options.values["github"],
});

await syncLabelAutomation(config, {
  check: options.values["check"],
});


async function loadConfig(dir: string): Promise<RepoConfig> {
  const labelConfigFile = await import(resolve(process.cwd(), dir, "labels.ts"));
  const areaPaths = await import(resolve(process.cwd(), dir, "areas.ts"));

  return {labels: labelConfigFile.default, areaLabels: labelConfigFile.AreaLabels, areaPaths: areaPaths.AreaPaths};
}
