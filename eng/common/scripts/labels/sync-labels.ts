import { parseArgs } from "util";
import { syncLabelAutomation } from "./automation.js";
import { syncLabelsDefinitions } from "./definitions.js";

const options = parseArgs({
  args: process.argv.slice(2),
  options: {
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

await syncLabelsDefinitions({
  check: options.values["check"],
  dryRun: options.values["dry-run"],
  github: options.values["github"],
});

await syncLabelAutomation({
  check: options.values["check"],
});
